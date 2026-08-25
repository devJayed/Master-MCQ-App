const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema(
  {
    // Retained as the English display name for compatibility with existing users.
    name: { type: String, required: true, trim: true },
    nameEnglish: { type: String, trim: true },
    nameBangla: { type: String, trim: true },
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: /^\+8801[3-9]\d{8}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['student', 'teacher', 'moderator'],
      default: 'student',
    },
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
    refreshTokens: [
      {
        tokenHash: { type: String, select: false },
        expiresAt: Date,
      },
    ],
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: Date,
  },
  { timestamps: true }
);
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function (value) {
  return bcrypt.compare(value, this.password);
};
module.exports = mongoose.model('User', userSchema);
