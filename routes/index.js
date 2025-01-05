const router = require("express").Router();

router.use("/user", require("./user.routes.js"));

module.exports = router;
