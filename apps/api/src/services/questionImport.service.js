const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');
const { fillMissingEnglish } = require('./translation.service');
const { removeEmptySubtopic } = require('./questionHierarchy.service');

const ACCEPTED_STATUS = ['draft', 'published', 'archived'];
const ACCEPTED_SOURCES = ['board', 'teacher', 'model_test', 'practice', 'admission'];
const ACCEPTED_DIFFICULTY = ['easy', 'medium', 'hard'];
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\u200B/g, '')
    .replace(/\s+/g, ' ');

const normalizeForCompare = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseTags = (value) =>
  normalizeText(value)
    .split(/[|,;]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index);

const readQuestionRows = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'array', raw: false });
  const sheetName = workbook.SheetNames.find((name) => /questions/i.test(name)) || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error('The uploaded file does not contain a worksheet to import.');
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false, blankrows: false });
  return rows.filter((row) => Object.values(row).some((value) => normalizeText(value) !== ''));
};

const getHeaderValue = (row, aliases) => {
  const entries = Object.entries(row || {});
  for (const alias of aliases) {
    const exact = entries.find(([key]) => normalizeForCompare(key) === normalizeForCompare(alias));
    if (exact) return exact[1];
  }
  const direct = entries.find(([key]) => normalizeForCompare(key) === normalizeForCompare(aliases[0]));
  return direct ? direct[1] : '';
};

const findMatchingName = (records, value) => {
  const target = normalizeForCompare(value);
  if (!target) return null;
  return records.find((item) => {
    const names = [item.name?.bn, item.name?.en, item.title].filter(Boolean);
    return names.some((name) => normalizeForCompare(name) === target);
  }) || null;
};

const buildSyllabusIndex = async () => {
  const [chapters, topics, subtopics] = await Promise.all([
    Chapter.find({ isActive: true }).sort('order').lean(),
    Topic.find({ isActive: true }).sort('order').lean(),
    Subtopic.find({ isActive: true }).sort('order').lean(),
  ]);

  return {
    chapters,
    topicsByChapter: topics.reduce((map, topic) => {
      const key = String(topic.chapterId);
      (map[key] ||= []).push(topic);
      return map;
    }, {}),
    subtopicsByTopic: subtopics.reduce((map, subtopic) => {
      const key = String(subtopic.topicId);
      (map[key] ||= []).push(subtopic);
      return map;
    }, {}),
  };
};

const buildQuestionPayload = (row, chapter, topic, subtopic) => {
  const questionBn = normalizeText(row['Question BN'] || row['Question_BN'] || row['Question BN ']);
  const questionEn = normalizeText(row['Question EN'] || row['Question_EN'] || row['Question EN ']);
  const explanationBn = normalizeText(row['Explanation BN'] || row['Explanation_BN'] || row['Explanation BN ']);
  const explanationEn = normalizeText(row['Explanation EN'] || row['Explanation_EN'] || row['Explanation EN ']);
  const difficulty = normalizeText(row.Difficulty || row.difficulty || 'medium').toLowerCase();
  const sourceType = normalizeText(row['Source Type'] || row.sourceType || 'teacher').toLowerCase();
  const status = normalizeText(row.Status || row.status || 'draft').toLowerCase();

  const options = OPTION_KEYS.map((key) => {
    const bn = normalizeText(row[`Option ${key} BN`] || row[`Option_${key}_BN`] || row[`Option ${key} BN `]);
    const en = normalizeText(row[`Option ${key} EN`] || row[`Option_${key}_EN`] || row[`Option ${key} EN `]);
    return {
      key,
      text: { bn, en },
    };
  });

  const correctAnswer = normalizeText(row.CorrectAnswer || row['Correct Answer'] || row.correctAnswer || 'A').toUpperCase();

  return {
    chapterId: chapter._id,
    topicId: topic._id,
    ...(subtopic ? { subtopicId: subtopic._id } : {}),
    question: { bn: questionBn, en: questionEn },
    options,
    correctAnswer,
    explanation: { bn: explanationBn, en: explanationEn },
    difficulty: ACCEPTED_DIFFICULTY.includes(difficulty) ? difficulty : difficulty,
    sourceType: ACCEPTED_SOURCES.includes(sourceType) ? sourceType : sourceType,
    tags: parseTags(row.Tags || row.tags || ''),
    status: ACCEPTED_STATUS.includes(status) ? status : 'draft',
    isDeleted: false,
    questionType: 'single_choice',
  };
};

