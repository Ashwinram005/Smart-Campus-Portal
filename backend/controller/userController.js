const User = require("../model/User");
const bcrypt = require("bcryptjs");
const { Parser } = require("json2csv");

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// GET /api/users/:id
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.user;

    // If not admin, only allow access to their own ID
    const targetUser = await User.findById(id).select("-password");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSameUser =
      loggedInUser._id.toString() === targetUser._id.toString();
    const isAdmin = loggedInUser.role === "admin";
    const isFacultyViewingStudent =
      loggedInUser.role === "faculty" && targetUser.role === "student";

    if (!isSameUser && !isAdmin && !isFacultyViewingStudent) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ user: targetUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

exports.downloadUsersCSV = async (req, res) => {
  try {
    // Fetch users
    const users = await User.find().select(
      "name email role department year studentId facultyId phone status createdAt"
    );

    // Convert to plain objects
    const userData = users.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year || "",
      studentId: user.studentId || "",
      facultyId: user.facultyId || "",
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    }));

    // Define CSV fields
    const fields = [
      "name",
      "email",
      "role",
      "department",
      "year",
      "studentId",
      "facultyId",
      "phone",
      "status",
      "createdAt",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(userData);

    res.header("Content-Type", "text/csv");
    res.attachment("users.csv");
    return res.send(csv);
  } catch (err) {
    res
      .status(500)
      .json({ message: "CSV generation failed", error: err.message });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    department,
    year,
    phone,
    studentId,
    facultyId,
  } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password || "default123", 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      year,
      phone,
      studentId,
      facultyId,
      phone: phone,
      status: "active",
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");
    res.status(200).json({ message: "User updated", user: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user", error: err.message });
  }
};

// PATCH /api/users/:id/toggle-status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    res.status(200).json({ message: "Status updated", status: user.status });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error toggling status", error: err.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
};
