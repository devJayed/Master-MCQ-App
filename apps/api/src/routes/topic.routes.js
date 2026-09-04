const router = require('express').Router();
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');
const { protect, allow } = require('../middleware/auth');
const staff = [protect, allow('teacher', 'moderator')];

const createAtNextOrder = async (payload, attemptsRemaining = 3) => {
  const lastTopic = await Topic.findOne({ chapterId: payload.chapterId })
    .sort({ order: -1 })
    .select('order')
    .lean();
  try {
    return await Topic.create({ ...payload, order: (lastTopic?.order || 0) + 1 });
  } catch (error) {
    // Another request may have claimed the same position after it was read.
    if (error?.code === 11000 && attemptsRemaining > 1)
      return createAtNextOrder(payload, attemptsRemaining - 1);
    throw error;
  }
};

router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    res.json({ data: await Topic.find(filter).sort('order').lean() });
  } catch (error) {
    next(error);
  }
});

router.post('/', ...staff, async (req, res, next) => {
  try {
    const chapter = await Chapter.findOne({ _id: req.body.chapterId, isActive: true });
    if (!chapter)
      return res.status(400).json({ message: 'Select an active chapter for this topic.' });
    const data = await createAtNextOrder({ ...req.body, chapterId: chapter._id });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/reorder', ...staff, async (req, res, next) => {
  try {
    const items = req.body.items || [];
    if (!items.length) return res.status(400).json({ message: 'Provide topic order items.' });
    const topics = await Topic.find({ _id: { $in: items.map((item) => item.id) } }).select(
      'chapterId'
    );
    if (
      topics.length !== items.length ||
      new Set(topics.map((topic) => String(topic.chapterId))).size !== 1
    )
      return res.status(400).json({ message: 'Topics must belong to the same chapter.' });
    await Topic.bulkWrite(
      items.map((item, index) => ({
        updateOne: { filter: { _id: item.id }, update: { order: -(index + 1) } },
      }))
    );
    await Topic.bulkWrite(
      items.map((item) => ({
        updateOne: { filter: { _id: item.id }, update: { order: item.order } },
      }))
    );
    res.json({
      data: await Topic.find({ chapterId: topics[0].chapterId, isActive: true }).sort('order'),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', ...staff, async (req, res, next) => {
  try {
    if (req.body.chapterId)
      return res.status(400).json({ message: 'A topic cannot be moved to another chapter.' });
    const data = await Topic.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ message: 'Topic not found.' });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', ...staff, async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found.' });
    const [hasSubtopics, hasQuestions] = await Promise.all([
      Subtopic.exists({ topicId: topic._id }),
      Question.exists({ topicId: topic._id, isDeleted: false }),
    ]);
    if (hasSubtopics || hasQuestions) {
      await Promise.all([
        Topic.updateOne({ _id: topic._id }, { isActive: false }),
        Subtopic.updateMany({ topicId: topic._id }, { isActive: false }),
      ]);
      return res.json({
        data: { archived: true },
        message: 'Topic and its subtopics were archived because they have dependencies.',
      });
    }
    await topic.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
