const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema(
  {
    // Retained as the English display name for compatibility with existing users.
    name: { type: String, required: true, trim: true },
    nameEnglish: { type: String, trim: true },
    nameBangla: { type: String, trim: true },
    // Optional at schema level so existing accounts remain valid when their sessions are refreshed.
    // New public registrations require this field in the auth route.
    gender: { type: String, enum: ['male', 'female', 'other'] },
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
    emailVerified: { type: Boolean, default: true },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: Date,
    mfaChallengeHash: { type: String, select: false },
    mfaCodeHash: { type: String, select: false },
    mfaExpiresAt: Date,
    sessionVersion: { type: Number, default: 0 },
    refreshTokens: [
      {
        tokenHash: { type: String, select: false },
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: Date.now },
        userAgent: String,
        ip: String,
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
