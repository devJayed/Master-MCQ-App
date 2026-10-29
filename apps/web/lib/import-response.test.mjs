import assert from 'node:assert/strict';
import test from 'node:test';
import { readImportResponse } from './import-response.mjs';

test('preserves validation data and API error messages', async () => {
  const payload = { data: { totalRows: 1, rows: [{ question: 'Example' }] } };
  assert.deepEqual(await readImportResponse(Response.json(payload)), payload);
  await assert.rejects(
    readImportResponse(Response.json({ message: 'Question text is required.' }, { status: 400 })),
    /Question text is required/
  );
});

test('explains HTML upload size and gateway failures without exposing parser errors', async () => {
  await assert.rejects(
    readImportResponse(new Response('<html>Too large</html>', { status: 413 })),
    /HTTP 413.*Split the file/
  );
  await assert.rejects(
    readImportResponse(new Response('<html>Timeout</html>', { status: 504 })),
    /HTTP 504.*check the question bank/
  );
});

test('rejects empty, malformed, or invalid successful payloads', async () => {
  for (const body of ['', '{broken', 'null', '{}', '{"data":[]}']) {
    await assert.rejects(
      readImportResponse(new Response(body)),
      /unexpected response \(HTTP 200\)/
    );
  }
});

test('handles JSON errors without a usable message', async () => {
  await assert.rejects(
    readImportResponse(Response.json({ message: {} }, { status: 401 })),
    /session has expired/
  );
});
