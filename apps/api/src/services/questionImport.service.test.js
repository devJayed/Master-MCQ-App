const assert = require('node:assert/strict');

(async () => {
  try {
    const importService = require('./questionImport.service');
    assert.ok(importService && typeof importService.validateQuestionRows === 'function');
    console.log('questionImport.service load ok');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
