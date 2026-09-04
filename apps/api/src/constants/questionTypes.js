const QUESTION_TYPES = Object.freeze({
  MCQ: 0,
  KNOWLEDGE: 1,
  COMPREHENSION: 2,
  APPLICATION: 3,
  HIGHER_ORDER: 4,
});

const VALID_QUESTION_TYPES = Object.freeze(Object.values(QUESTION_TYPES));
const WRITTEN_QUESTION_TYPES = Object.freeze([1, 2, 3, 4]);
const STIMULUS_QUESTION_TYPES = Object.freeze([3, 4]);
const MCQ_TYPE_FILTER = Object.freeze({
  $or: [
    { questionType: 0 },
    { questionType: null },
    { questionType: { $exists: false } },
    // Legacy releases stored only the string "single_choice" in this field.
    // Match by BSON type so Mongoose does not try to cast that legacy string to Number.
    { $expr: { $eq: [{ $type: '$questionType' }, 'string'] } },
  ],
});

const normalizeQuestionType = (value) => {
  if (value === undefined || value === null || value === '' || value === 'single_choice') return 0;
  const normalized = Number(value);
  return VALID_QUESTION_TYPES.includes(normalized) ? normalized : Number.NaN;
};

module.exports = {
  QUESTION_TYPES,
  VALID_QUESTION_TYPES,
  WRITTEN_QUESTION_TYPES,
  STIMULUS_QUESTION_TYPES,
  MCQ_TYPE_FILTER,
  normalizeQuestionType,
};
