const fs = require("fs");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user.model");
const { HttpStatus } = require("../utils/httpStatusCode");
const { ResponseMessage } = require("../utils/responseMessage");
const { default: mongoose } = require("mongoose");
const BlacklistedTokenModel = require("../models/blacklistedToken.model");

exports.userRegisterAction = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, password, confirmPassword } =
            req.body;

        if (password.length > 6) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: ResponseMessage.password_must_be_at_least_6_characters,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                data: {},
            });
        }

        const userData = await UserModel.findOne({ email: email });
        const mobileData = await UserModel.findOne({ mobileNumber: mobileNumber });
        if (userData) {
            return res.status(HttpStatus.FOUND).json({
                message: ResponseMessage.email_already_associate_with_another_account,
                status: HttpStatus.FOUND,
                success: false,
                data: {},
            });
        }
        if (mobileData) {
            return res.status(HttpStatus.FOUND).json({
                message:
                    ResponseMessage.mobile_number_already_associate_with_another_account,
                status: HttpStatus.FOUND,
                success: false,
                data: {},
            });
        }

        if (password == confirmPassword) {
            const userDetails = new UserModel({
                fullName,
                email,
                mobileNumber,
                password,
                confirmPassword,
                profileImage: req.file.filename,
            });
            await userDetails.save();
            return res.status(HttpStatus.CREATED).json({
                message: ResponseMessage.user_register_successfully,
                status: HttpStatus.CREATED,
                success: true,
                data: {},
            });
        } else {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: ResponseMessage.password_not_matched,
                status: HttpStatus.NOT_FOUND,
                success: false,
                data: {},
            });
        }
    } catch (error) {
        if (req.file) {
            fs.unlink(`./public/assets/profileImages/${req?.file?.filename}`, (err) => {
                if (err) {
                    console.log(err.message);
                }
            });
        }
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: {},
        });
    }
};

exports.userLoginAction = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (password.length >= 6) {
            const checkUserData = await UserModel.findOne({ email: email });

            if (!checkUserData) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    message: ResponseMessage.email_id_is_not_exist,
                    status: HttpStatus.NOT_FOUND,
                    success: false,
                    data: {},
                });
            }

            const isMatch = await bcrypt.compare(password, checkUserData.password);
            if (!isMatch) {
                return res.status(HttpStatus.UNAUTHORIZED).json({
                    message: ResponseMessage.please_try_to_correct_credentials,
                    status: HttpStatus.UNAUTHORIZED,
                    success: false,
                    data: {},
                });
            }

            const token = await checkUserData.generateAuthToken();

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            });

            return res.status(HttpStatus.OK).json({
                message: ResponseMessage.login_successfully,
                status: HttpStatus.OK,
                success: true,
                token: token,
                data: {
                    _id: checkUserData._id,
                },
            });
        } else {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: ResponseMessage.password_must_be_at_least_6_characters,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: {},
        });
    }
};

exports.getLoginUserAction = async (req, res) => {
    try {
        const id = req.user;
        const userData = await UserModel.aggregate([
            {
                $match: {
                    $and: [
                        { _id: { $eq: new mongoose.Types.ObjectId(id) } },
                        { isDeleted: { $eq: false } },
                    ],
                },
            },
            {
                $addFields: {
                    profileImagesUrl: {
                        $concat: [
                            process.env.IMAGELIVEURL,
                            "/assets/profileImages/",
                            "$profileImage",
                        ],
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    isDeleted: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                },
            },
        ]);

        if (!userData || userData.length === 0) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: ResponseMessage.user_not_found,
                status: HttpStatus.NOT_FOUND,
                success: false,
                data: {},
            });
        }

        return res.status(HttpStatus.OK).json({
            message: ResponseMessage.get_login_user_info_successfully,
            status: HttpStatus.OK,
            success: true,
            data: userData,
        });
    } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
        });
    }
};

exports.userLogoutAction = async (req, res) => {
    try {
        const blacklistedToken = new BlacklistedTokenModel({ token: req.token });

        await blacklistedToken.save();

        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.ACCESS_ADMIN_AUTH_TOKEN_SECRET,
        });

        return res.status(HttpStatus.OK).json({
            message: ResponseMessage.logout_successfully,
            status: HttpStatus.OK,
            success: true,
            data: {},
        });
    } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: {},
        });
    }
};

exports.updateUserAction = async (req, res) => {
    try {
        const id = req.user;
        const checkUserData = await UserModel.findOne({ _id: id });
        if (!checkUserData) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: ResponseMessage.please_try_to_correct_credentials,
                status: HttpStatus.UNAUTHORIZED,
                success: false,
                data: {},
            });
        }
        const { email, mobileNumber, fullName } = req.body;

        if (email && email !== checkUserData.email) {
            const emailExists = await UserModel.findOne({ email, _id: { $ne: id } });
            if (emailExists) {
                return res.status(HttpStatus.FOUND).json({
                    message: ResponseMessage.email_already_associate_with_another_account,
                    status: HttpStatus.FOUND,
                    success: false,
                    data: {},
                });
            }
        }

        if (mobileNumber && mobileNumber !== checkUserData.mobileNumber) {
            const mobileExists = await UserModel.findOne({ mobileNumber, _id: { $ne: id } });
            if (mobileExists) {
                return res.status(HttpStatus.FOUND).json({
                    message: ResponseMessage.mobile_number_already_associate_with_another_account,
                    status: HttpStatus.FOUND,
                    success: false,
                    data: {},
                });
            }
        }

        const file = req.file;
        let profileImage;

        if (file) {
            profileImage = req.file.filename;
            if (checkUserData.profileImage) {
                fs.unlink(
                    `./public/assets/profileImages/${checkUserData.profileImage}`,
                    (err) => {
                        if (err) {
                            console.log(err.message);
                        }
                    }
                );
            }
        } else {
            profileImage = checkUserData.profileImage;
        }

        await UserModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    fullName: fullName ?? checkUserData.fullName,
                    email: email ?? checkUserData.email,
                    mobileNumber: mobileNumber ?? checkUserData.mobileNumber,
                    profileImage,
                },
            }
        );

        return res.status(HttpStatus.OK).json({
            message: ResponseMessage.user_updated_successfully,
            status: HttpStatus.OK,
            success: true,
            data: {},
        });

    } catch (error) {
        if (req.file) {
            fs.unlink(`./public/assets/profileImages/${req.file.filename}`, (err) => {
                if (err) console.log(err.message);
            });
        }
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: {},
        });
    }
};