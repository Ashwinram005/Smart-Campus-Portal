const Course = require("../model/Course");
const CourseMaterial = require("../model/CourseMaterial");

exports.uploadMaterial = async (req, res) => {
  try {
    const { courseId, title, description, type, fileUrl } = req.body;
    const userId = req.user._id;

    // Check if course exists and created by current faculty
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to upload materials to this course",
      });
    }

    const material = await CourseMaterial.create({
      course: courseId,
      title,
      description,
      type,
      fileUrl,
      uploadedBy: userId,
    });

    res.status(201).json(material);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to upload material", error: err.message });
  }
};

exports.getMaterialsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const user = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Access check:
    if (user.role === "faculty") {
      if (course.createdBy.toString() !== user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Unauthorized access to this course" });
      }
    } else if (user.role === "student") {
      const isEnrolled = course.enrolledStudents.includes(user._id);
      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You're not enrolled in this course" });
      }
    }

    const materials = await CourseMaterial.find({ course: courseId }).sort({
      uploadedAt: -1,
    });

    res.status(200).json(materials);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch materials", error: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Only uploader can delete
    if (material.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this material" });
    }

    await material.deleteOne();

    res.status(200).json({ message: "Material deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete material", error: err.message });
  }
};