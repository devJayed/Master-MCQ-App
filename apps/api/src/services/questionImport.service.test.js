const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRichBlocks } = require('./questionImport.service');
const { validateImportRows, persistValidatedRows } = require('./questionImport.service');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');

const optionKeys = ['A', 'B', 'C', 'D'];
const fixtureId = new mongoose.Types.ObjectId();
function importRow() {
  const row = {
    Chapter: 'Chapter',
    Topic: 'Topic',
    'Question BN': 'Question',
    'Question EN': 'Question',
    'Explanation BN': 'Explanation',
    'Explanation EN': 'Explanation',
    'Correct Answer': 'A',
    Status: 'published',
  };
  for (const key of optionKeys) {
    for (const language of ['BN', 'EN'])
      row[`Option ${key} Rich ${language}`] = JSON.stringify([{ type: 'math', text: 'x^2' }]);
  }
  return row;
}
function workbookBuffer(row) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([row]), 'Questions');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
function mockImportStore(t) {
  for (const [Model, records] of [
    [Chapter, [{ _id: fixtureId, name: { en: 'Chapter' } }]],
    [Topic, [{ _id: fixtureId, chapterId: fixtureId, name: { en: 'Topic' } }]],
    [Subtopic, []],
  ])
    t.mock.method(Model, 'find', () => ({ sort: () => ({ lean: async () => records }) }));
  t.mock.method(Question, 'find', () => ({ select: () => ({ lean: async () => [] }) }));
  t.mock.method(global, 'fetch', async () => {
    throw new Error('Unexpected translation request');
  });
}

test('Excel preview accepts rich-only explanations and rejects duplicate representations', async (t) => {
  mockImportStore(t);
  const row = importRow();
  for (const language of ['BN', 'EN']) {
    row[`Explanation ${language}`] = '';
    row[`Explanation Rich ${language}`] = JSON.stringify([{ type: 'math', text: 'x^2' }]);
  }
  const preview = await validateImportRows(workbookBuffer(row));
  assert.deepEqual(preview.invalidRows, []);
  assert.equal(preview.validRows.length, 1);
  assert.equal(preview.validRows[0].payload.explanation.bn, '');
  row['Explanation BN'] = 'Duplicate';
  const invalid = await validateImportRows(workbookBuffer(row));
  assert.equal(invalid.invalidRows.length, 1);
});

test('Excel rich-only options survive preview and insertion without translation or plain fallbacks', async (t) => {
  mockImportStore(t);
  const preview = await validateImportRows(workbookBuffer(importRow()));
  assert.deepEqual(preview.invalidRows, []);
  assert.equal(preview.validRows.length, 1);
  t.mock.method(mongoose, 'startSession', async () => ({
    withTransaction: async (callback) => callback(),
    endSession: async () => {},
  }));
  const insert = t.mock.method(Question, 'insertMany', async (rows) => {
    const docs = rows.map((row) => new Question(row));
    for (const doc of docs) await doc.validate();
    return docs;
  });
  const result = await persistValidatedRows(preview.validRows, fixtureId);
  assert.equal(result.importedCount, 1);
  for (const option of insert.mock.calls[0].arguments[0][0].options)
    assert.deepEqual(option.text, { bn: '', en: '' });
});

test('Excel rejects missing Bangla or mixed formats for A through D', async (t) => {
  mockImportStore(t);
  for (const key of optionKeys) {
    for (const language of ['BN', 'EN']) {
      const row = importRow();
      row[`Option ${key} ${language}`] = 'Plain';
      const preview = await validateImportRows(workbookBuffer(row));
      assert.equal(preview.validRows.length, 0);
      assert.ok(preview.invalidRows.some((error) => /either|not both/i.test(error.message)));
    }
    const row = importRow();
    row[`Option ${key} Rich BN`] = '';
    const preview = await validateImportRows(workbookBuffer(row));
    assert.equal(preview.validRows.length, 0);
  }
});

test('insertion rechecks edited preview options before opening a transaction', async (t) => {
  mockImportStore(t);
  const preview = await validateImportRows(workbookBuffer(importRow()));
  assert.equal(preview.validRows.length, 1);
  const session = t.mock.method(mongoose, 'startSession', async () => {
    throw new Error('Must not open transaction');
  });
  for (const [index, key] of optionKeys.entries()) {
    const rows = structuredClone(preview.validRows);
    rows[0].payload.options[index].text.en = 'Conflicting plain content';
    await assert.rejects(persistValidatedRows(rows, fixtureId), /either|not both/i);
    rows[0].payload.options[index].text.en = '';
    rows[0].payload.optionContent[index].content.bn = [];
    await assert.rejects(
      persistValidatedRows(rows, fixtureId),
      new RegExp(`Option ${key}.*Bangla`)
    );
  }
  assert.equal(session.mock.callCount(), 0);
});

test('parses supported Excel rich-content JSON blocks', () => {
  const blocks = parseRichBlocks(
    JSON.stringify([
      { type: 'text', text: 'Question' },
      { type: 'code', text: 'const answer = 42;', language: 'javascript' },
      { type: 'math', text: 'x^2', display: true },
      { type: 'image', url: 'https://example.com/question.png', alt: 'Diagram' },
      {
        type: 'table',
        rows: [
          ['A', 'B'],
          ['1', '2'],
        ],
      },
    ]),
    'Question Rich BN'
  );
  assert.equal(blocks.length, 5);
});

test('rejects malformed, unsupported, empty, and unsafe rich-content blocks', () => {
  assert.throws(() => parseRichBlocks('{bad json', 'Rich'), /valid JSON array/);
  assert.throws(() => parseRichBlocks('[{"type":"video"}]', 'Rich'), /type must be/);
  assert.throws(() => parseRichBlocks('[{"type":"text","text":""}]', 'Rich'), /requires text/);
  assert.throws(
    () => parseRichBlocks('[{"type":"image","url":"javascript:alert(1)"}]', 'Rich'),
    /http or https/
  );
});
