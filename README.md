# Social Media Backend API

A fully-featured backend API for a social media platform built with Node.js, Express, MongoDB, and Socket.IO.  
Supports **user authentication, friend requests, real-time chat, posts, comments, likes, and notifications**.

---

## ⚙️ Setup

1. Clone the repository


Install dependencies:

npm install

Create a .env file: 

DB_URL=mongodb+srv://mahmoudtamerdeveloper_db_user:mahmoudtamer2004DB@mahmoud.6hcrqom.mongodb.net/chat
JWT_SECRET=chat@2025Secure_Token!9fA3kXqPzR
BASE_URL=http://localhost:4000

CLOUD_NAME=ddgniiotg
CLOUD_API_KEY=738273584472183
CLOUD_API_SECRET=pur7cGm-r7u713mJ9ETpcyqQUO4


Run the server:
node server.js

📡 REST API Endpoints

| Method | Endpoint                 | Description                 | Auth   |
| ------ | ------------------------ | --------------------------- | ------ |
| POST   | `/api/v1/users/register` | Register a new user         | Public |
| POST   | `/api/v1/users/login`    | Login with email & password | Public |

Friend System

| Method | Endpoint                                         | Description                       | Auth |
| ------ | ------------------------------------------------ | --------------------------------- | ---- |
| POST   | `/api/v1/users/send-friend-request`              | Send a friend request             | User |
| POST   | `/api/v1/users/remove-friend`                    | Remove a friend                   | User |
| POST   | `/api/v1/users/handle-friend-request/:requestId` | Accept/Reject friend request      | User |
| GET    | `/api/v1/users/get-profile`                      | Get your friends list             | User |
| GET    | `/api/v1/users/:userId`                          | Get another user's public profile | User |

Chat

| Method | Endpoint                             | Description            | Auth |
| ------ | ------------------------------------ | ---------------------- | ---- |
| POST   | `/api/v1/users/send-message`         | Send a chat message    | User |
| GET    | `/api/v1/users/get-messages/:chatId` | Get messages of a chat | User |


| Method | Endpoint                     | Description                           | Auth |
| ------ | ---------------------------- | ------------------------------------- | ---- |
| PATCH  | `/api/v1/users/edit-profile` | Update profile info & profile picture | User |

Posts & Comments

| Method | Endpoint                               | Description              | Auth |
| ------ | -------------------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/users/create-post`            | Create a post with image | User |
| GET    | `/api/v1/users/get-posts`              | Get all posts            | User |
| GET    | `/api/v1/users/get-post/:postId`       | Get specific post        | User |
| POST   | `/api/v1/users/create-comment/:postId` | Add a comment to a post  | User |
| GET    | `/api/v1/users/get-comments/:postId`   | Get comments of a post   | User |

Notifications

| Method | Endpoint                                     | Description                        | Auth |
| ------ | -------------------------------------------- | ---------------------------------- | ---- |
| GET    | `/api/v1/users/get-unread-notifications-num` | Get number of unread notifications | User |
| GET    | `/api/v1/users/get-notifications`            | Get all notifications              | User |

📡 Real-Time Socket.IO Features

All sockets require JWT authentication. Connect using:

const socket = io("http://localhost:4000", {
    auth: { token: YOUR_JWT_TOKEN }
});


Chat

join_chat(chatId) – Join a chat room

send_message({ chatId, text }) – Send a message

typing({ chatId }) – Notify others you are typing

stop_typing({ chatId, currentUser }) – Stop typing event

delete_message({ messageId, chatId }) – Delete your message

edit_message({ messageId, chatId, text }) – Edit your message

Friend System

send_friend_request({ receiverId }) – Send a friend request

cancel_friend_request({ receiverId }) – Cancel sent request

accept_friend_request({ receiverId }) – Accept a friend request

remove_friend({ receiverId }) – Remove a friend

Posts & Comments

create_comment({ postId, content }) – Comment on a post

send_like({ postId }) – Like/unlike a post

opened_notifications() – Mark all notifications as read

Notifications

Emits events:

receive_notification – New notification

receive_like – Someone liked your post

receive_comment – Someone commented on your post

friend_request_sent – Friend request sent

receive_accepte_request – Friend request accepted

receive_remove_friend – Friend removed
=============================================

📌 Key Learning Outcomes

Building RESTful APIs with Node.js & Express

Implementing real-time features with Socket.IO

JWT authentication & role-based access

File uploads using Multer & Cloudinary

Handling social features: friends, chat, posts, likes, comments, notifications

Real-time chat with unread message tracking

Scalable backend architecture with MVC structure


👨‍💻 Author

Mahmoud Tamer
Backend Developer (Node.js)

GitHub: https://github.com/mahmoudtamer0
