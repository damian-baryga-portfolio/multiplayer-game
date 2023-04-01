module.exports = (io, socket, userName) => {
    socket.on('send-message', (message) => {
        if (message.length > 0 && message.length < 200) {
            io.emit('update-chat-history', userName, message);
            socket.emit('confirm-message-sent', true);
        } else {
            socket.emit('confirm-message-sent', false);
        }
    });
};
