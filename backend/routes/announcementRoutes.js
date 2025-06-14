const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middlware/authMiddleware");
const {
  createAnnouncement,
  getAllAnnouncements,
  getUserRelevantAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controller/announcementController");

// 🔒 Only Admin and Faculty can create announcements
router.post(
  "/",
  protect,
  authorizeRoles("admin", "faculty"),
  createAnnouncement
);

router.get("/", protect, authorizeRoles("admin"), getAllAnnouncements);

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
module.exports = router;
