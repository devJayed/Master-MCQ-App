require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/db');

async function migrate() {
  await connectDb();
  const questions = mongoose.connection.collection('questions');
  const result = await questions.updateMany(
    { $or: [{ questionType: { $exists: false } }, { questionType: null }, { questionType: 'single_choice' }] },
    { $set: { questionType: 0 } }
  );
  const invalid = await questions.countDocuments({ questionType: { $nin: [0, 1, 2, 3, 4] } });
  console.log(`Question type migration complete: ${result.modifiedCount} updated, ${invalid} invalid remaining.`);
  if (invalid) process.exitCode = 1;
}

migrate().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
