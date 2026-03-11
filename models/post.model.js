const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    description: {
        type: String,
        require: true,
    },
    postImage: {
        type: String,
    },
    commentsCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    likesCount: {
        type: Number,
        default: 0
    },
}, { timestamps: true });


module.exports = mongoose.model("Post", postSchema);