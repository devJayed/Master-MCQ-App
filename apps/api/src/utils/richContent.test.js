const test = require('node:test');
const assert = require('node:assert/strict');
const { hasMeaningfulBlock, hasRichLanguage } = require('./richContent');

test('detects meaningful text, image, and table rich-content blocks', () => {
  assert.equal(hasMeaningfulBlock({ type: 'text', text: 'Question' }), true);
  assert.equal(hasMeaningfulBlock({ type: 'image', url: 'https://example.com/q.png' }), true);
  assert.equal(hasMeaningfulBlock({ type: 'table', rows: [['', 'value']] }), true);
});

test('ignores empty rich-content blocks and checks each language independently', () => {
  const content = {
    bn: [{ type: 'text', text: '  ' }],
    en: [{ type: 'math', text: 'x^2' }],
  };
  assert.equal(hasRichLanguage(content, 'bn'), false);
  assert.equal(hasRichLanguage(content, 'en'), true);
});
