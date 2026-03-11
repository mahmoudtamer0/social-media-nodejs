const jwt = require("jsonwebtoken")

const generateAccessToken = (name, id, role) => {
    const token = jwt.sign({ name, id, role }, process.env.JWT_SECRET, { expiresIn: "7d" })

    return token
}

const generateRefreshToken = (id) => {
    return jwt.sign(
        { id: id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

module.exports = { generateAccessToken, generateRefreshToken }