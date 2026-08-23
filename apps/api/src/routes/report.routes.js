const router = require('express').Router();
const Attempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const QuestionReport = require('../models/QuestionReport');
const { protect, allow } = require('../middleware/auth');

const TYPES = ['incorrect_answer', 'ambiguous_options', 'typo', 'explanation', 'other'];
const STATUSES = ['open', 'in_review', 'resolved', 'dismissed'];
const PAGE_SIZES = [10, 20, 30, 40, 50];

router.post('/', protect, allow('student'), async (req, res, next) => {
  try {
    const { questionId, attemptId, type, details } = req.body;
    if (!TYPES.includes(type)) return res.status(400).json({ message: 'Select a valid issue type.' });
    const attempt = await Attempt.findOne({ _id: attemptId, studentId: req.user._id }).select('questionIds');
    if (!attempt || !attempt.questionIds.some((id) => String(id) === String(questionId))) {
      return res.status(400).json({ message: 'This question is not part of your test attempt.' });
    }
    if (!(await Question.exists({ _id: questionId }))) return res.status(404).json({ message: 'Question not found.' });
    const duplicate = await QuestionReport.exists({ questionId, attemptId, reportedBy: req.user._id, status: { $in: ['open', 'in_review'] } });
    if (duplicate) return res.status(409).json({ message: 'You already have an active report for this question.' });
    const data = await QuestionReport.create({ questionId, attemptId, type, details, reportedBy: req.user._id });
    res.status(201).json({ data, message: 'Report submitted. Thank you for helping us improve.' });
  } catch (error) { next(error); }
});

router.get('/', protect, allow('moderator', 'teacher'), async (req, res, next) => {
  try {
    const filter = {};
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (TYPES.includes(req.query.type)) filter.type = req.query.type;
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchingQuestions = await Question.find({ $or: [
        { 'question.bn': { $regex: search, $options: 'i' } },
        { 'question.en': { $regex: search, $options: 'i' } },
      ] }).distinct('_id');
      filter.$or = [
        { details: { $regex: search, $options: 'i' } },
        { resolutionNote: { $regex: search, $options: 'i' } },
        { questionId: { $in: matchingQuestions } },
      ];
    }
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = PAGE_SIZES.includes(Number(req.query.pageSize)) ? Number(req.query.pageSize) : 10;
    const [total, counts] = await Promise.all([
      QuestionReport.countDocuments(filter),
      QuestionReport.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const currentPage = Math.min(page, totalPages);
    const data = await QuestionReport.find(filter)
      .populate('questionId', 'question difficulty status isDeleted chapterId topicId')
      .populate('reportedBy', 'name nameEnglish nameBangla email')
      .populate('reviewedBy', 'name nameEnglish nameBangla')
      .sort('-createdAt').skip((currentPage - 1) * pageSize).limit(pageSize).lean();
    const summary = Object.fromEntries(STATUSES.map((item) => [item, 0]));
    counts.forEach(({ _id, count }) => { summary[_id] = count; });
    summary.total = counts.reduce((sum, item) => sum + item.count, 0);
    res.json({ data, summary, pagination: { page: currentPage, pageSize, total, totalPages } });
  } catch (error) { next(error); }
});

router.patch('/:id', protect, allow('moderator', 'teacher'), async (req, res, next) => {
  try {
    const { status, resolutionNote = '' } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Select a valid report status.' });
    if (['resolved', 'dismissed'].includes(status) && resolutionNote.trim().length < 5) {
      return res.status(400).json({ message: 'Add a brief resolution note before closing this report.' });
    }
    const data = await QuestionReport.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ message: 'Report not found.' });
    res.json({ data, message: 'Report updated successfully.' });
  } catch (error) { next(error); }
});

module.exports = router;
