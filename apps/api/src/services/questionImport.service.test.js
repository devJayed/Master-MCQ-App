const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRichBlocks } = require('./questionImport.service');

test('parses supported Excel rich-content JSON blocks', () => {
  const blocks = parseRichBlocks(
    JSON.stringify([
      { type: 'text', text: 'Question' },
      { type: 'code', text: 'const answer = 42;', language: 'javascript' },
      { type: 'math', text: 'x^2', display: true },
      { type: 'image', url: 'https://example.com/question.png', alt: 'Diagram' },
      { type: 'table', rows: [['A', 'B'], ['1', '2']] },
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
