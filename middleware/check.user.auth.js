const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const BlacklistedTokenModel = require("../models/blacklistedToken.model");
const { HttpStatus } = require("../utils/httpStatusCode");
const { ResponseMessage } = require("../utils/responseMessage");

const userAuth = async (req, res, next) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];

    const isBlacklisted = await BlacklistedTokenModel.findOne({ token });

    if (isBlacklisted) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: ResponseMessage.token_is_invalid_please_log_in_again,
        status: HttpStatus.UNAUTHORIZED,
        success: false,
        data: {}
      });
    }

    const verifyUser = await jwt.verify(token, process.env.ACCESS_AUTH_TOKEN_SECRET);

    const user = await UserModel.findOne({ _id: verifyUser._id });
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      status: 400,
    });
  }
};

module.exports = userAuth;
