const Card = require('../../models/Card');
const chat = require('../../utils/chat.js');
const { getCookieValue } = require('../../utils/cookies.js');

const defaultPlayerValues = {
    connected: false,
    nickname: null,
    ready: false,
    points: 0,
}

module.exports = async (io) => {
    const cards = await Card.find({});
    const currentTurnRevealedCards = [];
    const players = [{...defaultPlayerValues}, {...defaultPlayerValues}];
    const revealedCards = [];
    let changingTurn = false;
    let gameRunning = false;
    let whoseTurn = 0;

    //Handle a socket connection request from web client
    io.on('connection', socket => {
        let userNickname = 'unknown';

        // Define methods
        const addPoints = () => {
            players[whoseTurn].points++;
            emitUpdatedPoints(io);
        };

        const changePlayerTurn = () => {
            whoseTurn === 0 ? whoseTurn = 1 : whoseTurn = 0;
            emitChangePlayerTurn();
        };

        const checkIfRevealed = (index) => (
            revealedCards.includes(index.toString()) || currentTurnRevealedCards.includes(index.toString())
        );

        const determineTheWinner = () => {
            if (players[0].points === players[1].points) {
                return `DRAW!`;
            } else {
                const winner = players[0].points > players[1].points ? 0 : 1;
                return `Player ${players[winner].nickname} won the game!`;
            }
        };

        const endGame = () => {
            if (revealedCards.length === cards.length)
                io.emit('send-winner', (determineTheWinner()));
            gameRunning = false;
            io.emit('end-game');
        };

        const resetGame = () => {
            currentTurnRevealedCards.length = 0;
            revealedCards.length = 0;
            players[0].ready = false;
            players[0].points = 0;
            players[1].ready = false;
            players[1].points = 0;
            whoseTurn = 0;
            shuffleCards(cards);
        };

        const resetPlayer = () => {
            players[returnPlayerIndex()] = {...defaultPlayerValues};
        };

        const returnPlayerIndex = () => (
            players.findIndex((player) => player.nickname === userNickname)
        );

        const shuffleCards = array => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        };

        const startGame = () => {
            gameRunning = true;
            emitChangePlayerTurn();
            emitUpdatedPoints(io);
            io.emit('start-game');
            updateBoard(io);
        };

        const startNewTurn = () => {
            const doCardsMatch = cards.find((card) => card.index === parseInt(currentTurnRevealedCards[0])).pair === parseInt(currentTurnRevealedCards[1]);

            if (doCardsMatch) {
                addPoints();
                revealedCards.push(currentTurnRevealedCards[0], currentTurnRevealedCards[1]);
                currentTurnRevealedCards.length = 0;
            }

            if (revealedCards.length === cards.length) {
                endGame();
            } else {
                changingTurn = true;
                setTimeout(() => {
                    if (!doCardsMatch) {
                        changePlayerTurn();
                    }
                    currentTurnRevealedCards.length = 0;
                    changingTurn = false;
                    updateBoard(io);
                }, 1000);
            }
        };

        const updateBoard = (destination) => {
            const shuffledCards = [];
            for (let i = 0; i < cards.length; i++) {
                shuffledCards.push({
                    index: cards[i].index,
                    img: checkIfRevealed(cards[i].index) ? cards[i].img : '/images/card.svg',
                });
            }
            destination.emit('render-board', shuffledCards);
        };

        // Define emitters
        const emitChangePlayerTurn = () => (
            io.emit('change-player-turn', whoseTurn)
        );

        const emitCheckPlayers = (destination) => (
            destination.emit('check-players', players)
        );

        const emitUpdatedPoints = (destination) => {
            if (players.some((player) => player.points > 0) || gameRunning) {
                destination.emit('update-points', players.map((player) => player.points));
            }
        };

        const onDisconnect = () => (
            socket.on('disconnect', () => {
                if (returnPlayerIndex() !== -1) {
                    resetPlayer();
                    emitCheckPlayers(io);

                    if (gameRunning) {
                        endGame();
                    }
                }
                socket.broadcast.emit('player-connection', userNickname, false)
            })
        );

        const onJoinGame = () => (
            socket.on('join-game', (whichPlayer) => {
                if (!players[whichPlayer].connected && !players.find((player) => player.nickname === userNickname)) {
                    players[whichPlayer] = {
                        defaultPlayerValues,
                        connected: true,
                        nickname: userNickname,
                    };
                    emitCheckPlayers(io);
                }
            })
        );

        const onPlayerReadyChange = () => (
            socket.on('player-ready-change', () => {
                if (!gameRunning && players[returnPlayerIndex()]) {
                    players[returnPlayerIndex()].ready = !players[returnPlayerIndex()].ready;
                    if (players.every((player) => player.ready === true)) {
                        resetGame();
                        emitCheckPlayers(io);
                        startGame();
                    }
                    emitCheckPlayers(io);
                }
            })
        );

        const onReceiveUserName = () => (
            socket.on('receive-user-name', (token) => {
                userNickname = getCookieValue(token, 'userNickname');
                // Initialize chat session
                chat(io, socket, userNickname);
                io.emit('player-connection', userNickname, true);
            })
        );

        const onShowCard = () => (
            socket.on('show-card', (index) => {
                if (
                    gameRunning
                    && !changingTurn
                    && returnPlayerIndex() === whoseTurn
                    && !revealedCards.includes(index)
                    && !currentTurnRevealedCards.includes(index)
                ) {
                    if (currentTurnRevealedCards.length < 2) {
                        currentTurnRevealedCards.push(index);
                    }
                    updateBoard(io);

                    if (currentTurnRevealedCards.length === 2) {
                        startNewTurn();
                    }
                }
            })
        );

        // Run the game's script and emitters
        // Prepare receivers
        onDisconnect();
        onJoinGame();
        onPlayerReadyChange();
        onReceiveUserName();
        onShowCard();

        // Get userNickname
        socket.emit('send-user-name');

        // Pull the current state of the board and other players
        emitCheckPlayers(socket);
        emitUpdatedPoints(socket);
        updateBoard(socket);
    });
};
