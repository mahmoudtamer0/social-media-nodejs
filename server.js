const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { initSocket } = require("./sockets/sockets");

const server = http.createServer(app);

mongoose.connect(process.env.DB_URL)
    .then(() => {

        console.log("DB Connected");

        initSocket(server);

        server.listen(4000, () => {
            console.log("Server running on port 4000");
        });

    })
    .catch(err => console.log(err));