const findDuplicateQuestion = async (payload) => {
  const normalized = normalizeForCompare(payload.question?.bn || '');
  if (!normalized) return null;

  const query = {
    topicId: payload.topicId,
    isDeleted: false,
    ...(payload.subtopicId
      ? { subtopicId: payload.subtopicId }
      : {
          $or: [{ subtopicId: null }, { subtopicId: { $exists: false } }],
        }),
  };

  const existing = await Question.find(query).select('question.subtopicId question.bn topicId subtopicId').lean();
  const duplicate = existing.find((item) => {
    const existingNormalized = normalizeForCompare(item.question?.bn || '');
    return existingNormalized && existingNormalized === normalized;
  });

  return duplicate ? `A duplicate question already exists in the same topic${payload.subtopicId ? ' subtopic' : ''}.` : null;
};

const rowError = (excelRowNumber, field, message) => ({ excelRowNumber, field, message });

const normalizeImportRow = (rawRow, excelRowNumber) => {
  const row = {};
  for (const [key, value] of Object.entries(rawRow || {})) {
    row[normalizeText(key).replace(/\s+/g, ' ')] = value;
  }
  return {
    excelRowNumber,
    row,
    chapter: normalizeText(getHeaderValue(rawRow, ['Chapter', 'chapter'])),
    topic: normalizeText(getHeaderValue(rawRow, ['Topic', 'topic'])),
    subtopic: normalizeText(getHeaderValue(rawRow, ['Subtopic', 'subtopic'])),
    questionBn: normalizeText(getHeaderValue(rawRow, ['Question BN', 'Question BN ', 'question bn', 'Question_BN'])) ,
    questionEn: normalizeText(getHeaderValue(rawRow, ['Question EN', 'Question EN ', 'question en', 'Question_EN'])),
    explanationBn: normalizeText(getHeaderValue(rawRow, ['Explanation BN', 'Explanation BN ', 'explanation bn', 'Explanation_BN'])),
    explanationEn: normalizeText(getHeaderValue(rawRow, ['Explanation EN', 'Explanation EN ', 'explanation en', 'Explanation_EN'])),
    correctAnswer: normalizeText(getHeaderValue(rawRow, ['Correct Answer', 'correctAnswer', 'CorrectAnswer'])).toUpperCase(),
    difficulty: normalizeText(getHeaderValue(rawRow, ['Difficulty', 'difficulty'])).toLowerCase(),
    sourceType: normalizeText(getHeaderValue(rawRow, ['Source Type', 'sourceType', 'SourceType'])).toLowerCase(),
    status: normalizeText(getHeaderValue(rawRow, ['Status', 'status'])).toLowerCase(),
    tags: normalizeText(getHeaderValue(rawRow, ['Tags', 'tags'])),
    optionBn: (key) => normalizeText(getHeaderValue(rawRow, [`Option ${key} BN`, `Option ${key} BN `, `Option_${key}_BN`, `option ${key} bn`])),
    optionEn: (key) => normalizeText(getHeaderValue(rawRow, [`Option ${key} EN`, `Option ${key} EN `, `Option_${key}_EN`, `option ${key} en`])),
  };
};

