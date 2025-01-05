const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const emailValidator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
      validate(value) {
        if (!emailValidator.isEmail(value)) {
          throw new Error("invalid Email");
        }
      },
      unique: true,
    },
    mobileNumber: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      min: 6,
    },
    profileImage: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAuthToken = async function () {
  try {
    let token = jwt.sign(
      { _id: this.id },
      process.env.ACCESS_AUTH_TOKEN_SECRET
    );

    this.token = await token;
    await this.save();
    return token;
  } catch (error) {
    console.log("🚀 ~ error:", error);
  }
};

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel;
