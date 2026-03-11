const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const Notification = require("../models/notification.model");
module.exports = (io, socket) => {

    socket.on("create_comment", async (data) => {
        const post = await Post.findById(data.postId)
        if (post) {

            const comment = await Comment.create({
                post: post._id,
                content: data.content,
                user: socket.user.id
            })

            post.commentsCount += 1
            await post.save()
            const populatedComment = await comment.populate({
                path: "user",
                select: "username profilePic"
            })



            if (socket.user.id != post.user.toString()) {

                const notification = await Notification.create({
                    user: post.user,
                    post: post._id,
                    sender: socket.user.id,
                    comment: populatedComment._id,
                    description: "commented on your post",
                    type: "comment"
                })
                const populatedNotification = await notification.populate({
                    path: "sender",
                    select: "username profilePic"
                })
                const notifications = (await Notification.find({ user: post.user, isRead: false })).length
                io.to(post.user.toString()).emit("receive_notification", {
                    notificationsNum: notifications,
                    notification: populatedNotification
                })
            }


            const baseUrl = process.env.BASE_URL;
            io.emit("receive_comment", {
                id: populatedComment._id,
                post: post._id,
                user: {
                    id: populatedComment.user.id,
                    username: populatedComment.user.username,
                    profilePic: `${baseUrl}/uploads/${populatedComment.user.profilePic}`
                },
                content: populatedComment.content,
                createdAt: populatedComment.createdAt,
                commentsCount: post.commentsCount
            });

        }


    })

    socket.on("send_like", async (data) => {
        const post = await Post.findById(data.postId)
        const isLiked = post.likes.includes(socket.user.id)
        if (post) {
            if (isLiked == false) {
                post.likesCount += 1
                post.likes = [...post.likes, socket.user.id]
            } else if (isLiked == true) {
                post.likesCount -= 1
                post.likes = post.likes.filter(like => like != socket.user.id)
            } else {
                console.log("error")
                return;
            }
        }

        await post.save()

        if (socket.user.id != post.user.toString()) {

            const notification = await Notification.create({
                user: post.user,
                post: post._id,
                sender: socket.user.id,
                description: "liked your post",
                type: "like"
            })
            const populatedNotification = await notification.populate({
                path: "sender",
                select: "username profilePic"
            })
            const notifications = (await Notification.find({ user: post.user, isRead: false })).length
            io.to(post.user.toString()).emit("receive_notification", {
                notificationsNum: notifications,
                notification: populatedNotification
            })
        }


        io.emit("receive_like", {
            userId: socket.user.id,
            post: post._id,
            isLike: isLiked == true ? false : true,
            likesCount: post.likesCount
        });

    })

    socket.on("opened_notifications", async (data) => {

        const notifications = await Notification.updateMany({ user: socket.user.id }, { isRead: true }, { new: true })

        io.to(socket.user.id).emit("receive_notification", {
            notificationsNum: 0,
            notification: undefined
        })

    })

}
