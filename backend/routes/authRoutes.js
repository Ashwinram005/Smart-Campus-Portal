const express = require("express");
const router = express.Router();
const { register, login } = require("../controller/authController");
const { authorizeRoles, protect } = require("../middleware/authMiddleware");

router.post("/register", protect, authorizeRoles("admin"), register);
router.post("/login", login);

module.exports = router;
