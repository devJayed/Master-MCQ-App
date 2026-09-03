const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyRequestOrigin } = require('./requestOrigin');

const run = ({ method = 'POST', origin, authorization } = {}) => {
  let nextCalled = false;
  let status;
  const req = {
    method,
    headers: { authorization },
    get: (name) => (name === 'origin' ? origin : undefined),
  };
  const res = {
    status(value) {
      status = value;
      return this;
    },
    json(body) {
      return body;
    },
  };
  verifyRequestOrigin(req, res, () => {
    nextCalled = true;
  });
  return { nextCalled, status };
};

test('origin protection rejects a foreign cookie-authenticated mutation', () => {
  assert.deepEqual(run({ origin: 'https://attacker.example' }), {
    nextCalled: false,
    status: 403,
  });
});

test('origin protection permits configured origins, safe methods, and bearer clients', () => {
  assert.equal(run({ origin: 'http://localhost:3000' }).nextCalled, true);
  assert.equal(run({ method: 'GET', origin: 'https://attacker.example' }).nextCalled, true);
  assert.equal(
    run({ origin: 'https://attacker.example', authorization: 'Bearer token' }).nextCalled,
    true
  );
});
