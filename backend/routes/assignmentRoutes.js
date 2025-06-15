const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getAssignmentsByCourse,
  submitAssignment,
  getSubmissionsForAssignment,
  getMySubmissions,
  getAssignmentSubmissionStatus,
} = require("../controller/assignmentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/create", protect, authorizeRoles("faculty"), createAssignment);
router.get(
  "/course/:courseId",
  protect,
  authorizeRoles("student", "faculty"),
  getAssignmentsByCourse
);
router.post(
  "/submissions/:assignmentId",
  protect,
  authorizeRoles("student"),
  submitAssignment
);

router.get(
    "/submissions/mine",
    protect,
    authorizeRoles("student"),
    getMySubmissions
);
router.get(
  "/:assignmentId/submissions",
  protect,
  authorizeRoles("faculty"),
  getSubmissionsForAssignment
);

router.get(
  '/:assignmentId/status',
  protect,
  authorizeRoles('faculty'),
  getAssignmentSubmissionStatus
);

module.exports = router;
