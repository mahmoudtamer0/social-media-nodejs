const { createMessage } = require("../services/createMessage");
const UnreadMessage = require("../models/unreadMessages")
const Chat = require("../models/chat.model")
const Message = require("../models/message.model");
const { getChats } = require("../utilities/getChats");
module.exports = (io, socket) => {


    socket.on("join_chat", async (chatId) => {
        socket.join(chatId);
        const member = await UnreadMessage.findOne({
            userId: socket.user.id,
            chatId
        });

        if (!member) {
            await UnreadMessage.create({
                userId: socket.user.id,
                chatId,
                lastReadMessageId: null,
                unreadCount: 0
            });
        } else {

            member.unreadCount = 0
            await member.save()
        }


    });

    socket.on("send_message", async (data) => {
        try {
            if (data.text.trim().length < 1) {
                io.to(socket.user.id).emit("error_message", {
                    errMessage: "you cant send empty message :)"
                });

                return;
            }
            const message = await createMessage({
                chatId: data.chatId,
                senderId: socket.user.id,
                text: data.text,
                isDeleted: false
            });

            const populatedMessage = await message.populate({
                path: "sender",
                select: "username profilePic"
            }
            );



            const unReaded = await UnreadMessage.updateMany({
                userId: { $ne: socket.user.id },
                chatId: data.chatId
            }, { $inc: { unreadCount: 1 }, lastMessage: populatedMessage.text }, { new: true })

            await Chat.findByIdAndUpdate(data.chatId, {
                lastMessage: message._id
            })
            const members = await UnreadMessage.find({
                userId: { $ne: socket.user.id },
                chatId: data.chatId
            });

            const baseUrl = process.env.BASE_URL;
            io.to(data.chatId).emit("receive_message", {
                messageId: message._id,
                _id: socket.user.id,
                text: populatedMessage.text,
                senderId: populatedMessage.sender._id,
                senderProfilePic: populatedMessage.sender.profilePic,
                chatId: data.chatId
            });

            for (const member of members) {
                const friends = await getChats(member.userId);
                io.to(member.userId.toString()).emit("recieve_chats", {
                    friends
                });
            }

        } catch (err) {
            console.log(err)
            socket.emit("error_message", err.message);
        }
    });

    socket.on("typing", async (data) => {
        io.to(data.chatId).emit("receive_typing", {
            id: socket.user.id,
            name: socket.user.name
        })
    })

    socket.on("stop_typing", async (data) => {
        io.to(data.chatId).emit("stop_typing", {
            id: data.currentUser
        });
    })

    socket.on("delete_message", async (data) => {

        const deletedMessage = await Message.findById(data.messageId).populate({
            path: "sender",
            select: "username profilePic"
        })


        if (deletedMessage.sender._id.toString() === socket.user.id) {

            await Message.findByIdAndUpdate(data.messageId, {
                text: "deleted message",
                isDeleted: true
            })
            const baseUrl = process.env.BASE_URL;
            io.to(data.chatId).emit("recieve_deleted_message", {
                messageId: deletedMessage._id.toString(),
                text: "deleted message",
                userId: deletedMessage.sender._id.toString(),
                name: deletedMessage.sender.username,
                isDeleted: true,
                profilePic: deletedMessage.sender.profilePic
            })
        }
    })


    socket.on("edit_message", async (data) => {

        const editedMessage = await Message.findById(data.messageId).populate({
            path: "sender",
            select: "username"
        })
        if (socket.user.id == editedMessage.sender._id.toString()) {
            if (Message.isDeleted == false) {

                editedMessage.text = data.text
                await editedMessage.save()

                io.to(data.chatId).emit("recieve_edited_message", {
                    text: editedMessage.text,
                    messageId: data.messageId,
                    name: editedMessage.sender.username,
                    chatId: data.chatId
                })
            }
        } else {
            console.log("error")
        }


    })

}
