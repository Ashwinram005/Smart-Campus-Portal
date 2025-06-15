const express = require("express");
const router = express.Router();
const {
  createPlacementRecord,
  getAllPlacementRecords,
  getStudentPlacementRecords,
  getPlacementSummary,
  updatePlacementRecord,
  deletePlacementRecord,
  exportPlacementCSV,
} = require("../controller/placementController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/", protect, authorizeRoles("admin"), createPlacementRecord);
router.get("/", protect, authorizeRoles("admin"), getAllPlacementRecords);
router.get(
  "/student",
  protect,
  authorizeRoles("student"),
  getStudentPlacementRecords
);

router.get("/summary", protect, authorizeRoles("admin"), getPlacementSummary);

router.delete("/:id", protect, authorizeRoles("admin"), deletePlacementRecord);

router.put("/:id", protect, authorizeRoles("admin"), updatePlacementRecord);
router.get("/export", protect, authorizeRoles("admin"), exportPlacementCSV);
module.exports = router;
