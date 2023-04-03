require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const PORT = process.env.STATUS === 'PRODUCTION' ? process.env.PROD_PORT : process.env.DEV_PORT;
const socketio = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const memorySession = require('./controllers/games/memoryController.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());

// routes
app.get('*', checkUser);
app.get('/home', (req, res) => res.render('home'));
app.get('/memory', requireAuth, (req, res) => res.render('memory'));
app.use(authRoutes);
app.get('/*', (req, res) => res.render('home'));

// database connection
mongoose.connect(process.env.DB_URI)
    .then(() => {
        app.listen(3000);
        console.log('Database connected successfully');
    })
    .catch((err) => console.log(err));

// Start server
server.listen(PORT, () => console.log(`Server in ${process.env.STATUS} mode, running on port ${PORT}`));

memorySession(io);
