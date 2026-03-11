const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    description: {
        type: String,
        require: true
    },

    type: {
        type: String,
        enum: [
            "like",
            "comment",
            "reply",
            "friend_request",
            "accept_request",
        ],
        required: true
    },

    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },

    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });


module.exports = mongoose.model("Notification", notificationSchema);