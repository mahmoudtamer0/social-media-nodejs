const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utilities/cloudinary");


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "users",
        allowed_formats: ["jpg", "png", "jpeg"]
    }
});

const upload = multer({ storage: storage });

module.exports = upload; 