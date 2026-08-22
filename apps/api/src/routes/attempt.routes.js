const router = require('express').Router(),
  Attempt = require('../models/ExamAttempt'),
  Question = require('../models/Question'),
  Chapter = require('../models/Chapter'),
  { protect } = require('../middleware/auth');
router.post('/', protect, async (req, res, next) => {
  try {
    const { submissionKey, questionIds = [], answers = [] } = req.body;
    if (!submissionKey || !Array.isArray(questionIds) || !questionIds.length) {
      return res.status(400).json({ message: 'A submission key and questions are required.' });
    }
    const uniqueIds = [...new Set(questionIds.map(String))];
    if (uniqueIds.length !== questionIds.length) {
      return res.status(400).json({ message: 'A test cannot contain duplicate questions.' });
    }
    const questions = await Question.find({ _id: { $in: uniqueIds }, isDeleted: false }).lean();
    const questionById = Object.fromEntries(questions.map((question) => [String(question._id), question]));
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: 'One or more submitted questions are unavailable.' });
    }
    const chapters = await Chapter.find({ _id: { $in: questions.map((question) => question.chapterId) } })
      .select('name')
      .lean();
    const chapterById = Object.fromEntries(chapters.map((chapter) => [String(chapter._id), chapter]));
    if (questions.some((question) => !chapterById[String(question.chapterId)])) {
      return res.status(400).json({ message: 'One or more question chapters are unavailable.' });
    }
    const submittedAnswers = Object.fromEntries(
      answers.map((answer) => [String(answer.questionId), answer.selectedAnswer || null])
    );
    const scored = questionIds.map((questionId) => {
      const question = questionById[String(questionId)];
      const selectedAnswer = submittedAnswers[String(questionId)] || null;
      const isCorrect = selectedAnswer !== null && selectedAnswer === question.correctAnswer;
      return {
        questionId,
        selectedAnswer,
        isCorrect,
        status: selectedAnswer === null ? 'unanswered' : isCorrect ? 'correct' : 'incorrect',
      };
    });
    const snapshots = questionIds.map((questionId, index) => {
      const question = questionById[String(questionId)];
      const result = scored[index];
      return {
        questionId: question._id,
        chapterId: question.chapterId,
        chapterName: chapterById[String(question.chapterId)].name,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: result.selectedAnswer,
        status: result.status,
        explanation: question.explanation,
        tags: question.tags || [],
        difficulty: question.difficulty,
        sourceType: question.sourceType,
      };
    });
    const correctCount = scored.filter((a) => a.isCorrect).length,
      unansweredCount = scored.filter((a) => a.status === 'unanswered').length,
      totalQuestions = scored.length,
      timeTakenSeconds = Number(req.body.timeTakenSeconds ?? req.body.durationSeconds ?? 0);
    const existing = await Attempt.findOne({ submissionKey, studentId: req.user._id });
    if (existing) return res.status(200).json({ data: existing, duplicate: true });
    const data = await Attempt.create({
      studentId: req.user._id,
      submissionKey,
      mode: req.body.mode || 'custom',
      filters: req.body.filters || {},
      chapterIds: req.body.chapterIds || [],
      questionIds,
      answers: scored,
      questionSnapshots: snapshots,
      totalQuestions,
      totalMarks: totalQuestions,
      marksObtained: correctCount,
      durationSeconds: timeTakenSeconds,
      timeAllocatedSeconds: Number(req.body.timeAllocatedSeconds || 0),
      timeTakenSeconds,
      correctCount,
      wrongCount: scored.length - correctCount - unansweredCount,
      unansweredCount,
      scorePercent: Math.round((correctCount / totalQuestions) * 100),
      submittedAt: new Date(),
    });
    res.status(201).json({ data });
  } catch (e) {
    if (e?.code === 11000 && e?.keyPattern?.submissionKey && e?.keyValue?.submissionKey) {
      const data = await Attempt.findOne({ submissionKey: e.keyValue.submissionKey });
      if (data) return res.status(200).json({ data, duplicate: true });
    }
    next(e);
  }
});
router.get('/me', protect, async (req, res, next) => {
  try {
    res.json({
      data: await Attempt.find({ studentId: req.user._id })
        .sort('-createdAt')
        .limit(50)
        .populate('chapterIds', 'title'),
    });
  } catch (e) {
    next(e);
  }
});
router.get('/:id', protect, async (req, res, next) => {
  try {
    const data = await Attempt.findOne({ _id: req.params.id, studentId: req.user._id }).lean();
    if (!data) return res.status(404).json({ message: 'Test result not found.' });
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
