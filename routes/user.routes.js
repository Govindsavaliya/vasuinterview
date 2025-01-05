const router = require("express").Router();
const { userRegisterAction, userLoginAction, getLoginUserAction, userLogoutAction, updateUserAction } = require("../controllers/user.controller");
const userAuth = require("../middleware/check.user.auth");
const { profileImage } = require("../middleware/imageUpload");

router.post("/register", profileImage, userRegisterAction);
router.post("/login", userLoginAction);
router.get("/info", userAuth, getLoginUserAction);
router.get("/logout", userAuth, userLogoutAction);
router.patch("/update", userAuth, updateUserAction);

module.exports = router;