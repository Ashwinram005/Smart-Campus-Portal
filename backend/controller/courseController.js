const Course = require("../model/Course");
const User = require("../model/User");

exports.createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, department, year } = req.body;

    const existingCourse = await Course.findOne({
      courseCode,
      department,
      year,
      createdBy: req.user._id,
    });

    if (existingCourse) {
      return res
        .status(400)
        .json({ message: "Course already exists for this faculty" });
    }

    // ✅ Convert academic year to admission year
    const currentYear = new Date().getFullYear();
    const admissionYear = currentYear - year + 1;

    // ✅ Find students with that admission year
    const students = await User.find({
      role: "student",
      department,
      year: admissionYear,
    }).select("_id");

    const newCourse = await Course.create({
      courseCode,
      courseName,
      department,
      year,
      createdBy: req.user._id,
      enrolledStudents: students.map((s) => s._id),
    });

    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({
      message: "Failed to create course",
      error: err.message,
    });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user._id });
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch faculty courses" });
  }
};

// 📘 Student: View courses they are enrolled in
exports.getStudentCourses = async (req, res) => {
  try {
    const courses = await Course.find({ enrolledStudents: req.user._id }).select('courseCode courseName department year createdAt');;
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student courses" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, year } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only creator can update
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    // Update fields
    if (courseName) course.courseName = courseName;
    if (year) {
      course.year = year;

      // Recalculate admission year and update enrolled students
      const currentYear = new Date().getFullYear();
      const admissionYear = currentYear - year + 1;

      const students = await User.find({
        role: "student",
        department: course.department,
        year: admissionYear,
      }).select("_id");

      course.enrolledStudents = students.map((s) => s._id);
    }

    await course.save();
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: "Failed to update course", error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only creator can delete
    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

await Course.findByIdAndDelete(id);
        res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course", error: err.message });
  }
};

exports.syncEnrolledStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to sync this course" });
    }

    const currentYear = new Date().getFullYear();
    const admissionYear = currentYear - course.year + 1;

    const students = await User.find({
      role: "student",
      department: course.department,
      year: admissionYear,
    }).select("_id");

    course.enrolledStudents = students.map((s) => s._id);
    await course.save();

    res.status(200).json({
      message: "Enrolled students updated successfully",
      enrolledCount: course.enrolledStudents.length,
      course,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to sync students", error: err.message });
  }
};