const validateQuestionRow = async (rawRow, excelRowNumber, syllabusIndex) => {
  const normalizedRow = normalizeImportRow(rawRow, excelRowNumber);
  const errors = [];

  const chapterName = normalizedRow.chapter;
  if (!chapterName) {
    errors.push(rowError(excelRowNumber, 'Chapter', 'Chapter is required.'));
    return { valid: false, errors, row: normalizedRow };
  }

  const chapter = findMatchingName(syllabusIndex.chapters, chapterName);
  if (!chapter) {
    errors.push(rowError(excelRowNumber, 'Chapter', `Chapter "${chapterName}" was not found.`));
    return { valid: false, errors, row: normalizedRow };
  }

  const topicName = normalizedRow.topic;
  if (!topicName) {
    errors.push(rowError(excelRowNumber, 'Topic', 'Topic is required.'));
    return { valid: false, errors, row: normalizedRow };
  }

  const topic = (syllabusIndex.topicsByChapter[String(chapter._id)] || []).find((entry) =>
    [entry.name?.bn, entry.name?.en].some((name) => normalizeForCompare(name) === normalizeForCompare(topicName))
  );
  if (!topic) {
    errors.push(rowError(excelRowNumber, 'Topic', `Topic "${topicName}" was not found under Chapter "${chapterName}".`));
    return { valid: false, errors, row: normalizedRow };
  }

  if (normalizedRow.subtopic) {
    const subtopic = (syllabusIndex.subtopicsByTopic[String(topic._id)] || []).find((entry) =>
      [entry.name?.bn, entry.name?.en].some((name) => normalizeForCompare(name) === normalizeForCompare(normalizedRow.subtopic))
    );
    if (!subtopic) {
      errors.push(rowError(excelRowNumber, 'Subtopic', `Subtopic "${normalizedRow.subtopic}" was not found under Topic "${topicName}".`));
      return { valid: false, errors, row: normalizedRow };
    }
  }

  const questionBn = normalizedRow.questionBn;
  if (!questionBn) {
    errors.push(rowError(excelRowNumber, 'Question BN', 'Bangla question is required.'));
  }

  const explanationBn = normalizedRow.explanationBn;
  if (!explanationBn) {
    errors.push(rowError(excelRowNumber, 'Explanation BN', 'Bangla explanation is required.'));
  }

  const answer = normalizedRow.correctAnswer;
  if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
    errors.push(rowError(excelRowNumber, 'Correct Answer', 'Correct Answer must be A, B, C, or D.'));
  }

  const normalizedDifficulty = normalizedRow.difficulty || 'medium';
  if (!ACCEPTED_DIFFICULTY.includes(normalizedDifficulty)) {
    errors.push(rowError(excelRowNumber, 'Difficulty', 'Difficulty must be easy, medium, or hard.'));
  }

  const normalizedSource = normalizedRow.sourceType || 'teacher';
  if (!ACCEPTED_SOURCES.includes(normalizedSource)) {
    errors.push(rowError(excelRowNumber, 'Source Type', 'Source Type must be board, teacher, model_test, practice, or admission.'));
  }

  const normalizedStatus = normalizedRow.status || 'draft';
  if (!ACCEPTED_STATUS.includes(normalizedStatus)) {
    errors.push(rowError(excelRowNumber, 'Status', 'Status must be draft, published, or archived.'));
  }

  for (const key of OPTION_KEYS) {
    const bnValue = normalizedRow.optionBn(key);
    if (!bnValue) {
      errors.push(rowError(excelRowNumber, `Option ${key} BN`, `Option ${key} Bangla text is required.`));
    }
  }

  if (errors.length) {
    return { valid: false, errors, row: normalizedRow };
  }

  const subtopic = (syllabusIndex.subtopicsByTopic[String(topic._id)] || []).find((entry) =>
    normalizedRow.subtopic
      ? [entry.name?.bn, entry.name?.en].some((name) => normalizeForCompare(name) === normalizeForCompare(normalizedRow.subtopic))
      : false
  );

  const payload = buildQuestionPayload(rawRow, chapter, topic, subtopic);
  const duplicateMessage = await findDuplicateQuestion(payload);
  if (duplicateMessage) {
    errors.push(rowError(excelRowNumber, 'Question BN', duplicateMessage));
    return { valid: false, errors, row: normalizedRow };
  }

  try {
    const translated = await fillMissingEnglish(payload, ['question', 'options', 'explanation']);
    return {
      valid: true,
      row: normalizedRow,
      payload: {
        ...removeEmptySubtopic(translated),
        status: payload.status,
        questionType: 'single_choice',
        isDeleted: false,
      },
      warnings: [],
    };
  } catch (error) {
    return {
      valid: false,
      errors: [rowError(excelRowNumber, 'Bilingual content', error.message || 'English translation failed.')],
      row: normalizedRow,
    };
  }
};

