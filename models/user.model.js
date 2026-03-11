const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },

    profilePic: {
        type: String,
        default: "https://res.cloudinary.com/ddgniiotg/image/upload/v1773086407/default_eop2qt.jpg"
    },
    cloudinary_id: {
        type: String,
        default: "default"
    },
});


module.exports = mongoose.model("User", userSchema);