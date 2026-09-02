const mongoose = require('mongoose');

const localizedText = new mongoose.Schema(
  { bn: { type: String, default: '' }, en: { type: String, default: '' } },
  { _id: false }
);

const optionSnapshot = new mongoose.Schema(
  {
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: localizedText, required: true },
  },
  { _id: false }
);

// Rich content is already validated by Question. Mixed snapshots preserve the exact
// version the student saw, even if the author edits the question later.
const richSnapshot = { type: mongoose.Schema.Types.Mixed, default: undefined };

const answer = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D', null] },
    isCorrect: { type: Boolean, required: true },
    status: { type: String, enum: ['correct', 'incorrect', 'unanswered'], required: true },
  },
  { _id: false }
);

const questionSnapshot = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    chapterName: { type: localizedText, required: true },
    question: { type: localizedText, required: true },
    contentVersion: { type: Number, default: 1 },
    stimulus: richSnapshot,
    questionContent: richSnapshot,
    options: { type: [optionSnapshot], validate: (items) => items.length === 4 },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D', null] },
    status: { type: String, enum: ['correct', 'incorrect', 'unanswered'], required: true },
    explanation: { type: localizedText, required: true },
    explanationContent: richSnapshot,
    optionContent: richSnapshot,
    tags: { type: [String], default: [] },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    sourceType: String,
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submissionKey: { type: String, required: true, unique: true, index: true },
    mode: {
      type: String,
      enum: ['topic', 'chapter', 'quick', 'mistakes', 'custom', 'model'],
      default: 'custom',
    },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    chapterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: { type: [answer], required: true },
    questionSnapshots: { type: [questionSnapshot], required: true },
    totalQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 0 },
    marksObtained: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, min: 0 },
    timeAllocatedSeconds: { type: Number, min: 0 },
    timeTakenSeconds: { type: Number, min: 0 },
    submittedAt: { type: Date, required: true, default: Date.now },
    correctCount: { type: Number, default: 0, min: 0 },
    wrongCount: { type: Number, default: 0, min: 0 },
    unansweredCount: { type: Number, default: 0, min: 0 },
    scorePercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

attemptSchema.index({ studentId: 1, submittedAt: -1 });

module.exports = mongoose.model('ExamAttempt', attemptSchema);
