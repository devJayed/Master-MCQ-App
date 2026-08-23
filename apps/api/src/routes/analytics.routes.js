const router = require('express').Router(),
  Attempt = require('../models/ExamAttempt'),
  Question = require('../models/Question'),
  QuestionReport = require('../models/QuestionReport'),
  Chapter = require('../models/Chapter'),
  User = require('../models/User'),
  { protect, allow } = require('../middleware/auth');
router.get('/student', protect, async (req, res, next) => {
  try {
    const [attempts, chapters] = await Promise.all([
      Attempt.find({ studentId: req.user._id })
        .select(
          'submittedAt createdAt mode totalQuestions answers questionSnapshots scorePercent correctCount wrongCount unansweredCount marksObtained totalMarks timeTakenSeconds durationSeconds'
        )
        .sort({ submittedAt: -1, createdAt: -1 })
        .lean(),
      Chapter.find({ isActive: true }).select('name title order').sort('order').lean(),
    ]);
    const legacyQuestionIds = attempts
      .filter((attempt) => !attempt.questionSnapshots?.length)
      .flatMap((attempt) => (attempt.answers || []).map((answer) => answer.questionId));
    const legacyQuestions = legacyQuestionIds.length
      ? await Question.find({ _id: { $in: legacyQuestionIds } })
          .select('chapterId')
          .lean()
      : [];
    const legacyChapterByQuestion = Object.fromEntries(
      legacyQuestions.map((question) => [String(question._id), String(question.chapterId)])
    );
    const chapterStats = {};
    const summary = {
      testsCompleted: attempts.length,
      questionsAttempted: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unansweredQuestions: 0,
      marksObtained: 0,
      totalMarks: 0,
      overallScore: 0,
      averageScore: 0,
      bestScore: 0,
    };
    const addChapterAnswer = (chapterId, name, status) => {
      if (!chapterId) return;
      const stats = (chapterStats[chapterId] ||= {
        chapterId,
        name,
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        unansweredQuestions: 0,
        totalMarks: 0,
        marksObtained: 0,
      });
      stats.totalQuestions += 1;
      stats.totalMarks += 1;
      if (status === 'correct') {
        stats.correctAnswers += 1;
        stats.marksObtained += 1;
      } else if (status === 'incorrect') stats.incorrectAnswers += 1;
      else stats.unansweredQuestions += 1;
    };
    attempts.forEach((attempt) => {
      const totalQuestions =
        Number(attempt.totalQuestions) ||
        attempt.answers?.length ||
        attempt.questionSnapshots?.length ||
        0;
      const correct =
        Number(attempt.correctCount) ||
        attempt.answers?.filter((answer) => answer.isCorrect).length ||
        attempt.questionSnapshots?.filter((question) => question.status === 'correct').length ||
        0;
      const unanswered =
        Number(attempt.unansweredCount) ||
        attempt.answers?.filter((answer) => !answer.selectedAnswer).length ||
        attempt.questionSnapshots?.filter((question) => question.status === 'unanswered').length ||
        0;
      const incorrect =
        Number(attempt.wrongCount) || Math.max(0, totalQuestions - correct - unanswered);
      const totalMarks = Number(attempt.totalMarks) || totalQuestions;
      const marksObtained = Number(attempt.marksObtained) || correct;
      const score =
        Number(attempt.scorePercent) || (totalMarks ? (marksObtained / totalMarks) * 100 : 0);
      summary.questionsAttempted += totalQuestions;
      summary.correctAnswers += correct;
      summary.incorrectAnswers += incorrect;
      summary.unansweredQuestions += unanswered;
      summary.marksObtained += marksObtained;
      summary.totalMarks += totalMarks;
      summary.averageScore += score;
      summary.bestScore = Math.max(summary.bestScore, score);
      if (attempt.questionSnapshots?.length)
        attempt.questionSnapshots.forEach((question) =>
          addChapterAnswer(String(question.chapterId), question.chapterName, question.status)
        );
      else
        attempt.answers?.forEach((answer) =>
          addChapterAnswer(
            legacyChapterByQuestion[String(answer.questionId)],
            null,
            answer.status ||
              (answer.isCorrect ? 'correct' : answer.selectedAnswer ? 'incorrect' : 'unanswered')
          )
        );
    });
    summary.overallScore = summary.totalMarks
      ? (summary.marksObtained / summary.totalMarks) * 100
      : 0;
    summary.averageScore = attempts.length ? summary.averageScore / attempts.length : 0;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const inRange = (attempt, start, end) => {
      const date = new Date(attempt.submittedAt || attempt.createdAt);
      return date >= start && date < end;
    };
    const summarizePeriod = (periodAttempts) => {
      const questions = periodAttempts.reduce(
        (total, attempt) =>
          total +
          (Number(attempt.totalQuestions) ||
            attempt.answers?.length ||
            attempt.questionSnapshots?.length ||
            0),
        0
      );
      const averageScore = periodAttempts.length
        ? periodAttempts.reduce(
            (total, attempt) => total + (Number(attempt.scorePercent) || 0),
            0
          ) / periodAttempts.length
        : 0;
      return {
        testsCompleted: periodAttempts.length,
        questionsAttempted: questions,
        averageScore: Math.round(averageScore),
      };
    };
    const thisMonth = summarizePeriod(
      attempts.filter((attempt) => inRange(attempt, monthStart, new Date()))
    );
    const previousMonth = summarizePeriod(
      attempts.filter((attempt) => inRange(attempt, previousMonthStart, monthStart))
    );
    const activeDays = new Set(
      attempts.map((attempt) =>
        new Date(attempt.submittedAt || attempt.createdAt).toISOString().slice(0, 10)
      )
    );
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (!activeDays.has(cursor.toISOString().slice(0, 10)))
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    let streakDays = 0;
    while (activeDays.has(cursor.toISOString().slice(0, 10))) {
      streakDays += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    const chapterStatsList = Object.values(chapterStats).map((stats) => ({
      ...stats,
      accuracy: stats.totalQuestions ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0,
      averageScore: stats.totalMarks ? (stats.marksObtained / stats.totalMarks) * 100 : 0,
    }));
    const recent = attempts
      .slice(0, 8)
      .map((attempt) => ({
        id: attempt._id,
        mode: attempt.mode,
        submittedAt: attempt.submittedAt || attempt.createdAt,
        totalQuestions:
          Number(attempt.totalQuestions) ||
          attempt.answers?.length ||
          attempt.questionSnapshots?.length ||
          0,
        scorePercent: Number(attempt.scorePercent) || 0,
        timeTakenSeconds: Number(attempt.timeTakenSeconds ?? attempt.durationSeconds) || 0,
      }));
    const trend = [...attempts]
      .reverse()
      .slice(-30)
      .map((attempt) => ({
        submittedAt: attempt.submittedAt || attempt.createdAt,
        scorePercent: Number(attempt.scorePercent) || 0,
      }));
    res.json({
      data: {
        ...summary,
        averageScore: Math.round(summary.averageScore || 0),
        bestScore: Math.round(summary.bestScore || 0),
        overallScore: Math.round(summary.overallScore || 0),
        streakDays,
        thisMonth,
        previousMonth,
        recent,
        trend,
        chapters: chapters.map((chapter) => {
          const stats = chapterStatsList.find(
            (item) => String(item.chapterId) === String(chapter._id)
          );
          return (
            stats || {
              chapterId: chapter._id,
              name: chapter.name,
              title: chapter.title,
              totalQuestions: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              unansweredQuestions: 0,
              totalMarks: 0,
              marksObtained: 0,
              accuracy: 0,
              averageScore: 0,
            }
          );
        }),
      },
    });
  } catch (e) {
    next(e);
  }
});
router.get('/teacher', protect, allow('teacher'), async (req, res, next) => {
  try {
    const [students, questions, published, attempts] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Question.countDocuments({ isDeleted: false }),
      Question.countDocuments({ status: 'published', isDeleted: false }),
      Attempt.countDocuments(),
    ]);
    res.json({ data: { students, questions, published, attempts } });
  } catch (e) {
    next(e);
  }
});
router.get('/moderator', protect, allow('moderator', 'teacher'), async (req, res, next) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const [
      totalQuestions,
      publishedQuestions,
      draftQuestions,
      archivedQuestions,
      openReports,
      inReviewReports,
      resolvedReports,
      questionsUpdatedThisWeek,
      reportsResolvedThisWeek,
      recentQuestions,
      recentReports,
      resolutionTimes,
    ] = await Promise.all([
        Question.countDocuments({ isDeleted: false }),
        Question.countDocuments({ status: 'published', isDeleted: false }),
        Question.countDocuments({ status: 'draft', isDeleted: false }),
        Question.countDocuments({ status: 'archived', isDeleted: false }),
        QuestionReport.countDocuments({ status: 'open' }),
        QuestionReport.countDocuments({ status: 'in_review' }),
        QuestionReport.countDocuments({ status: 'resolved' }),
        Question.countDocuments({ isDeleted: false, updatedAt: { $gte: weekStart } }),
        QuestionReport.countDocuments({ status: 'resolved', reviewedAt: { $gte: weekStart } }),
        Question.find({ isDeleted: false })
          .select('question status difficulty updatedAt createdAt chapterId topicId')
          .populate('chapterId topicId', 'name')
          .sort('-updatedAt')
          .limit(5)
          .lean(),
        QuestionReport.find({ status: { $in: ['open', 'in_review'] } })
          .select('questionId type status createdAt')
          .populate('questionId', 'question')
          .sort('-createdAt')
          .limit(5)
          .lean(),
        QuestionReport.aggregate([
          { $match: { status: 'resolved', reviewedAt: { $ne: null }, createdAt: { $gte: weekStart } } },
          { $project: { hours: { $divide: [{ $subtract: ['$reviewedAt', '$createdAt'] }, 3600000] } } },
          { $group: { _id: null, averageHours: { $avg: '$hours' } } },
        ]),
      ]);
    const closedReports = resolvedReports;
    const activeReports = openReports + inReviewReports;
    res.json({
      data: {
        totalQuestions,
        publishedQuestions,
        draftQuestions,
        archivedQuestions,
        openReports,
        inReviewReports,
        resolvedReports,
        reportResolutionRate: activeReports + closedReports
          ? Math.round((closedReports / (activeReports + closedReports)) * 100)
          : 100,
        questionsUpdatedThisWeek,
        reportsResolvedThisWeek,
        averageResolutionHours: Math.round(resolutionTimes[0]?.averageHours || 0),
        recentQuestions,
        recentReports,
      },
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
