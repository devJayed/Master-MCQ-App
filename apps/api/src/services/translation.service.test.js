const test = require('node:test');
const assert = require('node:assert/strict');
const { fillMissingEnglish } = require('./translation.service');

test('rich explanations do not trigger plain translation or populate plain fields', async (t) => {
  t.mock.method(global, 'fetch', async () => {
    throw new Error('Unexpected translation');
  });
  const payload = {
    status: 'published',
    explanation: { bn: '', en: '' },
    explanationContent: {
      bn: [{ type: 'math', text: 'x^2' }],
      en: [{ type: 'math', text: 'x^2' }],
    },
  };
  const result = await fillMissingEnglish(payload, ['explanation']);
  assert.deepEqual(result.explanation, payload.explanation);
  assert.deepEqual(result.generatedEnglishFields, []);
  payload.explanationContent.en = [];
  await assert.rejects(fillMissingEnglish(payload, ['explanation']), /English explanation/);
  payload.status = 'draft';
  await fillMissingEnglish(payload, ['explanation']);
});
