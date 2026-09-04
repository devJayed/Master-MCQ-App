const router = require('express').Router();
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');
const { MCQ_TYPE_FILTER, WRITTEN_QUESTION_TYPES } = require('../constants/questionTypes');

router.get('/tree', async (req, res, next) => {
  try {
    const [chapters, topics, subtopics, questionCounts] = await Promise.all([
      Chapter.find({ isActive: true }).sort('order').lean(),
      Topic.find({ isActive: true }).sort('order').lean(),
      Subtopic.find({ isActive: true }).sort('order').lean(),
      Question.aggregate([
        { $match: { status: 'published', isDeleted: false } },
        {
          $facet: {
            chapters: [{ $match: MCQ_TYPE_FILTER }, { $group: { _id: '$chapterId', count: { $sum: 1 } } }],
            topics: [{ $match: MCQ_TYPE_FILTER }, { $group: { _id: '$topicId', count: { $sum: 1 } } }],
            subtopics: [
              { $match: MCQ_TYPE_FILTER },
              { $match: { subtopicId: { $ne: null } } },
              { $group: { _id: '$subtopicId', count: { $sum: 1 } } },
            ],
            studyChapters: [{ $match: { questionType: { $in: WRITTEN_QUESTION_TYPES } } }, { $group: { _id: '$chapterId', count: { $sum: 1 } } }],
            studyTopics: [{ $match: { questionType: { $in: WRITTEN_QUESTION_TYPES } } }, { $group: { _id: '$topicId', count: { $sum: 1 } } }],
            studySubtopics: [{ $match: { questionType: { $in: WRITTEN_QUESTION_TYPES }, subtopicId: { $ne: null } } }, { $group: { _id: '$subtopicId', count: { $sum: 1 } } }],
          },
        },
      ]),
    ]);
    const countById = (items = []) =>
      Object.fromEntries(
        items.filter((item) => item._id).map((item) => [String(item._id), item.count])
      );
    const counts = questionCounts[0] || {};
    const chapterCounts = countById(counts.chapters);
    const topicCounts = countById(counts.topics);
    const subtopicCounts = countById(counts.subtopics);
    const studyChapterCounts = countById(counts.studyChapters);
    const studyTopicCounts = countById(counts.studyTopics);
    const studySubtopicCounts = countById(counts.studySubtopics);
    const subtopicsByTopic = subtopics.reduce((grouped, subtopic) => {
      (grouped[String(subtopic.topicId)] ||= []).push({
        ...subtopic,
        questionCount: subtopicCounts[String(subtopic._id)] || 0,
        studyQuestionCount: studySubtopicCounts[String(subtopic._id)] || 0,
      });
      return grouped;
    }, {});
    const topicsByChapter = topics.reduce((grouped, topic) => {
      (grouped[String(topic.chapterId)] ||= []).push({
        ...topic,
        questionCount: topicCounts[String(topic._id)] || 0,
        studyQuestionCount: studyTopicCounts[String(topic._id)] || 0,
        subtopics: subtopicsByTopic[String(topic._id)] || [],
      });
      return grouped;
    }, {});
    res.json({
      data: chapters.map((chapter) => ({
        ...chapter,
        questionCount: chapterCounts[String(chapter._id)] || 0,
        studyQuestionCount: studyChapterCounts[String(chapter._id)] || 0,
        topics: topicsByChapter[String(chapter._id)] || [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
