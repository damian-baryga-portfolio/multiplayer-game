const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    index: {
        type: Number,
    },
    img: {
        type: String,
    },
    pair: {
        type: Number,
    }
});

const Card = mongoose.model('card', cardSchema);

module.exports = Card;