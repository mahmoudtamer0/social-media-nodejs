const User = require("../models/user.model")
const FriendRequest = require("../models/friendRequest.model")
const FriendShip = require("../models/friends.model")
const Notification = require("../models/notification.model");
const Chat = require("../models/chat.model")


module.exports = (io, socket) => {

    socket.on("send_friend_request", async (data) => {
        const receiver = await User.findById(data.receiverId)

        if (!receiver) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "something went wrong"
            });
            return;
        }
        if (socket.user.id === receiver._id.toString()) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "something went wrong"
            });
            return;
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                {
                    sender: socket.user.id,
                    receiver: receiver._id,
                },
                {
                    sender: receiver._id,
                    receiver: socket.user.id,
                }
            ]
        });

        if (existingRequest) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "Friend request already sent"
            });
            return;
        }

        const existingFriendShip = await FriendShip.findOne({
            $or: [
                { user1: socket.user.id, user2: receiver._id },
                { user1: receiver._id, user2: socket.user.id }
            ]
        })

        if (existingFriendShip) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "You are already friends"
            });
            return;
        }

        const friendRequest = await FriendRequest.create({
            sender: socket.user.id,
            receiver: receiver._id
        });

        const notification = await Notification.create({
            user: receiver._id,
            sender: socket.user.id,
            description: "new friend request",
            type: "friend_request"
        })

        const populatedNotification = await notification.populate({
            path: "sender",
            select: "username profilePic"
        })

        const notifications = await Notification.countDocuments({ user: receiver._id, isRead: false })
        io.to(receiver._id.toString()).emit("receive_notification", {
            notificationsNum: notifications,
            notification: populatedNotification
        })

        io.to(socket.user.id).emit("friend_request_sent", {
            success: true,
            message: "Friend request sent successfully",
            sender: socket.user.id,
            reciver: receiver._id,
            friendRequestId: friendRequest._id,
            status: "sending-request"
        });

        io.to(receiver._id.toString()).emit("recieve_friend_request", {
            success: true,
            reciver: socket.user.id,
        });
    })

    socket.on("cancel_friend_request", async (data) => {
        const existingRequest = await FriendRequest.findOne({
            $or: [
                {
                    sender: socket.user.id,
                    receiver: data.receiverId,
                },
                {
                    sender: data.receiverId,
                    receiver: socket.user.id,
                }
            ]
        });

        if (!existingRequest) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "request not found"
            });
            return;
        }

        await existingRequest.deleteOne()

        io.to(socket.user.id).emit("friend_request_canceled", {
            success: true,
            message: "Friend request canceled successfully",
            sender: socket.user.id,
            reciver: data.receiverId
        });

        io.to(data.receiverId).emit("friend_request_canceled", {
            success: true,
            message: "Friend request canceled successfully",
            sender: data.receiverId,
            reciver: socket.user.id
        });
    })

    socket.on("accept_friend_request", async (data) => {

        const friendRequest = await FriendRequest.findOne({
            $or: [
                {
                    sender: socket.user.id,
                    receiver: data.receiverId,
                },
                {
                    sender: data.receiverId,
                    receiver: socket.user.id,
                }
            ]
        });

        if (!friendRequest) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "request not found"
            });
            return;
        }

        if (friendRequest.receiver.toString() !== socket.user.id) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "this request is not for you"
            });
            return;
        }

        const chat = new Chat({
            members: [friendRequest.sender, friendRequest.receiver],
            chatType: "normal"
        })

        await chat.save()

        await FriendShip.create({
            user1: friendRequest.sender,
            user2: friendRequest.receiver,
            chatId: chat._id
        });

        const notification = await Notification.create({
            user: friendRequest.sender,
            sender: friendRequest.receiver,
            description: "accepted your friend request",
            type: "accept_request"
        })

        await friendRequest.deleteOne();

        const populatedNotification = await notification.populate({
            path: "sender",
            select: "username profilePic"
        })
        const notifications = await Notification.countDocuments({ user: friendRequest.sender, isRead: false })
        io.to(friendRequest.sender.toString()).emit("receive_notification", {
            notificationsNum: notifications,
            notification: populatedNotification
        })

        io.to(socket.user.id).emit("receive_accepte_request", {
            success: true,
            reciver: friendRequest.sender
        })

        io.to(friendRequest.sender.toString()).emit("receive_accepte_request", {
            success: true,
            reciver: friendRequest.receiver
        })

    })

    socket.on("remove_friend", async (data) => {
        const friendShip = await FriendShip.findOne({
            $or: [
                { user1: socket.user.id, user2: data.receiverId },
                { user1: data.receiverId, user2: socket.user.id },
            ]
        })

        if (!friendShip) {
            io.to(socket.user.id).emit("error_message", {
                errMessage: "there is no friendship"
            });
            return;
        }

        await friendShip.deleteOne()

        io.to(socket.user.id).emit("receive_remove_friend", {
            success: true,
            reciver: data.receiverId
        })

        io.to(data.receiverId).emit("receive_remove_friend", {
            success: true,
            reciver: socket.user.id
        })

    })

}
