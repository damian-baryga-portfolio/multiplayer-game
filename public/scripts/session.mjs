const ioConnection = io();

ioConnection.on('send-user-name', () => {
    ioConnection.emit('receive-user-name', document.cookie)
});

export {
    ioConnection as io
}