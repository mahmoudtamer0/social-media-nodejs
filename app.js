const express = require("express");
require("dotenv").config();

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
const usersRouter = require("./routers/user.router");
const globalErrorHandler = require("./middlewares/error");

const fs = require("fs");

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Static Files
app.use("/uploads", express.static("uploads"));


app.use('/api/v1/users', usersRouter)
app.use(globalErrorHandler);

module.exports = app