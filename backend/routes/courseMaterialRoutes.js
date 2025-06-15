const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  uploadMaterial,
  getMaterialsByCourse,
  deleteMaterial,
} = require("../controller/courseMaterialController");

router.post("/upload", protect, authorizeRoles("faculty"), uploadMaterial);
router.get(
  "/:courseId",
  protect,
  authorizeRoles("student", "faculty"),
  getMaterialsByCourse
);
router.delete('/:id', protect, authorizeRoles('faculty'), deleteMaterial);

module.exports = router;
