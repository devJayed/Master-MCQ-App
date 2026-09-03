const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePassword } = require('./passwordPolicy');

test('password policy accepts a bounded password containing letters and numbers', () => {
  assert.equal(validatePassword('correct-horse-7'), null);
});

test('password policy rejects short, single-class, and oversized passwords', () => {
  assert.ok(validatePassword('short1'));
  assert.ok(validatePassword('onlyletters'));
  assert.ok(validatePassword('12345678'));
  assert.ok(validatePassword(`Valid1${'x'.repeat(123)}`));
});
