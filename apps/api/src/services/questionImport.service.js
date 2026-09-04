const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Question = require('../models/Question');
const { fillMissingEnglish } = require('./translation.service');
const { removeEmptySubtopic } = require('./questionHierarchy.service');
const { hasRichLanguage, richLanguageToText } = require('../utils/richContent');
const { QUESTION_TYPES, WRITTEN_QUESTION_TYPES, STIMULUS_QUESTION_TYPES, normalizeQuestionType } = require('../constants/questionTypes');

const ACCEPTED_STATUS = ['draft', 'published', 'archived'];
const ACCEPTED_SOURCES = ['board', 'teacher', 'model_test', 'practice', 'admission'];
const ACCEPTED_DIFFICULTY = ['easy', 'medium', 'hard'];
const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const RICH_BLOCK_TYPES = new Set(['text', 'code', 'math', 'image', 'table']);

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

const parseRichBlocks = (value, field) => {
  if (value === undefined || value === null || String(value).trim() === '') return [];
  let blocks;
  try {
    blocks = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new Error(`${field} must contain a valid JSON array.`);
  }
  if (!Array.isArray(blocks)) throw new Error(`${field} must be a JSON array of content blocks.`);
  if (blocks.length > 50) throw new Error(`${field} cannot contain more than 50 blocks.`);

  return blocks.map((block, index) => {
    const position = `${field} block ${index + 1}`;
    if (!block || typeof block !== 'object' || Array.isArray(block))
      throw new Error(`${position} must be an object.`);
    if (!RICH_BLOCK_TYPES.has(block.type))
      throw new Error(`${position} type must be text, code, math, image, or table.`);
    if (block.type === 'image' && !/^https?:\/\//i.test(String(block.url || '').trim()))
      throw new Error(`${position} requires an http or https image URL.`);
    if (block.type === 'table' && (!Array.isArray(block.rows) || !block.rows.length))
      throw new Error(`${position} requires a non-empty rows array.`);
    if (!['image', 'table'].includes(block.type) && !String(block.text || '').trim())
      throw new Error(`${position} requires text.`);
    return block;
  });
};

const parseRichColumns = (rawRow) => {
  const read = (header) => parseRichBlocks(getHeaderValue(rawRow, [header, header.replace(/ /g, '_')]), header);
  return {
    questionContent: { bn: read('Question Rich BN'), en: read('Question Rich EN') },
    answerContent: { bn: read('Answer Rich BN'), en: read('Answer Rich EN') },
    explanationContent: { bn: read('Explanation Rich BN'), en: read('Explanation Rich EN') },
    stimulus: {
      groupId: normalizeText(getHeaderValue(rawRow, ['Stimulus Group ID', 'Stimulus_Group_ID'])),
      content: { bn: read('Stimulus Rich BN'), en: read('Stimulus Rich EN') },
    },
    optionContent: OPTION_KEYS.map((key) => ({
      key,
      content: { bn: read(`Option ${key} Rich BN`), en: read(`Option ${key} Rich EN`) },
    })),
  };
};

const validatePayloadRichContent = (payload) => {
  for (const language of ['bn', 'en']) {
    parseRichBlocks(payload.questionContent?.[language], `Question Rich ${language.toUpperCase()}`);
    parseRichBlocks(payload.answerContent?.[language], `Answer Rich ${language.toUpperCase()}`);
    parseRichBlocks(
      payload.explanationContent?.[language],
      `Explanation Rich ${language.toUpperCase()}`
    );
    parseRichBlocks(payload.stimulus?.content?.[language], `Stimulus Rich ${language.toUpperCase()}`);
    for (const key of OPTION_KEYS) {
      const option = payload.optionContent?.find((item) => item.key === key);
      parseRichBlocks(option?.content?.[language], `Option ${key} Rich ${language.toUpperCase()}`);
    }
  }
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

const buildQuestionPayload = (row, chapter, topic, subtopic, rich) => {
  const questionType = normalizeQuestionType(getHeaderValue(row, ['Question Type', 'questionType', 'question_type']));
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

  const payload = {
    chapterId: chapter._id,
    topicId: topic._id,
    ...(subtopic ? { subtopicId: subtopic._id } : {}),
    question: { bn: questionBn, en: questionEn },
    questionContent: rich.questionContent,
    ...(rich.stimulus.groupId || hasRichLanguage(rich.stimulus.content, 'bn') || hasRichLanguage(rich.stimulus.content, 'en')
      ? { stimulus: rich.stimulus }
      : {}),
    options,
    optionContent: rich.optionContent,
    correctAnswer,
    explanation: { bn: explanationBn, en: explanationEn },
    explanationContent: rich.explanationContent,
    answer: {
      bn: normalizeText(getHeaderValue(row, ['Answer BN', 'Answer_BN'])),
      en: normalizeText(getHeaderValue(row, ['Answer EN', 'Answer_EN'])),
    },
    answerContent: rich.answerContent,
    difficulty: ACCEPTED_DIFFICULTY.includes(difficulty) ? difficulty : difficulty,
    sourceType: ACCEPTED_SOURCES.includes(sourceType) ? sourceType : sourceType,
    tags: parseTags(row.Tags || row.tags || ''),
    status: ACCEPTED_STATUS.includes(status) ? status : 'draft',
    isDeleted: false,
    questionType,
  };
  if (questionType !== QUESTION_TYPES.MCQ) {
    payload.options = [];
    payload.optionContent = [];
    delete payload.correctAnswer;
    payload.explanation = { bn: '', en: '' };
    payload.explanationContent = { bn: [], en: [] };
  }
  return payload;
};

const findDuplicateQuestion = async (payload) => {
  const normalized = normalizeForCompare(
    payload.question?.bn || richLanguageToText(payload.questionContent, 'bn')
  );
  if (!normalized) return null;

  const query = {
    topicId: payload.topicId,
    questionType: payload.questionType,
    isDeleted: false,
    ...(payload.subtopicId
      ? { subtopicId: payload.subtopicId }
      : {
          $or: [{ subtopicId: null }, { subtopicId: { $exists: false } }],
        }),
  };

  const existing = await Question.find(query)
    .select('question questionContent topicId subtopicId')
    .lean();
  const duplicate = existing.find((item) => {
    const existingNormalized = normalizeForCompare(
      item.question?.bn || richLanguageToText(item.questionContent, 'bn')
    );
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
    questionType: normalizeQuestionType(getHeaderValue(rawRow, ['Question Type', 'questionType', 'question_type'])),
    questionBn: normalizeText(getHeaderValue(rawRow, ['Question BN', 'Question BN ', 'question bn', 'Question_BN'])) ,
    questionEn: normalizeText(getHeaderValue(rawRow, ['Question EN', 'Question EN ', 'question en', 'Question_EN'])),
    explanationBn: normalizeText(getHeaderValue(rawRow, ['Explanation BN', 'Explanation BN ', 'explanation bn', 'Explanation_BN'])),
    explanationEn: normalizeText(getHeaderValue(rawRow, ['Explanation EN', 'Explanation EN ', 'explanation en', 'Explanation_EN'])),
    answerBn: normalizeText(getHeaderValue(rawRow, ['Answer BN', 'Answer_BN'])),
    answerEn: normalizeText(getHeaderValue(rawRow, ['Answer EN', 'Answer_EN'])),
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
  let rich;
  try {
    rich = parseRichColumns(rawRow);
  } catch (error) {
    errors.push(rowError(excelRowNumber, 'Rich content', error.message));
  }

  if (Number.isNaN(normalizedRow.questionType))
    errors.push(rowError(excelRowNumber, 'Question Type', 'Question Type must be a number from 0 to 4.'));

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

  if (rich) {
    for (const language of ['bn', 'en']) {
      const plain = Boolean(normalizedRow[language === 'bn' ? 'questionBn' : 'questionEn']);
      const richValue = hasRichLanguage(rich.questionContent, language);
      if (plain && richValue) {
        errors.push(
          rowError(
            excelRowNumber,
            language === 'bn' ? 'Question BN' : 'Question EN',
            `Use either plain ${language.toUpperCase()} question text or rich content, not both.`
          )
        );
      }
      if (language === 'bn' && !plain && !richValue) {
        errors.push(
          rowError(
            excelRowNumber,
            'Question BN / Question Rich BN',
            'Bangla plain question text or Bangla rich question content is required.'
          )
        );
      }
    }
  }

  const isMcq = normalizedRow.questionType === QUESTION_TYPES.MCQ;
  const isWritten = WRITTEN_QUESTION_TYPES.includes(normalizedRow.questionType);
  const explanationBn = normalizedRow.explanationBn;
  if (isMcq && !explanationBn) {
    errors.push(rowError(excelRowNumber, 'Explanation BN', 'Bangla explanation is required.'));
  }

  const answer = normalizedRow.correctAnswer;
  if (isMcq && (!answer || !['A', 'B', 'C', 'D'].includes(answer))) {
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

  for (const key of isMcq ? OPTION_KEYS : []) {
    const bnValue = normalizedRow.optionBn(key);
    if (!bnValue) {
      errors.push(rowError(excelRowNumber, `Option ${key} BN`, `Option ${key} Bangla text is required.`));
    }
  }
  if (isWritten && rich) {
    const plainAnswer = Boolean(normalizedRow.answerBn);
    const richAnswer = hasRichLanguage(rich.answerContent, 'bn');
    if (plainAnswer && richAnswer)
      errors.push(rowError(excelRowNumber, 'Answer BN', 'Use either plain Bangla answer text or rich content, not both.'));
    if (!plainAnswer && !richAnswer)
      errors.push(rowError(excelRowNumber, 'Answer BN / Answer Rich BN', 'Bangla answer text or rich content is required.'));
  }
  if (STIMULUS_QUESTION_TYPES.includes(normalizedRow.questionType) && rich &&
      !hasRichLanguage(rich.stimulus.content, 'bn'))
    errors.push(rowError(excelRowNumber, 'Stimulus Rich BN', 'Question types 3 and 4 require Bangla stimulus content.'));

  if (errors.length) {
    return { valid: false, errors, row: normalizedRow };
  }

  const subtopic = (syllabusIndex.subtopicsByTopic[String(topic._id)] || []).find((entry) =>
    normalizedRow.subtopic
      ? [entry.name?.bn, entry.name?.en].some((name) => normalizeForCompare(name) === normalizeForCompare(normalizedRow.subtopic))
      : false
  );

  const payload = buildQuestionPayload(rawRow, chapter, topic, subtopic, rich);
  const duplicateMessage = await findDuplicateQuestion(payload);
  if (duplicateMessage) {
    errors.push(rowError(excelRowNumber, 'Question BN', duplicateMessage));
    return { valid: false, errors, row: normalizedRow };
  }

  try {
    if (!isMcq) return { valid: true, row: normalizedRow, payload: { ...removeEmptySubtopic(payload), isDeleted: false }, warnings: [] };
    const translationTargets = ['options', 'explanation'];
    if (payload.status === 'published' || !hasRichLanguage(payload.questionContent, 'bn')) {
      translationTargets.unshift('question');
    }
    const translated = await fillMissingEnglish(payload, translationTargets);
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

    const topicKey = `${result.payload.questionType}::${String(result.payload.topicId)}::${String(result.payload.subtopicId || 'none')}`;
    const normalizedQuestion = normalizeForCompare(
      result.payload.question?.bn || richLanguageToText(result.payload.questionContent, 'bn')
    );
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
    'Question Type',
    'Chapter',
    'Topic',
    'Subtopic',
    'Question BN',
    'Question EN',
    'Question Rich BN',
    'Question Rich EN',
    'Answer BN',
    'Answer EN',
    'Answer Rich BN',
    'Answer Rich EN',
    'Stimulus Group ID',
    'Stimulus Rich BN',
    'Stimulus Rich EN',
    'Option A BN',
    'Option A EN',
    'Option A Rich BN',
    'Option A Rich EN',
    'Option B BN',
    'Option B EN',
    'Option B Rich BN',
    'Option B Rich EN',
    'Option C BN',
    'Option C EN',
    'Option C Rich BN',
    'Option C Rich EN',
    'Option D BN',
    'Option D EN',
    'Option D Rich BN',
    'Option D Rich EN',
    'Correct Answer',
    'Explanation BN',
    'Explanation EN',
    'Explanation Rich BN',
    'Explanation Rich EN',
    'Difficulty',
    'Source Type',
    'Tags',
    'Status',
  ];

  const exampleRich = JSON.stringify([{ type: 'math', text: 'x^2 + y^2 = z^2', display: true }]);
  const questionsSheet = XLSX.utils.aoa_to_sheet([questionHeaders]);
  questionsSheet['!cols'] = questionHeaders.map((header) => ({
    wch: header.includes('Rich') ? 44 : Math.max(header.length + 2, 14),
  }));
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
  const instructionRows = [
    ['Question bank rich-content import format'],
    ['Rule', 'Details'],
    ['Question Type', '0 = MCQ, 1 = Knowledge, 2 = Comprehension, 3 = Application, 4 = Higher order. Blank defaults to 0.'],
    ['Question choice', 'For each language, use either Question BN/EN or Question Rich BN/EN. Never fill both.'],
    ['Rich cell format', 'A JSON array of blocks. Supported types: text, code, math, image, table.'],
    ['Text block', JSON.stringify([{ type: 'text', text: 'Question text' }])],
    ['Code block', JSON.stringify([{ type: 'code', text: 'printf("Hello");', language: 'c' }])],
    ['Math block', exampleRich],
    ['Image block', JSON.stringify([{ type: 'image', url: 'https://example.com/image.png', alt: 'Description', caption: 'Optional caption' }])],
    ['Table block', JSON.stringify([{ type: 'table', rows: [['Heading 1', 'Heading 2'], ['Cell 1', 'Cell 2']] }])],
    ['Options and explanation', 'Plain Bangla remains required. Rich columns are optional enhancements.'],
    ['Written answers', 'Types 1-4 require either Answer BN or Answer Rich BN. English answer fields are optional.'],
    ['Stimulus', 'Types 3 and 4 require Stimulus Rich BN. Group ID connects questions that use the same passage.'],
    ['Published rows', 'Both Bangla and English question content are required. Rich Bangla is not auto-translated; supply English rich content or English plain text.'],
    ['Draft rows', 'English question content may be omitted.'],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionRows);
  instructionsSheet['!cols'] = [{ wch: 24 }, { wch: 110 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  const examplesSheet = XLSX.utils.aoa_to_sheet([
    ['Field', 'Example value'],
    ['Question Rich BN', exampleRich],
    ['Question Rich EN', JSON.stringify([{ type: 'math', text: 'x^2 + y^2 = z^2', display: true }])],
    ['Stimulus Group ID', 'hsc-ict-example-1'],
    ['Stimulus Rich BN', JSON.stringify([{ type: 'text', text: 'উদ্দীপকের লেখা' }])],
  ]);
  examplesSheet['!cols'] = [{ wch: 24 }, { wch: 110 }];
  XLSX.utils.book_append_sheet(workbook, examplesSheet, 'Rich Content Examples');
  return workbook;
};

const persistValidatedRows = async (validRows, userId) => {
  if (!Array.isArray(validRows) || !validRows.length) {
    throw new Error('No valid rows available for import.');
  }

  const rowsToInsert = validRows.map((row) => {
    const payload = row.payload || row;
    validatePayloadRichContent(payload);
    const normalized = {
      ...removeEmptySubtopic(payload),
      questionType: normalizeQuestionType(payload.questionType),
      isDeleted: false,
      createdBy: userId,
      status: ACCEPTED_STATUS.includes((payload.status || 'draft').toLowerCase())
        ? (payload.status || 'draft').toLowerCase()
        : 'draft',
    };

    for (const language of ['bn', 'en']) {
      const hasPlain = Boolean(normalized.question?.[language]?.trim());
      const hasRich = hasRichLanguage(normalized.questionContent, language);
      if (hasPlain && hasRich)
        throw new Error(`Use either plain or rich ${language.toUpperCase()} question content, not both.`);
      if (language === 'bn' && !hasPlain && !hasRich)
        throw new Error('Bangla plain question text or rich question content is required.');
      if (normalized.questionType === QUESTION_TYPES.MCQ && normalized.status === 'published' && !hasPlain && !hasRich)
        throw new Error(`Published questions require ${language.toUpperCase()} question content.`);
    }
    if (normalized.questionType === QUESTION_TYPES.MCQ && !normalized.explanation?.bn?.trim()) throw new Error('Bangla explanation is required for MCQ questions.');
    for (const key of normalized.questionType === QUESTION_TYPES.MCQ ? OPTION_KEYS : []) {
      const option = normalized.options?.find((item) => item.key === key);
      if (!option?.text?.bn?.trim()) {
        throw new Error(`Option ${key} Bangla text is required.`);
      }
    }
    if (WRITTEN_QUESTION_TYPES.includes(normalized.questionType)) {
      const plain = Boolean(normalized.answer?.bn?.trim());
      const rich = hasRichLanguage(normalized.answerContent, 'bn');
      if (plain && rich) throw new Error('Use either plain or rich Bangla answer content, not both.');
      if (!plain && !rich) throw new Error('Bangla answer text or rich answer content is required.');
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
      rows: inserted.map((item) => ({
        _id: item._id,
        question:
          item.question?.bn || richLanguageToText(item.questionContent, 'bn').slice(0, 200),
      })),
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
  parseRichBlocks,
};
