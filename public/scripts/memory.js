import { io } from "./session.mjs";

const readyBtn = document.querySelector('#readyBtn');
const player0Nickname = document.querySelector('#player0Nickname');
const player1Nickname = document.querySelector('#player1Nickname');
const player0Wrapper = document.querySelector('#player0Wrapper');
const player1Wrapper = document.querySelector('#player1Wrapper');
const player0Points = document.querySelector('#player0Points');
const player1Points = document.querySelector('#player1Points');
const board = document.querySelector('#board');
const winner = document.querySelector('#winner');
const soundtrack = new Audio('./sounds/Witcher4.mp3');
const winningSound = new Audio('./sounds/winning.mp3');

player0Nickname.addEventListener('click', () => joinGame('0'));
player1Nickname.addEventListener('click', () => joinGame('1'));
readyBtn.addEventListener('click', () => {
    io.emit('player-ready-change');
});

// Check player status
io.on('check-players', players => {
    players.forEach((player, index) => {
        renderPlayerState(player.nickname, player.ready, index);
    });
});

io.on('start-game', () => {
    document.querySelector('body').className = '';
    winner.innerHTML = '';
    readyBtn.className = 'hidden';
    changeReadyState(false, 0);
    changeReadyState(false, 1);
    soundtrack.play();
    soundtrack.loop = true;
    board.className = 'active';
});

io.on('render-board', cards => {
    let cardsToRender = '';
    cards.forEach((card) => (
        cardsToRender += `<img data-index="${card.index}" src="${card.img}" alt="karta" />`
    ))
    board.innerHTML = cardsToRender;

    const targetCards = board.querySelectorAll('img');
    targetCards.forEach((card) => {
        card.addEventListener('click', () => showCard(card.dataset.index))
    })

    const flipCard = new Audio('sounds/flip_card.mp3');
    flipCard.play();
});

io.on('change-player-turn', (player) => {
    if (player === parseInt(0)) {
        player0Wrapper.className = 'active';
        player1Wrapper.className = '';
    } else {
        player0Wrapper.className = '';
        player1Wrapper.className = 'active';
    }
})

io.on('update-points', (points) => {
    player0Points.innerHTML = `${points[0]}p`;
    player1Points.innerHTML = `${points[1]}p`;
})

io.on('send-winner', (winningMsg) => {
    winningSound.play();
    winner.innerHTML = winningMsg;
    document.querySelector('body').className = 'winning';
})

io.on('end-game', () => {
    readyBtn.className = '';
    player0Wrapper.className = '';
    player1Wrapper.className = '';
})


const joinGame = (whichPlayer) => {
    io.emit('join-game', whichPlayer);
};

const showCard = (index) => {
    io.emit('show-card', index);
};

const changeReadyState = (isReady, index) => {
    const playerNicknameElement = document.querySelector(`#player${index}Nickname`);
    if (isReady) {
        playerNicknameElement.className += 'ready';
    } else {
        playerNicknameElement.className.replace('ready', '');
    }
};

const renderPlayerState = (nickname, isReady, index) => {
    const playerNicknameElement = document.querySelector(`#player${index}Nickname`);
    if (nickname){
        playerNicknameElement.className = '';
        playerNicknameElement.innerHTML = nickname;
    } else {
        playerNicknameElement.className = 'join';
        playerNicknameElement.innerHTML = 'Click to join';
    }
    changeReadyState(isReady, index);
};
