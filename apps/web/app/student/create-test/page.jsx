'use client';

import { Eye, Filter, Play, RotateCcw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

const boardOptions = [
  ['dhaka', 'Dhaka Board', 'ঢাকা বোর্ড'],
  ['chattogram', 'Chattogram Board', 'চট্টগ্রাম বোর্ড'],
  ['cumilla', 'Cumilla Board', 'কুমিল্লা বোর্ড'],
  ['rajshahi', 'Rajshahi Board', 'রাজশাহী বোর্ড'],
  ['jashore', 'Jashore Board', 'যশোর বোর্ড'],
  ['barishal', 'Barishal Board', 'বরিশাল বোর্ড'],
  ['sylhet', 'Sylhet Board', 'সিলেট বোর্ড'],
  ['dinajpur', 'Dinajpur Board', 'দিনাজপুর বোর্ড'],
  ['all', 'All Boards', 'সকল বোর্ড'],
];

const sourceOptions = [
  ['', 'Any source', 'যেকোনো উৎস'],
  ['board', 'Board', 'বোর্ড'],
  ['teacher', 'Teacher', 'শিক্ষক'],
  ['model_test', 'Model test', 'মডেল টেস্ট'],
  ['practice', 'Practice', 'অনুশীলন'],
  ['admission', 'Admission', 'অ্যাডমিশন '],
];

const difficultyOptions = [
  ['easy', 'Easy', 'সহজ'],
  ['medium', 'Medium', 'মাঝারি'],
  ['hard', 'Hard', 'কঠিন'],
];

const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
const timeOptions = [60, 55, 50, 45, 40, 35, 30];
const text = (language, english, bangla) => (language === 'bn' ? bangla : english);
const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');

export default function CreateTest() {
  const router = useRouter();
  const { language } = useLanguage();
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [board, setBoard] = useState('');
  const [year, setYear] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState([]);
  const [count, setCount] = useState('');
  const [secondsPerQuestion, setSecondsPerQuestion] = useState('60');
  const [matchingCount, setMatchingCount] = useState(null);
  const [matchingQuestions, setMatchingQuestions] = useState([]);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [countBusy, setCountBusy] = useState(false);
  const [questionsBusy, setQuestionsBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/chapters')
      .then((result) => setChapters(result.data || []))
      .catch(() => setMessage(text(language, 'Could not load chapters.', 'অধ্যায় লোড করা যায়নি।')));
  }, []);

  useEffect(() => {
    setTopics([]);
    setTopicId('');
    setSubtopics([]);
    setSubtopicId('');
    if (!chapterId) return;
    api(`/topics?chapterId=${chapterId}`)
      .then((result) => setTopics(result.data || []))
      .catch(() => setMessage(text(language, 'Could not load topics.', 'টপিক লোড করা যায়নি।')));
  }, [chapterId]);

  useEffect(() => {
    setSubtopics([]);
    setSubtopicId('');
    if (!topicId) return;
    api(`/subtopics?topicId=${topicId}`)
      .then((result) => setSubtopics(result.data || []))
      .catch(() =>
        setMessage(text(language, 'Could not load subtopics.', 'সাবটপিক লোড করা যায়নি।'))
      );
  }, [topicId]);

  const selectedBoard = boardOptions.find(([value]) => value === board);
  const selectedDifficulties = useMemo(
    () =>
      difficulty
        .map(
          (value) => difficultyOptions.find(([key]) => key === value)?.[language === 'bn' ? 2 : 1]
        )
        .filter(Boolean),
    [difficulty, language]
  );

  useEffect(() => {
    setMatchingCount(null);
    setMatchingQuestions([]);
    setQuestionsOpen(false);
    setCount('');
  }, [board, chapterId, difficulty, sourceType, subtopicId, tags, topicId, year]);

  const buildQuery = (limit = 100) => {
    const params = new URLSearchParams();
    if (chapterId) params.set('chapterId', chapterId);
    if (topicId) params.set('topicId', topicId);
    if (subtopicId) params.set('subtopicId', subtopicId);
    if (sourceType) params.set('sourceType', sourceType);
    if (sourceType === 'board' && board) params.set('board', board);
    if (sourceType === 'board' && year) params.set('year', year);
    if (tags.trim()) params.set('tags', tags.trim());
    if (difficulty.length) params.set('difficulty', difficulty.join(','));
    params.set('limit', String(limit));
    return params;
  };

  const changeSourceType = (value) => {
    setSourceType(value);
    if (value !== 'board') {
      setBoard('');
      setYear('');
    }
  };

  const toggleDifficulty = (value) => {
    setDifficulty((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const clearFilters = () => {
    setChapterId('');
    setTopicId('');
    setSubtopicId('');
    setSourceType('');
    setBoard('');
    setYear('');
    setTags('');
    setDifficulty([]);
    setMatchingCount(null);
    setMatchingQuestions([]);
    setQuestionsOpen(false);
    setMessage('');
  };

  const showMatchingCount = async () => {
    setCountBusy(true);
    setMessage('');
    try {
      const params = buildQuery();
      params.set('countOnly', 'true');
      const result = await api(`/questions?${params.toString()}`);
      const resultCount = Number(result.count) || 0;
      setMatchingCount(resultCount);
      setCount(resultCount ? String(resultCount) : '');
      setMatchingQuestions([]);
      setQuestionsOpen(false);
    } catch {
      setMessage(text(language, 'Could not load questions.', 'প্রশ্ন লোড করা যায়নি।'));
    } finally {
      setCountBusy(false);
    }
  };

  const showMatchingQuestions = async () => {
    setQuestionsBusy(true);
    setMessage('');
    try {
      const result = await api(`/questions?${buildQuery(1000).toString()}`);
      setMatchingQuestions(result.data || []);
      setQuestionsOpen(true);
    } catch {
      setMessage(text(language, 'Could not load questions.', 'প্রশ্ন লোড করা যায়নি।'));
    } finally {
      setQuestionsBusy(false);
    }
  };

  const startTest = () => {
    if (!canStart) return;
    const params = buildQuery(Number(count));
    params.set('count', String(count));
    params.set('minutes', String(Number(secondsPerQuestion) / 60));
    params.set('secondsPerQuestion', String(secondsPerQuestion));
    router.push(`/student/test?${params.toString()}`);
  };

  const questionCount = Number(count);
  const timePerQuestion = Number(secondsPerQuestion);
  const totalSeconds = questionCount * timePerQuestion;
  const canStart =
    matchingCount !== null &&
    matchingCount > 0 &&
    questionCount <= matchingCount &&
    Number.isInteger(questionCount) &&
    questionCount > 0 &&
    Number.isInteger(timePerQuestion) &&
    timePerQuestion > 0;
  const formatDuration = (total) => {
    const minutesPart = Math.floor(total / 60);
    const secondsPart = total % 60;
    if (!minutesPart)
      return text(
        language,
        `${number(secondsPart, language)}s`,
        `${number(secondsPart, language)} সেকেন্ড`
      );
    return secondsPart
      ? text(
          language,
          `${number(minutesPart, language)}m ${number(secondsPart, language)}s`,
          `${number(minutesPart, language)} মিনিট ${number(secondsPart, language)} সেকেন্ড`
        )
      : text(
          language,
          `${number(minutesPart, language)}m`,
          `${number(minutesPart, language)} মিনিট`
        );
  };

  const localName = (item) =>
    item?.name?.[language] ||
    (language === 'bn' ? item?.name?.bn || item?.name?.en : item?.name?.en || item?.name?.bn) ||
    '';
  const localQuestion = (item) =>
    item?.question?.[language] ||
    (language === 'bn'
      ? item?.question?.bn || item?.question?.en
      : item?.question?.en || item?.question?.bn) ||
    text(language, 'Question unavailable', 'প্রশ্ন পাওয়া যায়নি');
  const difficultyLabel = (value) =>
    text(
      language,
      difficultyOptions.find(([key]) => key === value)?.[1] || value,
      difficultyOptions.find(([key]) => key === value)?.[2] || value
    );
  const boardLabel = selectedBoard
    ? text(language, selectedBoard[1], selectedBoard[2])
    : text(language, 'Any board', 'যেকোনো বোর্ড');

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {text(language, 'TEST BUILDER', 'টেস্ট বিল্ডার')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            {text(language, 'Create a custom test', 'কাস্টম টেস্ট তৈরি করুন')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-base-content/60">
            {text(
              language,
              'Choose any combination of academic filters. Nothing is selected by default.',
              'একাধিক একাডেমিক ফিল্টার বেছে নিন। শুরুতে কোনো ফিল্টার নির্বাচিত থাকে না।'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="btn btn-ghost btn-sm self-start md:self-auto"
        >
          <RotateCcw size={15} /> {text(language, 'Reset All', 'সব রিসেট')}
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-7">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Filter size={17} />
              </span>
              <div>
                <h2 className="font-bold">
                  {text(language, 'Question selection', 'প্রশ্ন নির্বাচন')}
                </h2>
                <p className="mt-1 text-xs text-base-content/60">
                  {text(
                    language,
                    'Use one filter or combine several for a focused exam.',
                    'একটি বা একাধিক ফিল্টার ব্যবহার করে নির্দিষ্ট পরীক্ষা তৈরি করুন।'
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                [
                  'Chapter',
                  'অধ্যায়',
                  chapters,
                  chapterId,
                  setChapterId,
                  'Any chapter',
                  'যেকোনো অধ্যায়',
                ],
                ['Topic', 'টপিক', topics, topicId, setTopicId, 'Any topic', 'যেকোনো টপিক'],
                [
                  'Subtopic',
                  'সাবটপিক',
                  subtopics,
                  subtopicId,
                  setSubtopicId,
                  'Any subtopic',
                  'যেকোনো সাবটপিক',
                ],
              ].map(([english, bangla, items, value, setter, anyEnglish, anyBangla]) => (
                <label className="form-control" key={english}>
                  <span className="label-text mb-2 font-semibold">
                    {text(language, english, bangla)}
                  </span>
                  <select
                    className="select select-bordered"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                    disabled={
                      (english !== 'Chapter' && !chapterId) || (english === 'Subtopic' && !topicId)
                    }
                  >
                    <option value="">{text(language, anyEnglish, anyBangla)}</option>
                    {items.map((item) => (
                      <option key={item._id} value={item._id}>
                        {localName(item)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  {text(language, 'Source type', 'উৎসের ধরন')}
                </span>
                <select
                  className="select select-bordered"
                  value={sourceType}
                  onChange={(event) => changeSourceType(event.target.value)}
                >
                  {sourceOptions.map(([value, english, bangla]) => (
                    <option key={value} value={value}>
                      {text(language, english, bangla)}
                    </option>
                  ))}
                </select>
              </label>
              {sourceType === 'board' && (
                <>
                  <label className="form-control">
                    <span className="label-text mb-2 font-semibold">
                      {text(language, 'Board', 'বোর্ড')}
                    </span>
                    <select
                      className="select select-bordered"
                      value={board}
                      onChange={(event) => setBoard(event.target.value)}
                    >
                      <option value="">{text(language, 'Any board', 'যেকোনো বোর্ড')}</option>
                      {boardOptions.map(([value, english, bangla]) => (
                        <option key={value} value={value}>
                          {text(language, english, bangla)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text mb-2 font-semibold">
                      {text(language, 'Year', 'বছর')}
                    </span>
                    <select
                      className="select select-bordered"
                      value={year}
                      onChange={(event) => setYear(event.target.value)}
                    >
                      <option value="">{text(language, 'Any year', 'যেকোনো বছর')}</option>
                      {years.map((item) => (
                        <option key={item} value={item}>
                          {number(item, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            <label className="form-control">
              <span className="label-text mb-2 font-semibold">
                {text(language, 'Tags', 'ট্যাগ')}
              </span>
              <input
                className="input input-bordered"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={text(language, "Example: DB'25, algebra", "উদাহরণ: DB'25, algebra")}
              />
              <span className="label-text-alt mt-2 text-xs text-base-content/50">
                {text(
                  language,
                  'Separate multiple tags with commas.',
                  'একাধিক ট্যাগ কমা দিয়ে আলাদা করুন।'
                )}
              </span>
            </label>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">
                  {text(language, 'Difficulty', 'কঠিনতার স্তর')}
                </span>
                <button
                  type="button"
                  className={`btn btn-xs ${difficulty.length === 0 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDifficulty([])}
                >
                  {text(language, 'All', 'সব')}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {difficultyOptions.map(([value, english, bangla]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleDifficulty(value)}
                    className={`btn ${difficulty.includes(value) ? 'btn-primary' : 'btn-outline border-base-300'}`}
                  >
                    {text(language, english, bangla)}
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <div className="alert alert-error text-sm" role="alert">
                {message}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={showMatchingCount}
                disabled={countBusy}
                className="btn btn-primary"
              >
                {countBusy ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Eye size={17} />
                )}{' '}
                {countBusy
                  ? text(language, 'Counting...', 'গণনা হচ্ছে...')
                  : text(language, 'Show matching count', 'মিল থাকা প্রশ্নের সংখ্যা দেখুন')}
              </button>
              {matchingCount !== null && (
                <button
                  type="button"
                  onClick={showMatchingQuestions}
                  disabled={questionsBusy || !matchingCount}
                  className="btn btn-outline border-primary text-primary"
                >
                  {questionsBusy ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      {text(language, 'Loading...', 'লোড হচ্ছে...')}
                    </>
                  ) : (
                    `${number(matchingCount, language)} ${text(language, 'matching questions', 'টি মিল থাকা প্রশ্ন')}`
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="card bg-neutral text-neutral-content shadow-sm">
          <div className="card-body">
            <p className="text-[10px] font-bold tracking-[.18em] text-emerald-100">
              {text(language, 'EXAM SETTINGS', 'পরীক্ষার সেটিংস')}
            </p>
            <h2 className="font-display text-3xl font-bold">
              {text(language, 'Ready when you are.', 'আপনি প্রস্তুত হলেই শুরু।')}
            </h2>
            <div className="my-5 space-y-4 border-y border-white/15 py-5 text-sm">
              <p className="flex justify-between gap-3">
                <span>{text(language, 'Source', 'উৎস')}</span>
                <b>
                  {
                    sourceOptions.find(([value]) => value === sourceType)?.[
                      language === 'bn' ? 2 : 1
                    ]
                  }
                </b>
              </p>
              {sourceType === 'board' && (
                <p className="flex justify-between gap-3">
                  <span>{text(language, 'Board', 'বোর্ড')}</span>
                  <b>{boardLabel}</b>
                </p>
              )}
              <p className="flex justify-between gap-3">
                <span>{text(language, 'Difficulty', 'কঠিনতা')}</span>
                <b>
                  {selectedDifficulties.length
                    ? selectedDifficulties.join(', ')
                    : text(language, 'All', 'সব')}
                </b>
              </p>
            </div>
            <div className="grid gap-4">
              <label className="form-control">
                <span className="label-text text-neutral-content">
                  {text(language, 'Number of questions', 'প্রশ্নের সংখ্যা')}
                </span>
                <div className="mt-1 grid grid-cols-[1fr_110px] gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={count}
                    onChange={(event) => setCount(event.target.value)}
                    className="input input-bordered text-base-content"
                    placeholder={text(language, 'Filter first', 'আগে ফিল্টার করুন')}
                  />
                  <select
                    aria-label={text(language, 'Question count presets', 'প্রশ্ন সংখ্যার তালিকা')}
                    value=""
                    onChange={(event) => event.target.value && setCount(event.target.value)}
                    className="select select-bordered text-base-content"
                  >
                    <option value="">{text(language, 'Options', 'তালিকা')}</option>
                    {[5, 10, 15, 20, 25, 30, 40, 50]
                      .filter((item) => !matchingCount || item <= matchingCount)
                      .map((item) => (
                        <option key={item} value={item}>
                          {number(item, language)}
                        </option>
                      ))}
                  </select>
                </div>
                <span className="label-text-alt mt-1 text-neutral-content/60">
                  {matchingCount === null
                    ? text(
                        language,
                        'Show the matching count first.',
                        'প্রথমে মিল থাকা প্রশ্নের সংখ্যা দেখুন।'
                      )
                    : `${text(language, 'Available', 'পাওয়া গেছে')}: ${number(matchingCount, language)}`}
                </span>
              </label>
              <label className="form-control">
                <span className="label-text text-neutral-content">
                  {text(language, 'Time per question', 'প্রতি প্রশ্নের সময়')}
                </span>
                <div className="mt-1 grid grid-cols-[1fr_110px] gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={secondsPerQuestion}
                    onChange={(event) => setSecondsPerQuestion(event.target.value)}
                    className="input input-bordered text-base-content"
                    aria-label={text(
                      language,
                      'Custom seconds per question',
                      'প্রতি প্রশ্নের কাস্টম সেকেন্ড'
                    )}
                  />
                  <select
                    aria-label={text(language, 'Time presets', 'সময়ের তালিকা')}
                    value=""
                    onChange={(event) =>
                      event.target.value && setSecondsPerQuestion(event.target.value)
                    }
                    className="select select-bordered text-base-content"
                  >
                    <option value="">{text(language, 'Options', 'তালিকা')}</option>
                    {timeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item === 60
                          ? text(language, '1 min', '১ মিনিট')
                          : text(language, `${item}s`, `${number(item, language)} সেকেন্ড`)}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="label-text-alt mt-1 text-neutral-content/60">
                  {text(
                    language,
                    'Enter seconds or choose a preset.',
                    'সেকেন্ড লিখুন অথবা একটি তালিকা বেছে নিন।'
                  )}
                </span>
              </label>
              <div className="rounded-box border border-white/15 bg-white/5 p-4">
                <p className="text-xs text-neutral-content/70">
                  {text(language, 'Total exam time', 'পরীক্ষার মোট সময়')}
                </p>
                <p className="mt-1 font-display text-3xl font-bold">
                  {questionCount > 0 && timePerQuestion > 0 ? formatDuration(totalSeconds) : '--'}
                </p>
                <p className="mt-1 text-xs text-neutral-content/60">
                  {text(language, 'Questions × time per question', 'প্রশ্ন × প্রতি প্রশ্নের সময়')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startTest}
              disabled={!canStart}
              className="btn btn-primary mt-5 w-full"
            >
              <Play size={16} /> {text(language, 'Start exam', 'পরীক্ষা শুরু করুন')}
            </button>
            {!canStart && (
              <p className="text-center text-xs text-warning">
                {matchingCount === null
                  ? text(
                      language,
                      'Filter questions before starting the exam.',
                      'পরীক্ষা শুরু করার আগে প্রশ্ন ফিল্টার করুন।'
                    )
                  : questionCount > matchingCount
                    ? text(
                        language,
                        'Number of questions cannot exceed the search result count.',
                        'প্রশ্নের সংখ্যা সার্চ রেজাল্টের সংখ্যার চেয়ে বেশি হতে পারবে না।'
                      )
                    : text(
                        language,
                        'Enter a valid question count or time per question.',
                        'প্রশ্নের সংখ্যা অথবা প্রতি প্রশ্নের সঠিক সময় লিখুন।'
                      )}
              </p>
            )}
            <small className="text-center text-xs text-slate-300">
              {text(
                language,
                'Questions are selected from published content.',
                'প্রকাশিত প্রশ্ন থেকে প্রশ্ন নির্বাচন করা হবে।'
              )}
            </small>
          </div>
        </aside>
      </div>

      {questionsOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-neutral/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="matching-questions-title"
          onClick={(event) => event.target === event.currentTarget && setQuestionsOpen(false)}
        >
          <section className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-box bg-base-100 shadow-2xl">
            <header className="flex items-center justify-between border-b border-base-300 p-5">
              <div>
                <h2 id="matching-questions-title" className="font-display text-2xl font-bold">
                  {text(language, 'Matching questions', 'মিল থাকা প্রশ্ন')}
                </h2>
                <p className="mt-1 text-xs text-base-content/60">
                  {number(matchingQuestions.length, language)}{' '}
                  {text(language, 'questions available', 'টি প্রশ্ন পাওয়া গেছে')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuestionsOpen(false)}
                className="btn btn-circle btn-ghost"
                aria-label={text(language, 'Close questions', 'প্রশ্ন বন্ধ করুন')}
              >
                <X size={18} />
              </button>
            </header>
            <div className="max-h-[calc(90vh-100px)] space-y-3 overflow-y-auto p-5">
              {matchingQuestions.length ? (
                matchingQuestions.map((question, index) => (
                  <article key={question._id} className="rounded-box border border-base-300 p-4">
                    <div className="flex gap-3">
                      <span className="badge badge-primary">{number(index + 1, language)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{localQuestion(question)}</p>
                        <p className="mt-2 text-xs text-base-content/50">
                          {localName(question.chapterId)}
                          {question.topicId ? ` · ${localName(question.topicId)}` : ''}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="badge badge-outline">
                            {text(language, 'Difficulty', 'কঠিনতা')}:{' '}
                            {difficultyLabel(question.difficulty)}
                          </span>
                          {(question.tags || []).map((tag, tagIndex) => (
                            <span className="badge badge-ghost" key={`${tag}-${tagIndex}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="py-10 text-center text-sm text-base-content/60">
                  {text(
                    language,
                    'No questions match these filters.',
                    'এই ফিল্টারের সঙ্গে কোনো প্রশ্ন মেলেনি।'
                  )}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
