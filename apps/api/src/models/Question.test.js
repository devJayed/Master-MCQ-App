const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Question = require('./Question');

const id = new mongoose.Types.ObjectId();
const base = { chapterId: id, topicId: id, createdBy: id, question: { bn: 'প্রশ্ন' } };

test('accepts written question types without MCQ fields', async () => {
  await assert.doesNotReject(() =>
    new Question({ ...base, questionType: 1, answer: { bn: 'উত্তর' } }).validate()
  );
});

test('requires answers for written questions and stimulus for types 3 and 4', async () => {
  await assert.rejects(
    () => new Question({ ...base, questionType: 2 }).validate(),
    /Bangla answer/
  );
  await assert.rejects(
    () => new Question({ ...base, questionType: 3, answer: { bn: 'উত্তর' } }).validate(),
    /stimulus/
  );
  await assert.doesNotReject(() =>
    new Question({
      ...base,
      questionType: 4,
      answer: { bn: 'উত্তর' },
      stimulus: { content: { bn: [{ type: 'text', text: 'উদ্দীপক' }] } },
    }).validate()
  );
});

test('keeps MCQ structural validation isolated to type 0', async () => {
  await assert.rejects(
    () => new Question({ ...base, questionType: 0, explanation: { bn: 'ব্যাখ্যা' } }).validate(),
    /four options/
  );
});

const keys = ['A', 'B', 'C', 'D'];
const rich = () => ({ bn: [{ type: 'math', text: 'x^2' }], en: [{ type: 'math', text: 'x^2' }] });
const mcq = () => ({
  ...base,
  questionType: 0,
  question: { bn: 'Question', en: 'Question' },
  explanation: { bn: 'Explanation', en: 'Explanation' },
  correctAnswer: 'A',
  options: keys.map((key) => ({ key, text: { bn: '', en: '' } })),
  optionContent: keys.map((key) => ({ key, content: rich() })),
});

test('accepts published rich-only options and independently chosen plain options', async () => {
  const payload = mcq();
  payload.status = 'published';
  await new Question(payload).validate();
  payload.options[1].text = { bn: 'B', en: 'B' };
  payload.optionContent[1].content = { bn: [], en: [] };
  await new Question(payload).validate();
});

test('rejects missing Bangla and mixed plain/rich content for every option', async () => {
  for (const [index, key] of keys.entries()) {
    const missing = mcq();
    missing.optionContent[index].content.bn = [];
    await assert.rejects(new Question(missing).validate(), new RegExp(`Option ${key}.*Bangla`));
    for (const language of ['bn', 'en']) {
      const mixed = mcq();
      mixed.options[index].text[language] = 'Plain';
      await assert.rejects(new Question(mixed).validate(), /not both|either/i);
    }
  }
});

test('requires English rich options only when published', async () => {
  const payload = mcq();
  payload.optionContent[0].content.en = [];
  await new Question(payload).validate();
  payload.status = 'published';
  await assert.rejects(new Question(payload).validate(), /English|EN|option A/i);
});
