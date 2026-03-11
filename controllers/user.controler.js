const User = require("../models/user.model")
const FriendRequest = require("../models/friendRequest.model")
const FriendShip = require("../models/friends.model")
const Chat = require("../models/chat.model")
const Message = require("../models/message.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const Notification = require("../models/notification.model");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { createMessage } = require("../services/createMessage")
const { generateAccessToken } = require("../utilities/generatToken")
const mongoose = require("mongoose");

const catchAsync = require("../utilities/catchAsync");
const ApiError = require("../utilities/ApiError");
const { getChats } = require("../utilities/getChats");




const register = catchAsync(async (req, res, next) => {


    const { username, email, password } = req.body


    const findUser = await User.findOne({ email: email })

    if (findUser) {
        return next(new ApiError(400, "this email already is use"));
    }

    const hash = await bcrypt.hash(password, 10)
    const user = new User({
        username: username,
        email: email,
        password: hash,
    })
    await user.save()

    const accesstoken = generateAccessToken(user.username, user._id, user.role)

    return res.status(201).json({
        status: "success",
        accesstoken
    })

})

const login = catchAsync(async (req, res, next) => {
    const baseUrl = process.env.BASE_URL;
    const { email, password } = req.body
    const findUser = await User.findOne({ email: email })

    if (!findUser) {
        return next(new ApiError(404, "user not found"));
    }

    const checkPass = await bcrypt.compare(password, findUser.password)

    if (!checkPass) {
        return next(new ApiError(401, "email or password not correct"));
    }

    const accesstoken = generateAccessToken(findUser.username, findUser._id, findUser.role)

    return res.status(200).json({
        status: "success",
        accesstoken,
        user: {
            id: findUser._id,
            name: findUser.username,
            profilePic: findUser.profilePic
        }
    })
})

const sendFriendRequest = catchAsync(async (req, res, next) => {
    const user = req.user
    const { receiverId, action } = req.body;

    const receiver = await User.findById(receiverId)

    if (user.id === receiverId) {
        return res.status(400).json({
            message: "You cannot send or remove friend request to yourself"
        });
    }
    if (!receiver) {
        return res.status(404).json({
            message: "user not found"
        });
    }
    if (action == "send") {
        const existingRequest = await FriendRequest.findOne({
            $or: [
                {
                    sender: user.id,
                    receiver: receiver._id,
                },
                {
                    sender: receiver._id,
                    receiver: user.id,
                }
            ]
        });
        if (existingRequest) {
            return res.status(400).json({
                message: "Friend request already sent"
            });
        }

        const existingFriendShip = await FriendShip.findOne({
            $or: [
                { user1: user.id, user2: receiver._id },
                { user1: receiver._id, user2: user.id }
            ]
        })

        if (existingFriendShip) {
            return res.status(400).json({
                message: "You are already friends"
            });
        }
        const friendRequest = await FriendRequest.create({
            sender: user.id,
            receiver: receiver._id
        });

        const notification = await Notification.create({
            user: receiver._id,
            sender: user.id,
            description: "new friend request",
            type: "friend_request"
        })
        res.status(201).json({
            status: "success",
            data: friendRequest
        });
    } else if (action == "cancel") {
        const existingRequest = await FriendRequest.findOne({
            $or: [
                {
                    sender: user.id,
                    receiver: receiver._id,
                },
                {
                    sender: receiver._id,
                    receiver: user.id,
                }
            ]
        });

        if (!existingRequest) {
            return res.status(404).json({
                message: "no request found"
            });
        }

        if (user.id != sender) {
            return next(new ApiError(400, "you are not the sender"));
        }

        await existingRequest.deleteOne()

        return res.status(200).json({
            status: "success",
            data: null
        })

    }

    return next(new ApiError(400, "invalid action"));
})

const handleFriendRequest = catchAsync(async (req, res, next) => {
    const { action } = req.body
    const { requestId } = req.params
    const user = req.user

    const friendRequest = await FriendRequest.findOne({ _id: requestId })

    if (!friendRequest) {
        return next(new ApiError(404, "no friend request found"));
    }

    if (user.id !== friendRequest.receiver.toString()) {
        return next(new ApiError(401, "this friend request is not for you"));
    }

    if (action == "accept") {

        const existFriend = await FriendShip.findOne({
            $or: [
                { user1: friendRequest.sender, user2: friendRequest.receiver },
                { user1: friendRequest.receiver, user2: friendRequest.sender }
            ]
        })

        if (existFriend) {
            return next(new ApiError(400, "already friends"));
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
            sender: user.id,
            description: "accepted your friend request",
            type: "accept_request"
        })

        await friendRequest.deleteOne();


        return res.status(200).json({
            message: "Friend request accepted"
        });

    }

    if (action == "decline") {
        await friendRequest.deleteOne();
        return res.status(200).json({
            message: "Friend request Declined"
        });
    }

    return next(new ApiError(400, "Invalid action"));

})

