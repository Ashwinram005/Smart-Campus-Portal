const mongoose = require("mongoose");

const studentPlacementSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    batchYear: {
      type: Number,
      required: true, // Example: 2021
    },

    // Placement Offer Details
    company: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    package: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["fulltime", "internship"],
      required: true,
    },
    driveDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Placement", studentPlacementSchema);
