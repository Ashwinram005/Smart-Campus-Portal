const Assignment = require("../model/Assignment");
const Course = require("../model/Course");
const Submission = require("../model/Submission");
const User = require("../model/User");

exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body;

    // Check if faculty is handling this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Only assigned faculty can create assignment
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to add assignment to this course" });
    }

    const assignment = await Assignment.create({
      course: courseId,
      title,
      description,
      dueDate,
      createdBy: req.user._id,
    });

    res.status(201).json(assignment);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create assignment", error: err.message });
  }
};

exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const assignments = await Assignment.find({ course: courseId }).sort({
      dueDate: 1,
    }); // optional: soonest first

    res.status(200).json(assignments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch assignments", error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { fileUrl } = req.body;

    // Only students can submit
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can submit assignments" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Prevent duplicate submissions
    const existing = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id,
    });

    if (existing) {
      return res.status(400).json({ message: "Assignment already submitted" });
    }

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      fileUrl,
    });

    res
      .status(201)
      .json({ message: "Assignment submitted successfully", submission });
  } catch (err) {
    res.status(500).json({ message: "Submission failed", error: err.message });
  }
};

exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 1. Check assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 2. Check faculty ownership
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "Not authorized to view submissions for this assignment",
        });
    }

    // 3. Get all submissions
    const submissions = await Submission.find({
      assignment: assignmentId,
    }).populate("student", "name email studentId department");

    res.status(200).json(submissions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch submissions", error: err.message });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate("assignment", "title deadline course")
      .sort({ createdAt: -1 });

    res.status(200).json(submissions);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch your submissions",
        error: err.message,
      });
  }
};
exports.getAssignmentSubmissionStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 1. Fetch assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 2. Ensure faculty owns the assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 3. Fetch course with enrolled students
    const course = await Course.findById(assignment.course).populate(
      "enrolledStudents",
      "name email studentId"
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 4. Fetch all submissions for this assignment
    const submissions = await Submission.find({ assignment: assignmentId });

    const submittedStudentIds = submissions.map((s) => s.student.toString());

    // 5. Filter enrolled students
    const submitted = [];
    const notSubmitted = [];

    course.enrolledStudents.forEach((student) => {
      const studentId = student._id.toString();
      if (submittedStudentIds.includes(studentId)) {
        submitted.push(student);
      } else {
        notSubmitted.push(student);
      }
    });

    res.status(200).json({
      submitted,
      notSubmitted,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch submission status",
      error: err.message,
    });
  }
};
