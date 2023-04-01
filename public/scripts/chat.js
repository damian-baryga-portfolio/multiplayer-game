import { io } from "./session.mjs";

const chat = document.querySelector('#chat');
const chatHistory = document.querySelector('#chatHistory');

chat.addEventListener('keydown', (e) => {
    chat.className = '';
    if (e.key === 'Enter'){
        e.preventDefault();
        io.emit('send-message', e.target.value);
    }
});

const addMessage = (message) => {
    chatHistory.innerHTML = `<p>${message}</p>` + chatHistory.innerHTML;
};

io.on('update-chat-history', (userName, newMessage) => {
    addMessage(`${userName}: ${newMessage}`);
});

io.on('confirm-message-sent', (wasSentSuccessfully) => {
    if (wasSentSuccessfully) {
        chat.value = '';
    } else {
        chat.className = 'error';
    }
});

io.on('player-connection', (nickname, hasConnected) => {
    if (hasConnected) {
        addMessage(`Player ${nickname} connected`);
    } else {
        addMessage(`Player ${nickname} disconnected`);
    }
});

io.on('send-winner', (winningMsg) => {
    addMessage(winningMsg);
})
