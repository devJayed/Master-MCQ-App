'use client';

import { BookOpen, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import Pagination from '../../../components/Pagination';
import { RichContent, Stimulus } from '../../../components/RichContent';
import { api } from '../../../lib/api';

const TYPES = [
  [1, 'জ্ঞানমূলক', 'Knowledge'],
  [2, 'অনুধাবনমূলক', 'Comprehension'],
  [3, 'প্রয়োগমূলক', 'Application'],
  [4, 'উচ্চতর দক্ষতামূলক', 'Higher order'],
];
const DIFFICULTIES = [
  ['easy', 'সহজ', 'Easy'],
  ['medium', 'মাঝারি', 'Medium'],
  ['hard', 'কঠিন', 'Hard'],
];
const SOURCES = [
  ['board', 'বোর্ড', 'Board'],
  ['teacher', 'শিক্ষক', 'Teacher'],
  ['model_test', 'মডেল টেস্ট', 'Model test'],
  ['practice', 'অনুশীলন', 'Practice'],
  ['admission', 'এডমিশন', 'Admission'],
];
const EMPTY_FILTERS = {
  chapterId: '',
  topicId: '',
  subtopicId: '',
  questionType: '',
  difficulty: '',
  sourceType: '',
  search: '',
};
const copy = (language, bn, en) => (language === 'bn' ? bn : en);
const localName = (item, language) =>
  item?.name?.[language] || item?.name?.bn || item?.name?.en || '—';
const BOARD_CODES = {
  dhaka: 'DB',
  chattogram: 'Ctg.B',
  chittagong: 'Ctg.B',
  cumilla: 'CB',
  rajshahi: 'RB',
  jashore: 'JB',
  barishal: 'BB',
  sylhet: 'SB',
  dinajpur: 'Din.B',
};
const sourceDetail = (item, language) => {
  if (!['board', 'admission'].includes(item.sourceType)) return '';
  const taggedSource = item.tags?.find((tag) => /[A-Za-z][A-Za-z.\s-]*['’]\d{2,4}/.test(tag));
  const year = String(item.year || '')
    .replace(/\D/g, '')
    .slice(-2);
  const rawBoard = String(item.board || '').trim();
  const boardCode = BOARD_CODES[rawBoard.toLowerCase()] || rawBoard;
  const reference = taggedSource || [boardCode, year && `’${year}`].filter(Boolean).join('');
  if (!reference) return '';
  return item.sourceType === 'admission'
    ? `${copy(language, 'এডমিশন', 'Admission')} ${reference.replace("'", '’')}`
    : reference.replace("'", '’');
};

export default function WrittenQuestionsPage() {
  const { language } = useLanguage();
  const [chapters, setChapters] = useState([]),
    [topics, setTopics] = useState([]),
    [subtopics, setSubtopics] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS),
    [questions, setQuestions] = useState([]),
    [open, setOpen] = useState({});
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20),
    [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');

  useEffect(() => {
    api('/chapters')
      .then((r) => setChapters(r.data || []))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setTopics([]);
    setSubtopics([]);
    if (filters.chapterId)
      api(`/topics?chapterId=${filters.chapterId}`)
        .then((r) => setTopics(r.data || []))
        .catch((e) => setError(e.message));
  }, [filters.chapterId]);
  useEffect(() => {
    setSubtopics([]);
    if (filters.topicId)
      api(`/subtopics?topicId=${filters.topicId}`)
        .then((r) => setSubtopics(r.data || []))
        .catch((e) => setError(e.message));
  }, [filters.topicId]);
  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) query.set(key, value.trim());
    });
    setLoading(true);
    setError('');
    api(`/questions/study?${query}`)
      .then((r) => {
        setQuestions(r.data || []);
        setTotal(r.pagination?.total || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, page, pageSize]);

  const update = (field, value) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === 'chapterId' ? { topicId: '', subtopicId: '' } : {}),
      ...(field === 'topicId' ? { subtopicId: '' } : {}),
    }));
  };
  const options = (items) =>
    items.map(([value, bn, en]) => (
      <option key={value} value={value}>
        {copy(language, bn, en)}
      </option>
    ));

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-10">
      <p className="text-[10px] font-bold tracking-widest text-primary">
        {copy(language, 'সিলেবাসভিত্তিক পাঠ', 'SYLLABUS STUDY BANK')}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold">
        {copy(language, 'লিখিত প্রশ্ন ও উত্তর', 'Written questions and answers')}
      </h1>
      <p className="mt-2 text-sm text-base-content/60">
        {copy(
          language,
          'প্রশ্ন, ট্যাগ, সিলেবাস ও প্রশ্নের ধরন দিয়ে খুঁজুন, তারপর উত্তর দেখুন।',
          'Search by question, tag, syllabus, or question type, then reveal answers.'
        )}
      </p>

      <section className="mt-6 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="input input-bordered flex items-center gap-2 xl:col-span-2">
            <Search size={17} />
            <input
              className="grow"
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
              placeholder={copy(language, 'প্রশ্ন বা ট্যাগ খুঁজুন', 'Search questions or tags')}
            />
          </label>
          <select
            className="select select-bordered"
            value={filters.chapterId}
            onChange={(e) => update('chapterId', e.target.value)}
          >
            <option value="">{copy(language, 'সব অধ্যায়', 'All chapters')}</option>
            {chapters.map((x) => (
              <option key={x._id} value={x._id}>
                {localName(x, language)}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered"
            disabled={!filters.chapterId}
            value={filters.topicId}
            onChange={(e) => update('topicId', e.target.value)}
          >
            <option value="">{copy(language, 'সব টপিক', 'All topics')}</option>
            {topics.map((x) => (
              <option key={x._id} value={x._id}>
                {localName(x, language)}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered"
            disabled={!filters.topicId}
            value={filters.subtopicId}
            onChange={(e) => update('subtopicId', e.target.value)}
          >
            <option value="">{copy(language, 'সব সাবটপিক', 'All subtopics')}</option>
            {subtopics.map((x) => (
              <option key={x._id} value={x._id}>
                {localName(x, language)}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered"
            value={filters.questionType}
            onChange={(e) => update('questionType', e.target.value)}
          >
            <option value="">{copy(language, 'সব প্রশ্নের ধরন', 'All question types')}</option>
            {options(TYPES)}
          </select>
          <select
            className="select select-bordered"
            value={filters.difficulty}
            onChange={(e) => update('difficulty', e.target.value)}
          >
            <option value="">{copy(language, 'সব কঠিনতার স্তর', 'All difficulty levels')}</option>
            {options(DIFFICULTIES)}
          </select>
          <select
            className="select select-bordered"
            value={filters.sourceType}
            onChange={(e) => update('sourceType', e.target.value)}
          >
            <option value="">{copy(language, 'সব উৎস', 'All source types')}</option>
            {options(SOURCES)}
          </select>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
          >
            <X size={16} /> {copy(language, 'ফিল্টার মুছুন', 'Clear filters')}
          </button>
        </div>
        <p className="mt-3 text-xs text-base-content/50">
          {copy(
            language,
            `${total.toLocaleString('bn-BD')}টি প্রশ্ন পাওয়া গেছে`,
            `${total.toLocaleString('en-US')} questions found`
          )}
        </p>
      </section>

      {loading && (
        <div className="mt-8 text-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && (
        <div className="alert alert-error mt-6" role="alert">
          {error}
        </div>
      )}
      {!loading && !questions.length && !error && (
        <div className="mt-6 rounded-box border border-dashed border-base-300 p-10 text-center text-base-content/55">
          <BookOpen className="mx-auto mb-2" />
          {copy(
            language,
            'এই ফিল্টারে কোনো প্রকাশিত প্রশ্ন পাওয়া যায়নি।',
            'No published questions match these filters.'
          )}
        </div>
      )}
      <div className="mt-6 space-y-4">
        {questions.map((item, index) => {
          const type = TYPES.find(([v]) => v === item.questionType),
            difficulty = DIFFICULTIES.find(([v]) => v === item.difficulty),
            source = SOURCES.find(([v]) => v === item.sourceType);
          return (
            <article
              key={item._id}
              className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge badge-primary badge-outline">
                  {type ? copy(language, type[1], type[2]) : ''}
                </span>
                {difficulty && (
                  <span className="badge badge-ghost">
                    {copy(language, difficulty[1], difficulty[2])}
                  </span>
                )}
                {source && (
                  <span className="badge badge-ghost">{copy(language, source[1], source[2])}</span>
                )}
              </div>
              <p className="mb-3 text-xs text-base-content/50">
                {[
                  localName(item.chapterId, language),
                  localName(item.topicId, language),
                  item.subtopicId && localName(item.subtopicId, language),
                ]
                  .filter(Boolean)
                  .join(' / ')}
              </p>
              <Stimulus stimulus={item.stimulus} language={language} />
              <div className="flex flex-wrap items-start gap-2 font-display text-lg font-bold">
                <span className="shrink-0">
                  {((page - 1) * pageSize + index + 1).toLocaleString(
                    language === 'bn' ? 'bn-BD' : 'en-US'
                  )}
                  .
                </span>
                <RichContent
                  content={item.questionContent}
                  fallback={item.question}
                  language={language}
                />
                {sourceDetail(item, language) && (
                  <span className="badge badge-neutral self-center font-sans font-bold">
                    {sourceDetail(item, language)}
                  </span>
                )}
              </div>
              <button
                className="btn btn-outline btn-sm mt-4"
                onClick={() =>
                  setOpen((current) => ({ ...current, [item._id]: !current[item._id] }))
                }
              >
                {open[item._id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}{' '}
                {open[item._id]
                  ? copy(language, 'উত্তর লুকান', 'Hide answer')
                  : copy(language, 'উত্তর দেখুন', 'Show answer')}
              </button>
              {open[item._id] && (
                <div className="mt-4 rounded-box bg-base-200 p-4">
                  <b className="text-sm">{copy(language, 'উত্তর', 'Answer')}</b>
                  <RichContent
                    className="mt-2"
                    content={item.answerContent}
                    fallback={item.answer}
                    language={language}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!loading && total > 0 && (
        <div className="mt-6 rounded-box border border-base-300 bg-base-100">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            language={language}
            disabled={loading}
          />
        </div>
      )}
    </main>
  );
}