const sendMessage = catchAsync(async (req, res, next) => {
    const message = await createMessage({
        chatId: req.body.chatId,
        senderId: req.user.id,
        text: req.body.text
    });

    res.status(201).json(message);

})

const getUserFriends = catchAsync(async (req, res, next) => {
    const user = req.user


    const profile = await User.findById(user.id)

    const friendsList = await getChats(profile._id)

    return res.json(friendsList)
})

const getChatMessages = catchAsync(async (req, res, next) => {
    const baseUrl = process.env.BASE_URL;
    const { chatId } = req.params
    const user = req.user

    const messages = await Message.find({ chatId: chatId }, { __v: false }).populate({ path: "sender", select: "-email -password -__v" })

    const messagesTosend = messages.map(message => {
        return {

            isDeleted: message.isDeleted,
            _id: message._id,
            chatId: message.chatId,
            sender: {
                _id: message.sender._id,
                username: message.sender.username,
                profilePic: message.sender.profilePic
            },
            text: message.text,
            createdAt: message.createdAt,
            __v: message.__v
        }
    })

    return res.status(200).json(messagesTosend)
})

const editProfile = catchAsync(async (req, res, next) => {
    const cloudinary = require("../utilities/cloudinary")
    const user = req.user
    const { deleteProfilePic, editProfilePic, username } = req.body
    const userProfile = await User.findById(user.id)
    console.log(req.body)
    if (!userProfile) {
        return next(new ApiError(404, "user not found"));
    }

    if (editProfilePic && editProfilePic == "true" && req.file) {

        if (userProfile.cloudinary_id) {
            await cloudinary.uploader.destroy(userProfile.cloudinary_id);
        }
        userProfile.profilePic = req.file.path;
        userProfile.cloudinary_id = req.file.filename;

    }

    if (deleteProfilePic && deleteProfilePic == "true") {

        if (userProfile.cloudinary_id == "default" || userProfile.profilePic == "https://res.cloudinary.com/ddgniiotg/image/upload/v1773086407/default_eop2qt.jpg") {
            return next(new ApiError(400, "no profile picture"));
        }

        await cloudinary.uploader.destroy(userProfile.cloudinary_id);

        userProfile.profilePic = "https://res.cloudinary.com/ddgniiotg/image/upload/v1773086407/default_eop2qt.jpg";
        userProfile.cloudinary_id = "default";

    }

    if (username) {
        if (username.length < 2) {
            return next(new ApiError(400, "name length must be at least 2"));
        }

        userProfile.username = username;
    }

    await userProfile.save()

    return res.status(201).json({
        status: "success",
        user: {
            id: userProfile._id,
            name: userProfile.username,
            profilePic: userProfile.profilePic,
        }
    })


})

const getUserProfile = catchAsync(async (req, res, next) => {
    const userReq = req.user
    const { userId } = req.params
    let thisAccount;
    let friendRequestId;
    const user = await User.findById(userId).select("-password -email -cloudinary_id -__v")
    if (!user) {
        return next(new ApiError(404, "user not found"));
    }

    thisAccount = user._id.toString() == userReq.id ? "his-profile" : undefined;

    const friendsCount = await FriendShip.countDocuments({
        $or: [
            { user1: user._id },
            { user2: user._id }
        ]
    })


    const posts = await Post.aggregate([
        {
            $match: { user: user._id }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                description: 1,
                likesCount: 1,
                commentsCount: 1,
                createdAt: 1,
                postImage: {
                    $concat: [
                        process.env.BASE_URL,
                        "/uploads/posts/",
                        "$postImage"
                    ]
                },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(userReq.id), "$likes"]
                },
                "user.username": 1,
                "user._id": 1,
                "user.profilePic": 1
            }
        }
    ])

    if (!thisAccount) {

        const friendShip = await FriendShip.findOne({
            $or: [
                { user1: userReq.id, user2: user._id },
                { user1: user._id, user2: userReq.id }
            ]
        })

        if (friendShip) thisAccount = "friends"

        if (!friendShip) {
            thisAccount = "not-friends"
            const gettingRequest = await FriendRequest.findOne({ sender: user._id, receiver: userReq.id })
            if (gettingRequest) {
                thisAccount = "getting-request"
                friendRequestId = gettingRequest._id
            }

            if (!gettingRequest) {
                const sendingRequest = await FriendRequest.findOne({ sender: userReq.id, receiver: user._id })
                if (sendingRequest) {
                    thisAccount = "sending-request"
                    friendRequestId = sendingRequest._id
                }
            }
        }


    }

    return res.status(200).json({
        status: "success",
        data: {
            user,
            friendsCount,
            posts,
            status: thisAccount,
            friendRequestId
        }
    })
})

