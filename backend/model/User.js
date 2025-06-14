const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['admin', 'student', 'faculty'],
    required: true,
  },

  department: {
    type: String,
    required: true
    
  },

  year: {
    type: Number,
    required: function () {
      return this.role === 'student';
    },
  },

  studentId: {
    type: String,
    required: function () {
      return this.role === 'student';
    },
  },

  facultyId: {
    type: String,
    required: function () {
      return this.role === 'faculty';
    },
  },

  phone: { type: String, required: true },

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
