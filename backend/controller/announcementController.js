const Announcement = require("../model/Announcement");

// POST /api/announcements
// Access: Admin, Faculty
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      date,
      time,
      location,
      attachmentUrl,
      tags = {},
    } = req.body;

    // Make sure user is authorized (admin/faculty)
    if (!["admin", "faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const newAnnouncement = new Announcement({
      title,
      description,
      type,
      date,
      time,
      location,
      attachmentUrl,
      tags,
      createdBy: req.user._id,
      createdByRole: req.user.role,
    });

    await newAnnouncement.save();
    res
      .status(201)
      .json({ message: "Announcement created", announcement: newAnnouncement });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create announcement", error: err.message });
  }
};

exports.getAllAnnouncements = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can access all announcements" });
    }

    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch announcements", error: err.message });
  }
};

// GET /api/announcements/feed
// Access: student, faculty, admin
exports.getUserRelevantAnnouncements = async (req, res) => {
  try {
    const user = req.user;
    console.log("Logged-in User Details:", user); // IMPORTANT: Verify year and department are as expected

    let studentDepartment = null;
    let studentAdmissionYear = null;
    let studentCurrentAcademicYear = null;

    // Ensure user.department and user.year exist before assigning
    if (user.department) {
      studentDepartment = user.department;
    }
    if (user.year) {
      studentAdmissionYear = user.year;
    }

    // ... (rest of your query conditions calculation)
    let queryConditions = [{ "tags.audience": "all" }];

    if (user.role === "student") {
      if (studentAdmissionYear) {
        const currentCalendarYear = new Date().getFullYear();
        studentCurrentAcademicYear =
          currentCalendarYear - studentAdmissionYear + 1;
        if (studentCurrentAcademicYear < 1) studentCurrentAcademicYear = 1;
      }

      queryConditions.push({
        "tags.audience": "students",
        "tags.department": { $exists: false },
        "tags.year": { $exists: false },
      });

      if (studentDepartment) {
        queryConditions.push({
          "tags.audience": "students",
          "tags.department": studentDepartment, // THIS VALUE MUST EXACTLY MATCH DB
          "tags.year": { $exists: false },
        });
      }

      if (studentCurrentAcademicYear !== null) {
        queryConditions.push({
          "tags.audience": "students",
          "tags.year": studentCurrentAcademicYear, // THIS VALUE MUST EXACTLY MATCH DB (as a Number)
          "tags.department": { $exists: false },
        });
      }

      if (studentDepartment && studentCurrentAcademicYear !== null) {
        queryConditions.push({
          "tags.audience": "students",
          "tags.department": studentDepartment, // THIS VALUE MUST EXACTLY MATCH DB
          "tags.year": studentCurrentAcademicYear, // THIS VALUE MUST EXACTLY MATCH DB (as a Number)
        });
      }
    } else if (user.role === "faculty") {
      // ... faculty logic
      const facultyDepartment = user.department;
      queryConditions.push({
        "tags.audience": "faculty",
        "tags.department": { $exists: false },
      });
      if (facultyDepartment) {
        queryConditions.push({
          "tags.audience": "faculty",
          "tags.department": facultyDepartment,
        });
      }
    } else if (user.role === "admin") {
      queryConditions.push({ "tags.audience": "admin" });
    }

    const mongoQuery = { $or: queryConditions };
    console.log(
      "MongoDB Query Generated:",
      JSON.stringify(mongoQuery, null, 2)
    ); // LOG THE QUERY HERE!

    const announcements = await Announcement.find(mongoQuery).sort({
      createdAt: -1,
    });
    res.status(200).json(announcements);
  } catch (err) {
    console.error("Error fetching user relevant announcements:", err);
    res.status(500).json({
      message: "Failed to fetch relevant announcements",
      error: err.message,
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isCreator =
      announcement.createdBy.toString() === req.user._id.toString();

    // 🚫 Faculty cannot update announcements created by admin
    if (req.user.role === "faculty" && announcement.createdByRole === "admin") {
      return res
        .status(403)
        .json({ message: "Faculty cannot update admin announcements" });
    }

    // ✅ Allow if admin, or if creator (faculty updating their own post)
    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this announcement" });
    }

    Object.assign(announcement, updates);
    const updated = await announcement.save();

    res.status(200).json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update announcement", error: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isCreator =
      announcement.createdBy.toString() === req.user._id.toString();

    // 🚫 Faculty cannot delete admin-created announcements
    if (req.user.role === "faculty" && announcement.createdByRole === "admin") {
      return res
        .status(403)
        .json({ message: "Faculty cannot delete admin announcements" });
    }

    // ✅ Allow if admin, or if faculty deleting their own post
    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this announcement" });
    }

    await announcement.deleteOne();

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete announcement", error: err.message });
  }
};

exports.getMyAnnouncements = async (req, res) => {
  try {
    // Only admin and faculty reach here due to route protection
    const userId = req.user._id;
    const role = req.user.role; // 'admin' or 'faculty'

    const myPosts = await Announcement.find({
      createdBy: userId,
      createdByRole: role,
    }).sort({ createdAt: -1 });

    res.status(200).json(myPosts);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch your announcements",
      error: err.message,
    });
  }
};
