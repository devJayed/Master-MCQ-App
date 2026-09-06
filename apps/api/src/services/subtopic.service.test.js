const test = require('node:test');
const assert = require('node:assert/strict');
const Subtopic = require('../models/Subtopic');
const { createSubtopic } = require('./subtopic.service');

const duplicateOrder = () =>
  Object.assign(new Error('duplicate'), {
    code: 11000,
    keyPattern: { topicId: 1, order: 1 },
  });

function mockStore(t, records) {
  t.mock.method(Subtopic, 'findOne', (filter) => ({
    sort: () => ({
      select: () => ({
        lean: async () =>
          records
            .filter((row) => row.topicId === filter.topicId)
            .sort((a, b) => b.order - a.order)[0] || null,
      }),
    }),
  }));
  return t.mock.method(Subtopic, 'create', async (payload) => {
    records.push(payload);
    return payload;
  });
}

test('appends after gaps and archived orders instead of using the visible count', async (t) => {
  mockStore(t, [
    { topicId: 'topic', order: 1 },
    { topicId: 'topic', order: 10 },
    { topicId: 'topic', order: 11, isActive: false },
    { topicId: 'other', order: 99 },
  ]);
  const result = await createSubtopic({
    topicId: 'topic',
    order: 10,
    name: { en: 'New', bn: 'New' },
  });
  assert.equal(result.order, 12);
  assert.equal(result.name.en, 'New');
});

test('starts an empty topic at order one', async (t) => {
  mockStore(t, []);
  assert.equal((await createSubtopic({ topicId: 'topic' })).order, 1);
});

test('retries after a concurrent addition claims the next order', async (t) => {
  const records = [{ topicId: 'topic', order: 10 }];
  const create = mockStore(t, records);
  create.mock.mockImplementationOnce(async (payload) => {
    records.push(payload);
    throw duplicateOrder();
  });
  assert.equal((await createSubtopic({ topicId: 'topic' })).order, 12);
});

test('bounds retries and returns a friendly conflict', async (t) => {
  const create = mockStore(t, []);
  create.mock.mockImplementation(async () => {
    throw duplicateOrder();
  });
  await assert.rejects(createSubtopic({ topicId: 'topic' }), { statusCode: 409 });
  assert.equal(create.mock.callCount(), 5);
});

test('does not retry unrelated database or validation errors', async (t) => {
  const create = mockStore(t, []);
  const error = Object.assign(new Error('duplicate id'), { code: 11000, keyPattern: { _id: 1 } });
  create.mock.mockImplementation(async () => {
    throw error;
  });
  await assert.rejects(createSubtopic({ topicId: 'topic' }), (caught) => caught === error);
  assert.equal(create.mock.callCount(), 1);
});
