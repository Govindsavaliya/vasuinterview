const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");

module.exports.profileImage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, "../public/assets/profileImages");

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const fileExtension = file.mimetype.split("/")[1];
      return cb(null, `${uuid()}.${fileExtension}`);
    },
  }),
  limits: { fileSize: 1000000000000000000000000 },
}).single("profileImage");
