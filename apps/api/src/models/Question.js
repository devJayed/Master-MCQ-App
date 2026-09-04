const mongoose = require('mongoose');
const { hasRichLanguage } = require('../utils/richContent');
const {
  QUESTION_TYPES,
  VALID_QUESTION_TYPES,
  WRITTEN_QUESTION_TYPES,
  STIMULUS_QUESTION_TYPES,
} = require('../constants/questionTypes');

const FIXED_STIMULUS_TITLE = {
  bn: 'নিচের উদ্দীপকের আলোকে পরবর্তী প্রশ্নটির উত্তর দাও',
  en: 'Answer the next question based on the following stem/stimulus',
};

const localizedText = new mongoose.Schema(
  {
    bn: { type: String, required: true, trim: true },
    en: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// Stimulus metadata is genuinely optional. It must not reuse localizedText,
// because that schema intentionally requires Bangla for core question fields.
const optionalLocalizedText = new mongoose.Schema(
  {
    bn: { type: String, trim: true, default: '' },
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

const contentBlock = new mongoose.Schema(
  {
    type: { type: String, enum: ['text', 'code', 'math', 'image', 'table'], required: true },
    text: { type: String, default: '' },
    language: { type: String, default: '' },
    display: { type: Boolean, default: false },
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    rows: { type: [[String]], default: undefined },
  },
  { _id: false }
);

const localizedBlocks = new mongoose.Schema(
  {
    bn: { type: [contentBlock], default: [] },
    en: { type: [contentBlock], default: [] },
  },
  { _id: false }
);

const optionContent = new mongoose.Schema(
  {
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    content: { type: localizedBlocks, default: () => ({}) },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    subtopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtopic', index: true },
    question: { type: optionalLocalizedText, default: () => ({}) },
    contentVersion: { type: Number, default: 1 },
    stimulus: {
      groupId: { type: String, trim: true, default: '' },
      title: { type: optionalLocalizedText, default: () => ({}) },
      content: { type: localizedBlocks, default: () => ({}) },
    },
    questionContent: { type: localizedBlocks, default: () => ({}) },
    questionType: {
      type: Number,
      enum: VALID_QUESTION_TYPES,
      default: QUESTION_TYPES.MCQ,
      required: true,
      index: true,
    },
    options: {
      type: [option],
      validate: {
        validator(items) {
          return this.questionType !== QUESTION_TYPES.MCQ || items.length === 4;
        },
        message: 'MCQ questions require exactly four options.',
      },
      default: [],
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required() { return this.questionType === QUESTION_TYPES.MCQ; },
    },
    explanation: { type: optionalLocalizedText, default: () => ({}) },
    explanationContent: { type: localizedBlocks, default: () => ({}) },
    optionContent: { type: [optionContent], default: [] },
    answer: { type: optionalLocalizedText, default: () => ({}) },
    answerContent: { type: localizedBlocks, default: () => ({}) },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    sourceType: {
      type: String,
      enum: ['board', 'teacher', 'model_test', 'practice', 'admission'],
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
questionSchema.index({ isDeleted: 1, updatedAt: -1 });
questionSchema.index({ questionType: 1, chapterId: 1, topicId: 1, subtopicId: 1, status: 1, isDeleted: 1 });

questionSchema.pre('validate', function enforceFixedStimulusInstruction(next) {
  const hasStimulus = Boolean(
    this.stimulus?.groupId?.trim() ||
      this.stimulus?.content?.bn?.length ||
      this.stimulus?.content?.en?.length
  );
  if (hasStimulus) this.stimulus.title = FIXED_STIMULUS_TITLE;
  next();
});

questionSchema.pre('validate', function validateQuestionBodyChoice(next) {
  for (const language of ['bn', 'en']) {
    const hasPlain = Boolean(this.question?.[language]?.trim());
    const hasRich = hasRichLanguage(this.questionContent, language);
    if (hasPlain && hasRich) {
      return next(
        new Error(
          `Use either plain question text or rich question content for ${language}, not both.`
        )
      );
    }
    if (language === 'bn' && !hasPlain && !hasRich) {
      return next(new Error('Bangla question text or Bangla rich question content is required.'));
    }
  }
  next();
});

questionSchema.pre('validate', function validateTypeSpecificContent(next) {
  if (this.questionType === QUESTION_TYPES.MCQ) {
    if (!this.explanation?.bn?.trim()) return next(new Error('Bangla explanation is required for MCQ questions.'));
    return next();
  }
  if (!WRITTEN_QUESTION_TYPES.includes(this.questionType)) return next();
  for (const language of ['bn', 'en']) {
    const hasPlain = Boolean(this.answer?.[language]?.trim());
    const hasRich = hasRichLanguage(this.answerContent, language);
    if (hasPlain && hasRich)
      return next(new Error(`Use either plain or rich answer content for ${language}, not both.`));
    if (language === 'bn' && !hasPlain && !hasRich)
      return next(new Error('Bangla answer text or Bangla rich answer content is required.'));
  }
  if (
    STIMULUS_QUESTION_TYPES.includes(this.questionType) &&
    !hasRichLanguage(this.stimulus?.content, 'bn')
  ) return next(new Error('Application and higher-order questions require Bangla stimulus content.'));
  next();
});

questionSchema.pre('validate', function validatePublishedBilingualContent(next) {
  if (this.status !== 'published') return next();
  if (this.questionType !== QUESTION_TYPES.MCQ) return next();
  const missing = [];
  if (
    (!this.question?.bn && !hasRichLanguage(this.questionContent, 'bn')) ||
    (!this.question?.en && !hasRichLanguage(this.questionContent, 'en'))
  )
    missing.push('question');
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
