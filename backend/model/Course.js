const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true // e.g., CSE301
  },
  courseName: {
    type: String,
    required: true,
    trim: true // e.g., Database Management Systems
  },
  department: {
    type: String,
    required: true,
    uppercase: true
  },
  year: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

courseSchema.index(
  { courseCode: 1, department: 1, year: 1, createdBy: 1 },
  { unique: true }
);

module.exports = mongoose.model('Course', courseSchema);
