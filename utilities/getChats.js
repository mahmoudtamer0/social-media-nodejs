const FriendShip = require("../models/friends.model")
const UnreadMessage = require("../models/unreadMessages")


const getChats = async (profile) => {

    const friends = await FriendShip.aggregate([
        {
            $match: {
                $or: [
                    { user1: profile },
                    { user2: profile }
                ]
            }
        },

        // lookup chat
        {
            $lookup: {
                from: "chats",
                localField: "chatId",
                foreignField: "_id",
                as: "chat"
            }
        },
        { $unwind: "$chat" },
        {
            $lookup: {
                from: "messages",
                localField: "chat.lastMessage",
                foreignField: "_id",
                as: "lastMessage"
            }
        },
        {
            $unwind: {
                path: "$lastMessage",
                preserveNullAndEmptyArrays: true
            }
        },
        // lookup user1
        {
            $lookup: {
                from: "users",
                localField: "user1",
                foreignField: "_id",
                as: "user1"
            }
        },
        { $unwind: "$user1" },


        // lookup user2
        {
            $lookup: {
                from: "users",
                localField: "user2",
                foreignField: "_id",
                as: "user2"
            }
        },
        { $unwind: "$user2" },

        // sort by last message
        {
            $sort: { "chat.updatedAt": -1 }
        }
    ]);

    const unreadMessages = await UnreadMessage.find({
        userId: profile
    }).lean();
    const unreadMap = {};

    unreadMessages.forEach(item => {
        unreadMap[item.chatId.toString()] = item.unreadCount;
    });

    const friendsList = friends.map(friend => {

        const isUser1 = friend.user1._id.toString() === profile._id.toString();

        return {
            id: isUser1 ? friend.user2._id : friend.user1._id,
            username: isUser1 ? friend.user2.username : friend.user1.username,
            chatId: friend.chatId?._id,
            lastMessage: friend.lastMessage?.text,
            lastMessageSender: friend.lastMessage?.sender,
            unreadCount: unreadMap[friend.chatId.toString()] || 0
        };

    });

    return friendsList
}

module.exports = { getChats }