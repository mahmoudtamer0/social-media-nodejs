const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("FriendShip", friendshipSchema);