const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');

const removeEmptySubtopic = (payload) => {
  if (!payload || !payload.subtopicId || String(payload.subtopicId).trim() === '') {
    const { subtopicId, ...withoutSubtopic } = payload || {};
    return withoutSubtopic;
  }
  return payload;
};

const assertQuestionHierarchy = async (payload) => {
  if (!payload?.chapterId || !payload?.topicId)
    throw new Error('A chapter and a topic are required for every question.');

  const topic = await Topic.findOne({ _id: payload.topicId, chapterId: payload.chapterId });
  if (!topic) throw new Error('The selected topic does not belong to the selected chapter.');

  if (!payload.subtopicId) return;

  const subtopic = await Subtopic.findOne({
    _id: payload.subtopicId,
    topicId: payload.topicId,
    chapterId: payload.chapterId,
  });

  if (!subtopic) throw new Error('The selected subtopic does not belong to the selected topic.');
};

module.exports = { removeEmptySubtopic, assertQuestionHierarchy };
