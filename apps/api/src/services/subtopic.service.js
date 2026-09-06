const Subtopic = require('../models/Subtopic');

// New subtopics append to the topic, including orders held by archived records.
async function createSubtopic(payload) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const last = await Subtopic.findOne({ topicId: payload.topicId })
      .sort({ order: -1 })
      .select('order')
      .lean();
    const order = Math.max(0, last?.order || 0) + 1;
    try {
      return await Subtopic.create({ ...payload, order });
    } catch (error) {
      const isOrderConflict =
        error.code === 11000 && error.keyPattern?.topicId === 1 && error.keyPattern?.order === 1;
      if (!isOrderConflict) throw error;
      // A concurrent addition may have claimed this order. Read again before retrying.
      if (attempt === 4) {
        const conflict = new Error('Subtopics changed while adding. Please try again.');
        conflict.statusCode = 409;
        throw conflict;
      }
    }
  }
}

module.exports = { createSubtopic };
