const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['academic', 'event', 'notice', 'holiday'],
    required: true
  },
  date: {
    type: String, // ISO date (e.g., '2025-07-10')
    required: true
  },
  time: {
    type: String // optional (e.g., '10:00 AM')
  },
  location: {
    type: String // optional
  },
  attachmentUrl: {
    type: String // optional file link (PDF, image, etc.)
  },
  tags: {
    audience: {
      type: String,
      enum: ['all', 'students', 'faculty'],
      default: 'all'
    },
    department: {
      type: String // e.g., 'CSE', 'ECE'
    },
    year: {
      type: Number // e.g., 1, 2, 3, 4
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'faculty'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
