const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
  downloadUsersCSV,
  getUserDetails,
} = require("../controller/userController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ✅ Protect all routes & allow only admin access
router.get("/:id", protect, getUserDetails);
router.use(protect);
router.use(authorizeRoles("admin"));
// Routes
router.get("/", getAllUsers); // GET all users
router.get("/csv", downloadUsersCSV); // GET all users
router.put("/:id", updateUser); // Update user by ID
router.patch("/:id/toggle-status", toggleUserStatus); // Toggle active/inactive
router.delete("/:id", deleteUser); // Delete user by ID

module.exports = router;
