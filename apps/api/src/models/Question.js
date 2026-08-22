const mongoose = require('mongoose');

const localizedText = new mongoose.Schema(
  {
    bn: { type: String, required: true, trim: true },
    en: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const option = new mongoose.Schema(
  {
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: localizedText, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    subtopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtopic', index: true },
    question: { type: localizedText, required: true },
    questionType: { type: String, default: 'single_choice' },
    options: {
      type: [option],
      validate: {
        validator: (items) => items.length === 4,
        message: 'Exactly four options are required.',
      },
    },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    explanation: { type: localizedText, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    sourceType: {
      type: String,
      enum: ['board', 'teacher', 'model_test', 'practice'],
      default: 'teacher',
    },
    board: String,
    year: Number,
    tags: [String],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

questionSchema.index({ chapterId: 1, topicId: 1, subtopicId: 1, status: 1, isDeleted: 1 });

questionSchema.pre('validate', function validatePublishedBilingualContent(next) {
  if (this.status !== 'published') return next();
  const missing = [];
  if (!this.question?.bn || !this.question?.en) missing.push('question');
  if (!this.explanation?.bn || !this.explanation?.en) missing.push('explanation');
  this.options.forEach((optionItem) => {
    if (!optionItem.text?.bn || !optionItem.text?.en) missing.push(`option ${optionItem.key}`);
  });
  if (missing.length)
    return next(
      new Error(
        `Published questions require Bangla and English content. Missing: ${missing.join(', ')}.`
      )
    );
  next();
});

module.exports = mongoose.model('Question', questionSchema);
