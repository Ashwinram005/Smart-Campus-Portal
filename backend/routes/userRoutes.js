const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
  downloadUsersCSV,
  getUserDetails,
  getDashboardStats,
} = require("../controller/userController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ✅ Protect all routes & allow only admin access
router.use(protect);
router.get("/dashboard", getDashboardStats);

// ✅ Admin-only routes BEFORE the dynamic one
router.get("/csv", authorizeRoles("admin"), downloadUsersCSV);
router.get("/", authorizeRoles("admin"), getAllUsers);
router.put("/:id", authorizeRoles("admin"), updateUser);
router.patch("/:id/toggle-status", authorizeRoles("admin"), toggleUserStatus);
router.delete("/:id", authorizeRoles("admin"), deleteUser);

// ✅ Dynamic route last to avoid clash
router.get("/:id", getUserDetails);

module.exports = router;