const validateImportRows = async (buffer) => {
  const rawRows = readQuestionRows(buffer);
  const syllabusIndex = await buildSyllabusIndex();
  const preview = { totalRows: rawRows.length, validRows: [], invalidRows: [] };

  const duplicateMap = new Map();
  for (const [index, rawRow] of rawRows.entries()) {
    const excelRowNumber = index + 2;
    const result = await validateQuestionRow(rawRow, excelRowNumber, syllabusIndex);
    if (!result.valid) {
      preview.invalidRows.push(...result.errors.map((error) => ({ ...error })));
      continue;
    }

    const topicKey = `${String(result.payload.topicId)}::${String(result.payload.subtopicId || 'none')}`;
    const normalizedQuestion = normalizeForCompare(result.payload.question?.bn || '');
    const duplicateKey = `${topicKey}::${normalizedQuestion}`;
    if (duplicateMap.has(duplicateKey)) {
      preview.invalidRows.push(rowError(excelRowNumber, 'Question BN', 'Duplicate question detected within the same import batch.'));
      continue;
    }
    duplicateMap.set(duplicateKey, true);

    preview.validRows.push({
      excelRowNumber,
      payload: result.payload,
      warnings: result.warnings,
    });
  }

  const invalidRowNumbers = new Set(preview.invalidRows.map((error) => Number(error.excelRowNumber)));

  return {
    ...preview,
    validRows: preview.validRows.map((item) => ({ ...item, payload: { ...item.payload } })),
    invalidRows: preview.invalidRows,
    invalidRowCount: invalidRowNumbers.size,
  };
};

const buildQuestionImportTemplate = async () => {
  const syllabusIndex = await buildSyllabusIndex();

  const questionHeaders = [
    'Chapter',
    'Topic',
    'Subtopic',
    'Question BN',
    'Question EN',
    'Option A BN',
    'Option A EN',
    'Option B BN',
    'Option B EN',
    'Option C BN',
    'Option C EN',
    'Option D BN',
    'Option D EN',
    'Correct Answer',
    'Explanation BN',
    'Explanation EN',
    'Difficulty',
    'Source Type',
    'Tags',
    'Status',
  ];

  const questionsSheet = XLSX.utils.aoa_to_sheet([questionHeaders]);
  const referenceRows = [];
  for (const chapter of syllabusIndex.chapters) {
    const chapterName = chapter.name?.bn || chapter.name?.en || chapter.title;
    const topics = syllabusIndex.topicsByChapter[String(chapter._id)] || [];
    for (const topic of topics) {
      const topicName = topic.name?.bn || topic.name?.en;
      const subtopics = syllabusIndex.subtopicsByTopic[String(topic._id)] || [];
      if (!subtopics.length) {
        referenceRows.push({ Chapter: chapterName, Topic: topicName, Subtopic: '' });
        continue;
      }
      for (const subtopic of subtopics) {
        referenceRows.push({
          Chapter: chapterName,
          Topic: topicName,
          Subtopic: subtopic.name?.bn || subtopic.name?.en,
        });
      }
    }
  }

  const syllabusReference = XLSX.utils.json_to_sheet(referenceRows, {
    header: ['Chapter', 'Topic', 'Subtopic'],
    skipHeader: false,
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Questions');
  XLSX.utils.book_append_sheet(workbook, syllabusReference, 'Syllabus Reference');
  return workbook;
};

const persistValidatedRows = async (validRows, userId) => {
  if (!Array.isArray(validRows) || !validRows.length) {
    throw new Error('No valid rows available for import.');
  }

  const rowsToInsert = validRows.map((row) => {
    const payload = row.payload || row;
    const normalized = {
      ...removeEmptySubtopic(payload),
      questionType: 'single_choice',
      isDeleted: false,
      createdBy: userId,
      status: ACCEPTED_STATUS.includes((payload.status || 'draft').toLowerCase())
        ? (payload.status || 'draft').toLowerCase()
        : 'draft',
    };

    if (!normalized.question?.bn?.trim()) throw new Error('Bangla question is required for every imported question.');
    if (!normalized.explanation?.bn?.trim()) throw new Error('Bangla explanation is required for every imported question.');
    for (const key of OPTION_KEYS) {
      const option = normalized.options?.find((item) => item.key === key);
      if (!option?.text?.bn?.trim()) {
        throw new Error(`Option ${key} Bangla text is required.`);
      }
    }

    return normalized;
  });

  const session = await mongoose.startSession();
  try {
    let inserted = [];
    await session.withTransaction(async () => {
      for (const payload of rowsToInsert) {
        const duplicateMessage = await findDuplicateQuestion(payload);
        if (duplicateMessage) {
          throw new Error(duplicateMessage);
        }
      }
      inserted = await Question.insertMany(rowsToInsert, { session });
    });
    return {
      importedCount: inserted.length,
      rows: inserted.map((item) => ({ _id: item._id, question: item.question?.bn || '' })),
    };
  } finally {
    await session.endSession();
  }
};

module.exports = {
  validateImportRows,
  buildQuestionImportTemplate,
  persistValidatedRows,
  normalizeForCompare,
  normalizeText,
  parseTags,
};
