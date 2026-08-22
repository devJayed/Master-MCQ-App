const router = require('express').Router();
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');
const { protect, allow } = require('../middleware/auth');

const staff = [protect, allow('teacher', 'moderator')];

const listWithCounts = async () => {
  const chapters = await Chapter.find({ isActive: true }).sort('order').lean();
  const counts = await Question.aggregate([
    { $match: { status: 'published', isDeleted: false } },
    { $group: { _id: '$chapterId', count: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map((item) => [item._id.toString(), item.count]));
  return chapters.map((chapter) => ({
    ...chapter,
    title: chapter.name.en,
    questionCount: byId[chapter._id.toString()] || 0,
  }));
};

router.get('/', async (req, res, next) => {
  try {
    res.json({ data: await listWithCounts() });
  } catch (error) {
    next(error);
  }
});

router.post('/', ...staff, async (req, res, next) => {
  try {
    res.status(201).json({ data: await Chapter.create(req.body) });
    console.log('Chapter created:', req.body);
  } catch (error) {
    next(error);
  }
});

router.patch('/reorder', ...staff, async (req, res, next) => {
  try {
    const items = req.body.items || [];
    if (!items.length) return res.status(400).json({ message: 'Provide chapter order items.' });
    await Chapter.bulkWrite(
      items.map((item, index) => ({
        updateOne: { filter: { _id: item.id }, update: { order: -(index + 1) } },
      }))
    );
    await Chapter.bulkWrite(
      items.map((item) => ({
        updateOne: { filter: { _id: item.id }, update: { order: item.order } },
      }))
    );
    res.json({ data: await listWithCounts() });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', ...staff, async (req, res, next) => {
  try {
    const data = await Chapter.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ message: 'Chapter not found.' });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', ...staff, async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const [hasTopics, hasSubtopics, hasQuestions] = await Promise.all([
      Topic.exists({ chapterId: chapter._id }),
      Subtopic.exists({ chapterId: chapter._id }),
      Question.exists({ chapterId: chapter._id, isDeleted: false }),
    ]);
    if (hasTopics || hasSubtopics || hasQuestions) {
      await Promise.all([
        Chapter.updateOne({ _id: chapter._id }, { isActive: false }),
        Topic.updateMany({ chapterId: chapter._id }, { isActive: false }),
        Subtopic.updateMany({ chapterId: chapter._id }, { isActive: false }),
      ]);
      return res.json({
        data: { archived: true },
        message: 'Chapter and its syllabus items were archived because they have dependencies.',
      });
    }
    await chapter.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
