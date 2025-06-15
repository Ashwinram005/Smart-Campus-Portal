const mongoose = require("mongoose");

const courseMaterialSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ["pdf", "doc", "ppt", "video", "link", "other"],
    default: "other",
  },
  fileUrl: {
    type: String, // can be cloud URL, external link, or path
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CourseMaterial", courseMaterialSchema);
