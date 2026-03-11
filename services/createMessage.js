const Message = require("../models/message.model");
const Chat = require("../models/chat.model");
const ApiError = require("../utilities/ApiError");

exports.createMessage = async ({ chatId, senderId, text }) => {

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.members.map(id => id.toString()).includes(senderId)) {
        throw new ApiError(403, "Not a member of this chat");
    }

    const message = await Message.create({
        chatId,
        sender: senderId,
        text
    });

    return message;
};