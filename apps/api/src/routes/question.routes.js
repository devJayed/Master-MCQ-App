const multer = require('multer');
const XLSX = require('xlsx');
const { buildBoardTag, getBoardShortName } = require('../services/boardTag.service');
const router = require('express').Router(),
  Question = require('../models/Question'),
  Topic = require('../models/Topic'),
  Subtopic = require('../models/Subtopic'),
  { fillMissingEnglish } = require('../services/translation.service'),
  {
    validateImportRows,
    buildQuestionImportTemplate,
    persistValidatedRows,
  } = require('../services/questionImport.service'),
  { protect, allow } = require('../middleware/auth'),
  {
    removeEmptySubtopic,
    assertQuestionHierarchy,
  } = require('../services/questionHierarchy.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, callback) => {
    const isExcel = /\.(xlsx|xls|csv)$/i.test(file.originalname || '');
    if (!isExcel) {
      callback(new Error('Only .xlsx, .xls, and .csv files are accepted.'));
      return;
    }
    callback(null, true);
  },
});

router.get('/', async (req, res, next) => {
  try {
    const filter = { status: 'published', isDeleted: false };
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.topicId) filter.topicId = req.query.topicId;
    if (req.query.subtopicId) filter.subtopicId = req.query.subtopicId;
    if (req.query.sourceType) filter.sourceType = req.query.sourceType;
    if (req.query.difficulty) filter.difficulty = { $in: req.query.difficulty.split(',') };

    const queryTags = String(req.query.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const boardShortName = getBoardShortName(req.query.board);
    const boardTag = buildBoardTag(req.query.board, req.query.year);
    const constraints = [];

    if (queryTags.length > 0) {
      constraints.push({ tags: { $all: queryTags } });
    }

    if (boardShortName && boardShortName !== 'All B') {
      if (req.query.year) {
        constraints.push({ tags: boardTag });
      } else {
        const escapedBoard = boardShortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        constraints.push({
          $or: [
            { board: { $regex: new RegExp(`^${escapedBoard}$`, 'i') } },
            { tags: { $regex: new RegExp(`^${escapedBoard}'`, 'i') } },
          ],
        });
      }
    }

    if (req.query.year && (!boardShortName || boardShortName === 'All B')) {
      filter.year = Number(req.query.year);
    }

    if (constraints.length) filter.$and = constraints;

    if (req.query.countOnly === 'true') {
      return res.json({ count: await Question.countDocuments(filter) });
    }

    const data = await Question.find(filter)
      .populate('chapterId topicId subtopicId', 'name')
      .limit(Math.min(Number(req.query.limit) || 50, 1000));
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.get('/manage', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const showArchived = req.query.archived === 'true';
    const filter = showArchived ? { isDeleted: true } : { isDeleted: false };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    if (req.query.topicId) filter.topicId = req.query.topicId;
    if (req.query.subtopicId) filter.subtopicId = req.query.subtopicId;
    if (req.query.search) {
      const search = String(req.query.search)
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { 'question.bn': { $regex: search, $options: 'i' } },
        { 'question.en': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = [10, 20, 30, 40, 50].includes(Number(req.query.pageSize))
      ? Number(req.query.pageSize)
      : 10;
    const [total, statusCounts] = await Promise.all([
      Question.countDocuments(filter),
      Question.aggregate([
        { $match: { isDeleted: showArchived } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const currentPage = Math.min(page, totalPages);
    const data = await Question.find(filter)
      .populate('chapterId topicId subtopicId', 'name')
      .sort('-updatedAt')
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);
    const summary = { total: 0, draft: 0, published: 0, archived: 0 };
    statusCounts.forEach(({ _id, count }) => {
      summary[_id] = count;
      summary.total += count;
    });
    res.json({ data, summary, pagination: { page: currentPage, pageSize, total, totalPages } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/manage', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const data = await Question.findOne({ _id: req.params.id, isDeleted: false });
    if (!data) return res.status(404).json({ message: 'Question not found.' });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const body = removeEmptySubtopic(req.body);
    await assertQuestionHierarchy(body);
    const payload = body.status === 'published' ? await fillMissingEnglish(body) : body;

    const question = await Question.create({
      ...payload,
      createdBy: req.user._id,
    });
    res.status(201).json({ data: question });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const existing = await Question.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Question not found.' });
    const body = removeEmptySubtopic(req.body);
    const candidate = { ...existing.toObject(), ...body };
    await assertQuestionHierarchy(candidate);
    const payload =
      candidate.status === 'published' ? await fillMissingEnglish(candidate) : candidate;
    const data = await Question.findByIdAndUpdate(
      req.params.id,
      { ...payload, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

router.get('/import/template', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const workbook = await buildQuestionImportTemplate();
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="mcq-import-template.xlsx"');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/import/validate',
  protect,
  allow('teacher', 'moderator'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Upload an Excel or CSV file first.' });
      const preview = await validateImportRows(req.file.buffer);
      const invalidRows =
        preview.invalidRowCount ??
        new Set(preview.invalidRows.map((error) => Number(error.excelRowNumber))).size;
      res.json({
        data: {
          totalRows: preview.totalRows,
          validRows: preview.validRows.length,
          invalidRows,
          rows: preview.validRows,
          errors: preview.invalidRows,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/import', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.validatedRows)
      ? req.body.validatedRows
      : Array.isArray(req.body?.rows)
        ? req.body.rows
        : [];
    if (!rows.length) {
      return res.status(400).json({ message: 'Provide validated rows to import.' });
    }
    const result = await persistValidatedRows(rows, req.user._id);
    res.status(201).json({
      data: {
        importedCount: result.importedCount,
        summary: result.rows,
      },
      message: `${result.importedCount} question(s) imported successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/translate', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const data = await fillMissingEnglish(req.body.payload || req.body, req.body.targets);
    res.json({ data });
  } catch (error) {
    res
      .status(502)
      .json({ message: error.message || 'English translation failed. Publishing is blocked.' });
  }
});

router.patch('/:id/restore', protect, allow('teacher'), async (req, res, next) => {
  try {
    const data = await Question.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false, status: 'draft', updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ message: 'Archived question not found.' });
    res.json({ data, message: 'Question restored as a draft.' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, allow('teacher', 'moderator'), async (req, res, next) => {
  try {
    const data = await Question.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        status: 'archived',
        updatedBy: req.user._id,
      },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    res.json({ message: 'Question archived successfully.' });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
