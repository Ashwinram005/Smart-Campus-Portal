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
    required: function () {
      return this.role === 'student' || this.role === 'faculty';
    },
  },
  year: {
    type: Number,
    required: function () {
      return this.role === 'student';
    },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
