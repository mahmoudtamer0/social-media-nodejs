const jwt = require("jsonwebtoken");

const verifyJWT = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
};

module.exports = { verifyJWT }