const createPost = catchAsync(async (req, res, next) => {
    const user = req.user
    const { description } = req.body

    const post = new Post({
        user: user.id,
        description: description,

    })

    if (req.file) {
        const imageName = req.file.filename
        post.postImage = imageName
    }


    await post.save()

    return res.status(201).json({
        status: "success",
        data: post
    })
})

const getPosts = catchAsync(async (req, res, next) => {
    const user = req.user

    const friends = await FriendShip.find({
        $or: [
            { user1: user.id },
            { user2: user.id },
        ]
    })

    const friendsIds = friends.map(f => {
        return f.user1.toString() == user.id ? f.user2 : f.user1
    })

    friendsIds.push(user.id)

    const objectIds = friendsIds.map(id =>
        new mongoose.Types.ObjectId(id)
    );

    const posts = await Post.aggregate([
        {
            $match: {}
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                description: 1,
                likesCount: 1,
                commentsCount: 1,
                createdAt: 1,
                postImage: {
                    $concat: [
                        process.env.BASE_URL,
                        "/uploads/posts/",
                        "$postImage"
                    ]
                },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(user.id), "$likes"]
                },
                "user.username": 1,
                "user._id": 1,
                "user.profilePic": 1
            }
        }
    ])


    return res.status(200).json({
        status: "success",
        data: posts
    })

})

const getPost = catchAsync(async (req, res, next) => {
    const user = req.user

    const { postId } = req.params


    const post = await Post.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(postId) }
        },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },

        {
            $project: {
                description: 1,
                likesCount: 1,
                commentsCount: 1,
                createdAt: 1,
                postImage: {
                    $concat: [
                        process.env.BASE_URL,
                        "/uploads/posts/",
                        "$postImage"
                    ]
                },
                isLiked: {
                    $in: [new mongoose.Types.ObjectId(user.id), "$likes"]
                },
                "user.profilePic": 1,
                "user.username": 1,
                "user._id": 1
            }
        }
    ])

    if (!post) {
        return next(new ApiError(404, "not found"));
    }
    return res.status(200).json({
        status: "success",
        data: post
    })

})

const createComment = catchAsync(async (req, res, next) => {
    const user = req.user
    const { content } = req.body
    const { postId } = req.params

    const post = await Post.findById(postId)

    if (!post) {
        return next(new ApiError(404, "no post found"));
    }


    const comment = await Comment.create({
        post: postId,
        user: user.id,
        content
    })

    post.commentsCount += 1

    await post.save()

    return res.status(201).json({
        status: "success",
        data: comment
    })
})

const getComments = catchAsync(async (req, res, next) => {
    const user = req.user
    const { postId } = req.params

    const newComments = await Comment.aggregate([
        { $match: { post: new mongoose.Types.ObjectId(postId) } },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },

        {
            $project: {
                createdAt: 1,
                content: 1,
                "user.profilePic": 1,
                "user.username": 1,
                "user._id": 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    return res.status(201).json({
        status: "success",
        data: newComments
    })
})

const getUnreadNotificationsNum = catchAsync(async (req, res, next) => {
    const user = req.user

    const unreadNotifications = await Notification.countDocuments({ user: user.id, isRead: false })

    return res.status(201).json({
        status: "success",
        data: unreadNotifications
    })
})

const getNotifications = catchAsync(async (req, res, next) => {
    const user = req.user

    const notifications = await Notification.find({ user: user.id }).populate({
        path: "sender",
        select: "username profilePic"
    }).sort({ createdAt: -1 })

    return res.status(201).json({
        status: "success",
        data: notifications
    })
})

const removeFriend = catchAsync(async (req, res, next) => {
    const user = req.user
    const { friendId } = req.body

    const friendShip = await FriendShip.findOne({
        $or: [
            { user1: user.id, user2: friendId },
            { user1: friendId, user2: user.id },
        ]
    })

    if (!friendShip) {
        return next(new ApiError(404, "there is no friendship"));
    }

    await friendShip.deleteOne()

    return res.status(200).json({
        status: "success",
        data: null
    })

})

module.exports = {
    register,
    sendFriendRequest,
    login,
    handleFriendRequest,
    sendMessage,
    getUserFriends,
    getChatMessages,
    editProfile,
    createPost,
    getPosts,
    createComment,
    getComments,
    getUnreadNotificationsNum,
    getNotifications,
    getPost,
    getUserProfile,
    removeFriend
}