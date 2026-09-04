const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Question = require('./Question');

const id = new mongoose.Types.ObjectId();
const base = { chapterId: id, topicId: id, createdBy: id, question: { bn: 'প্রশ্ন' } };

test('accepts written question types without MCQ fields', async () => {
  await assert.doesNotReject(() => new Question({ ...base, questionType: 1, answer: { bn: 'উত্তর' } }).validate());
});

test('requires answers for written questions and stimulus for types 3 and 4', async () => {
  await assert.rejects(() => new Question({ ...base, questionType: 2 }).validate(), /Bangla answer/);
  await assert.rejects(() => new Question({ ...base, questionType: 3, answer: { bn: 'উত্তর' } }).validate(), /stimulus/);
  await assert.doesNotReject(() => new Question({ ...base, questionType: 4, answer: { bn: 'উত্তর' }, stimulus: { content: { bn: [{ type: 'text', text: 'উদ্দীপক' }] } } }).validate());
});

test('keeps MCQ structural validation isolated to type 0', async () => {
  await assert.rejects(() => new Question({ ...base, questionType: 0, explanation: { bn: 'ব্যাখ্যা' } }).validate(), /four options/);
});
