const { Server } = require("socket.io");
const { verifyJWT } = require("../utilities/verifyJWT")
const chatSockets = require("./chat.sockets")
const postSockets = require("./post.sockets")
const friendShips = require("./friendShips.socket")
let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.use((socket, next) => {

        const token = socket.handshake.auth.token;
        if (!token || token == undefined) return next(new Error("Authentication error"));

        const decoded = verifyJWT(token)
        if (!decoded) {
            return next(new Error("Authentication error"));
        }
        socket.user = decoded;

        next();
    })

    io.on("connection", (socket) => {
        socket.join(socket.user.id)
        chatSockets(io, socket)
        postSockets(io, socket)
        friendShips(io, socket)
        socket.on("disconnect", () => {
        });

    });

};

module.exports = { initSocket };