const router = require('express').Router();
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');
const { protect, allow } = require('../middleware/auth');
const staff = [protect, allow('teacher', 'moderator')];

router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.topicId) filter.topicId = req.query.topicId;
    res.json({ data: await Subtopic.find(filter).sort('order').lean() });
  } catch (error) { next(error); }
});

router.post('/', ...staff, async (req, res, next) => {
  try {
    const [chapter, topic] = await Promise.all([
      Chapter.findOne({ _id: req.body.chapterId, isActive: true }),
      Topic.findOne({ _id: req.body.topicId, isActive: true }),
    ]);
    if (!chapter || !topic || String(topic.chapterId) !== String(chapter._id))
      return res.status(400).json({ message: 'Select a topic belonging to the selected active chapter.' });
    res.status(201).json({ data: await Subtopic.create(req.body) });
  } catch (error) { next(error); }
});

router.patch('/reorder', ...staff, async (req, res, next) => {
  try {
    const items = req.body.items || [];
    if (!items.length) return res.status(400).json({ message: 'Provide subtopic order items.' });
    const subtopics = await Subtopic.find({ _id: { $in: items.map((item) => item.id) } }).select('topicId');
    if (subtopics.length !== items.length || new Set(subtopics.map((subtopic) => String(subtopic.topicId))).size !== 1)
      return res.status(400).json({ message: 'Subtopics must belong to the same topic.' });
    await Subtopic.bulkWrite(items.map((item, index) => ({ updateOne: { filter: { _id: item.id }, update: { order: -(index + 1) } } })));
    await Subtopic.bulkWrite(items.map((item) => ({ updateOne: { filter: { _id: item.id }, update: { order: item.order } } })));
    res.json({ data: await Subtopic.find({ topicId: subtopics[0].topicId, isActive: true }).sort('order') });
  } catch (error) { next(error); }
});

router.patch('/:id', ...staff, async (req, res, next) => {
  try {
    if (req.body.chapterId || req.body.topicId)
      return res.status(400).json({ message: 'A subtopic cannot be moved to another topic.' });
    const data = await Subtopic.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ message: 'Subtopic not found.' });
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete('/:id', ...staff, async (req, res, next) => {
  try {
    const subtopic = await Subtopic.findById(req.params.id);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found.' });
    if (await Question.exists({ subtopicId: subtopic._id, isDeleted: false })) {
      await Subtopic.updateOne({ _id: subtopic._id }, { isActive: false });
      return res.json({ data: { archived: true }, message: 'Subtopic was archived because questions reference it.' });
    }
    await subtopic.deleteOne();
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
