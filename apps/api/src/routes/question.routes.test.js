const test = require('node:test');
const assert = require('node:assert/strict');
const Question = require('../models/Question');
const router = require('./question.routes');
const { MCQ_TYPE_FILTER } = require('../constants/questionTypes');

const route = router.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.get);
const handler = route.route.stack[0].handle;

async function request(t, query, total = 45) {
  const calls = {};
  const rows = [{ _id: 'question', tags: ['Board'], difficulty: 'easy' }];
  t.mock.method(Question, 'countDocuments', async (filter) => {
    calls.countFilter = filter;
    return total;
  });
  t.mock.method(Question, 'find', (filter) => {
    calls.findFilter = filter;
    const cursor = {
      populate() {
        return cursor;
      },
      sort(value) {
        calls.sort = value;
        return cursor;
      },
      skip(value) {
        calls.skip = value;
        return cursor;
      },
      limit(value) {
        calls.limit = value;
        return Promise.resolve(rows);
      },
    };
    return cursor;
  });
  let body;
  await handler(
    { query },
    {
      json(value) {
        body = value;
      },
    },
    (error) => {
      throw error;
    }
  );
  return { calls, body, rows };
}

test('public paginated questions preserve syllabus visibility and subtopic filters', async (t) => {
  assert.equal(route.route.stack.length, 1, 'public listing does not require authentication');
  const { calls, body, rows } = await request(t, {
    subtopicId: 'subtopic',
    page: '2',
    pageSize: '20',
  });
  assert.deepEqual(calls.findFilter, {
    status: 'published',
    isDeleted: false,
    ...MCQ_TYPE_FILTER,
    subtopicId: 'subtopic',
  });
  assert.deepEqual(calls.countFilter, calls.findFilter);
  assert.deepEqual(calls.sort, { _id: 1 });
  assert.equal(calls.skip, 20);
  assert.equal(calls.limit, 20);
  assert.deepEqual(body, {
    data: rows,
    pagination: { page: 2, pageSize: 20, total: 45, totalPages: 3 },
  });
});

test('pagination clamps pages and page sizes including empty results', async (t) => {
  for (const [query, total, expected] of [
    [{ page: '999', pageSize: '20' }, 45, { page: 3, pageSize: 20, total: 45, totalPages: 3 }],
    [{ page: '-2', pageSize: '999' }, 45, { page: 1, pageSize: 50, total: 45, totalPages: 1 }],
    [{ pageSize: '0' }, 2, { page: 1, pageSize: 1, total: 2, totalPages: 2 }],
    [
      { page: 'invalid', pageSize: 'invalid' },
      0,
      { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ],
    [{ page: '1' }, 45, { page: 1, pageSize: 20, total: 45, totalPages: 3 }],
  ]) {
    await t.test(JSON.stringify(query), async (child) => {
      const { body, calls } = await request(child, query, total);
      assert.deepEqual(body.pagination, expected);
      assert.equal(calls.skip, (expected.page - 1) * expected.pageSize);
      assert.equal(calls.limit, expected.pageSize);
    });
  }
});

test('unpaginated callers retain their limit and response shape', async (t) => {
  const { body, rows, calls } = await request(t, { limit: '1000' });
  assert.deepEqual(body, { data: rows });
  assert.equal(calls.limit, 1000);
  assert.equal(calls.countFilter, undefined);
  assert.equal(calls.sort, undefined);
  assert.equal(calls.skip, undefined);
});

test('countOnly takes precedence over pagination and avoids fetching questions', async (t) => {
  const { body, calls } = await request(t, {
    countOnly: 'true',
    page: '2',
    subtopicId: 'subtopic',
  });
  assert.deepEqual(body, { count: 45 });
  assert.equal(calls.countFilter.subtopicId, 'subtopic');
  assert.equal(calls.findFilter, undefined);
});

test('pagination database failures reach error middleware', async (t) => {
  const failure = new Error('Database unavailable');
  t.mock.method(Question, 'countDocuments', async () => {
    throw failure;
  });
  let received;
  await handler(
    { query: { page: '1' } },
    {
      json() {
        assert.fail('Unexpected success');
      },
    },
    (error) => {
      received = error;
    }
  );
  assert.equal(received, failure);
});
