const express = require("express")
const { register, login, sendFriendRequest, handleFriendRequest, getUserFriends, getChatMessages, sendMessage, editProfile, createPost, getPosts, createComment, getComments, getUnreadNotificationsNum, getNotifications, getPost, getUserProfile, removeFriend } = require("../controllers/user.controler")
const verifyToken = require("../middlewares/verifyToken")
const upload = require("../middlewares/userUploads")
const postUpload = require("../middlewares/postsUpload")

const router = express.Router()


router.route("/register")
    .post(register)

router.route("/login")
    .post(login)

router.route("/send-friend-request")
    .post(verifyToken, sendFriendRequest)

router.route("/remove-friend")
    .post(verifyToken, removeFriend)

router.route("/get-profile")
    .get(verifyToken, getUserFriends)

router.route("/send-message")
    .post(verifyToken, sendMessage)

router.route("/get-messages/:chatId")
    .get(verifyToken, getChatMessages)

router.route("/edit-profile")
    .patch(verifyToken, upload.single("profilePic"), editProfile)

router.route("/create-post")
    .post(verifyToken, postUpload.single("postImage"), createPost)

router.route("/get-posts")
    .get(verifyToken, getPosts)


router.route("/get-post/:postId")
    .get(verifyToken, getPost)

router.route("/get-unread-notifications-num")
    .get(verifyToken, getUnreadNotificationsNum)

router.route("/get-notifications")
    .get(verifyToken, getNotifications)

router.route("/create-comment/:postId")
    .post(verifyToken, createComment)

router.route("/get-comments/:postId")
    .get(verifyToken, getComments)

router.route("/get-messages/:chatId")
    .get(verifyToken, getChatMessages)

router.route("/handle-friend-request/:requestId")
    .post(verifyToken, handleFriendRequest)

router.route("/:userId")
    .get(verifyToken, getUserProfile)


module.exports = router