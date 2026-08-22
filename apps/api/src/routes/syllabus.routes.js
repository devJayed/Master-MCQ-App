const router = require('express').Router();
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');

router.get('/tree', async (req, res, next) => {
  try {
    const [chapters, topics, subtopics] = await Promise.all([
      Chapter.find({ isActive: true }).sort('order').lean(),
      Topic.find({ isActive: true }).sort('order').lean(),
      Subtopic.find({ isActive: true }).sort('order').lean(),
    ]);
    const subtopicsByTopic = subtopics.reduce((grouped, subtopic) => {
      (grouped[String(subtopic.topicId)] ||= []).push(subtopic);
      return grouped;
    }, {});
    const topicsByChapter = topics.reduce((grouped, topic) => {
      (grouped[String(topic.chapterId)] ||= []).push({ ...topic, subtopics: subtopicsByTopic[String(topic._id)] || [] });
      return grouped;
    }, {});
    res.json({ data: chapters.map((chapter) => ({ ...chapter, topics: topicsByChapter[String(chapter._id)] || [] })) });
  } catch (error) { next(error); }
});

module.exports = router;
