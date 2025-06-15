const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createCourse,
  getMyCourses,
  getStudentCourses,
  updateCourse,
  deleteCourse,
  syncEnrolledStudents,
} = require("../controller/courseController");

// ✅ Only faculty can create courses
router.post("/", protect, authorizeRoles("faculty"), createCourse);
router.get("/faculty", protect, authorizeRoles("faculty"), getMyCourses);
router.get("/student", protect, authorizeRoles("student"), getStudentCourses);
router.put("/:id", protect, authorizeRoles("faculty"), updateCourse);
router.delete("/:id", protect, authorizeRoles("faculty"), deleteCourse);
router.put('/:id/sync', protect, authorizeRoles('faculty'), syncEnrolledStudents);

module.exports = router;
