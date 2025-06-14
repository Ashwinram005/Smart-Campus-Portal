const User = require("../model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = async (req, res) => {
  try {
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

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const userData = {
      name,
      email,
      password,
      role,
      phone,
    };

    // Role-based fields
    if (role === "student") {
      userData.department = department;
      userData.year = year;
      userData.studentId = studentId;
    }

    if (role === "faculty") {
      userData.department = department;
      userData.facultyId = facultyId;
    }

    const newUser = await User.create(userData);
    res.status(201).json({ user: newUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
