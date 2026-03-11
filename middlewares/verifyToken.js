const jwt = require("jsonwebtoken")
const catchAsync = require("../utilities/catchAsync");
const ApiError = require("../utilities/ApiError");
const { verifyJWT } = require("../utilities/verifyJWT")
const verifyToken = catchAsync(async (req, res, next) => {

    const headers = req.headers["authorization"]

    if (!headers || !headers.startsWith("Bearer ")) {
        return next(new ApiError(401, "No token provided"));
    }

    const token = headers.split(" ")[1]


    const decoded = verifyJWT(token)

    if (!decoded) {
        return next(new ApiError(401, "invalide or expired token"));
    }

    req.user = decoded;

    next();
})

module.exports = verifyToken