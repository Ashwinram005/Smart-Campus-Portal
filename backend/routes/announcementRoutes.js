const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createAnnouncement,
  getAllAnnouncements,
  getUserRelevantAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getMyAnnouncements,
} = require("../controller/announcementController");

// 🔒 Only Admin and Faculty can create announcements
router.post(
  "/",
  protect,
  authorizeRoles("admin", "faculty"),
  createAnnouncement
);

router.get(
  "/",
  protect,
  authorizeRoles("admin", "faculty"),
  getAllAnnouncements
);

router.get("/feed", protect, getUserRelevantAnnouncements);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "faculty"),
  updateAnnouncement
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "faculty"),
  deleteAnnouncement
);

router.get(
  "/my",
  protect,
  authorizeRoles("admin", "faculty"),
  getMyAnnouncements
);

module.exports = router;
