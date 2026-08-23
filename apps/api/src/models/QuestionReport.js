const mongoose = require('mongoose');

const questionReportSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['incorrect_answer', 'ambiguous_options', 'typo', 'explanation', 'other'],
      required: true,
    },
    details: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolutionNote: { type: String, trim: true, maxlength: 1000, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

questionReportSchema.index({ status: 1, createdAt: -1 });
questionReportSchema.index({ reportedBy: 1, questionId: 1, attemptId: 1, status: 1 });

module.exports = mongoose.model('QuestionReport', questionReportSchema);
