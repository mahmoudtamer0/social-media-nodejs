const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    chatType: {
        type: String,
        require: true,
        enum: ["normal", "group"],
        default: "normal"
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }
}, { timestamps: true });


module.exports = mongoose.model("Chat", chatSchema);