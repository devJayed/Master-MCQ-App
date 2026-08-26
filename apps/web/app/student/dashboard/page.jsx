'use client';

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

const text = {
  en: {
    portal: 'HSC ICT · PERSONAL LEARNING SPACE',
    greeting: 'Ready for your next win',
    hero: 'Keep building the skills that make exam day feel easier.',
    heroBody:
      'Your dashboard updates from every submitted test, so the next step is always based on your real progress.',
    start: "Start today's practice",
    streak: 'CURRENT STREAK',
    day: 'day',
    days: 'days',
    noStreak: 'Start a test today',
    active: 'Keep the momentum going',
    overview: 'LIVE OVERVIEW',
    progress: 'Your progress',
    thisMonth: 'This month',
    tests: 'Tests',
    questions: 'Questions',
    average: 'Average score',
    allTime: 'All-time accuracy',
    best: 'Best score',
    correct: 'Correct answers',
    focus: 'SMART NEXT STEP',
    recommended: 'Recommended for you',
    startTest: 'Start test',
    noRecommendation: 'Your first result will unlock a tailored recommendation.',
    quick: 'Take a quick test',
    chaptersEyebrow: 'CHAPTER PRACTICE',
    chapters: 'Choose where to focus',
    seeAll: 'See all chapters',
    available: 'questions available',
    emptyChapters: 'No published chapter questions are available yet.',
    recentEyebrow: 'RECENT ACTIVITY',
    recent: 'Latest results',
    history: 'View full history',
    noActivity: 'No submitted tests yet. Your latest results will appear here.',
    review: 'Review',
    mistakes: 'Answers to revisit',
    revisit: 'Review your test history',
    refresh: 'Refresh dashboard',
    updated: 'Live data',
    loadError: 'We could not load your dashboard. Please try again.',
    retry: 'Try again',
    weaker: 'Build confidence in',
    strongest: 'Start learning',
    scoreChange: 'vs last month',
    newMonth: 'First results this month',
    total: 'total',
    guestGreeting: 'Welcome, guest learner',
    guestHero: 'Practice freely. Create an account when you want to save your progress.',
    guestHeroBody:
      'Explore HSC ICT chapters and take full practice tests. Your guest results stay on this device only for the current session.',
    guestStart: 'Start a quick test',
    guestTitle: 'Turn practice into lasting progress',
    guestBody:
      'Create a free student account to keep your scores, exam history, streak and personalised recommendations.',
    createAccount: 'Create free account',
    signIn: 'I already have an account',
  },
  bn: {
    portal: 'এইচএসসি আইসিটি · ব্যক্তিগত শিক্ষাঙ্গন',
    greeting: 'পরবর্তী সাফল্যের জন্য প্রস্তুত',
    hero: 'পরীক্ষার দিনকে সহজ করতে আজই দক্ষতা গড়ে তুলুন।',
    heroBody:
      'প্রতিটি জমা দেওয়া পরীক্ষার ফল থেকে ড্যাশবোর্ড আপডেট হয়, তাই পরবর্তী পদক্ষেপ আপনার সত্যিকারের অগ্রগতির উপর ভিত্তি করে।',
    start: 'আজকের অনুশীলন শুরু করুন',
    streak: 'বর্তমান ধারাবাহিকতা',
    day: 'দিন',
    days: 'দিন',
    noStreak: 'আজ একটি পরীক্ষা দিন',
    active: 'ধারাবাহিকতা ধরে রাখুন',
    overview: 'লাইভ সারসংক্ষেপ',
    progress: 'আপনার অগ্রগতি',
    thisMonth: 'এই মাসে',
    tests: 'পরীক্ষা',
    questions: 'প্রশ্ন',
    average: 'গড় স্কোর',
    allTime: 'সামগ্রিক নির্ভুলতা',
    best: 'সেরা স্কোর',
    correct: 'সঠিক উত্তর',
    focus: 'পরবর্তী স্মার্ট পদক্ষেপ',
    recommended: 'আপনার জন্য সুপারিশ',
    startTest: 'পরীক্ষা শুরু করুন',
    noRecommendation: 'প্রথম ফলাফল জমা দিলে ব্যক্তিগত সুপারিশ পাওয়া যাবে।',
    quick: 'দ্রুত পরীক্ষা দিন',
    chaptersEyebrow: 'অধ্যায় অনুশীলন',
    chapters: 'মনোযোগের অধ্যায় বেছে নিন',
    seeAll: 'সব অধ্যায় দেখুন',
    available: 'টি প্রশ্ন আছে',
    emptyChapters: 'এখনও কোনো প্রকাশিত অধ্যায়ের প্রশ্ন নেই।',
    recentEyebrow: 'সাম্প্রতিক কার্যক্রম',
    recent: 'সর্বশেষ ফলাফল',
    history: 'সম্পূর্ণ ইতিহাস',
    noActivity: 'এখনও কোনো পরীক্ষা জমা দেওয়া হয়নি। সর্বশেষ ফলাফল এখানে দেখা যাবে।',
    review: 'পর্যালোচনা',
    mistakes: 'পুনরায় দেখার উত্তর',
    revisit: 'পরীক্ষার ইতিহাস দেখুন',
    refresh: 'ড্যাশবোর্ড রিফ্রেশ করুন',
    updated: 'লাইভ তথ্য',
    loadError: 'ড্যাশবোর্ড লোড করা যায়নি। আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন',
    weaker: 'আত্মবিশ্বাস বাড়ান:',
    strongest: 'শেখা শুরু করুন:',
    scoreChange: 'গত মাসের তুলনায়',
    newMonth: 'এই মাসের প্রথম ফলাফল',
    total: 'সর্বমোট',
    guestGreeting: 'স্বাগতম, অতিথি শিক্ষার্থী',
    guestHero: 'নির্ভয়ে অনুশীলন করুন। অগ্রগতি সংরক্ষণ করতে অ্যাকাউন্ট খুলুন।',
    guestHeroBody:
      'এইচএসসি আইসিটি অধ্যায় ঘুরে দেখুন এবং পূর্ণাঙ্গ অনুশীলনী পরীক্ষা দিন। অতিথি হিসেবে আপনার ফলাফল শুধু বর্তমান সেশনে এই ডিভাইসে থাকবে।',
    guestStart: 'দ্রুত পরীক্ষা শুরু করুন',
    guestTitle: 'অনুশীলনকে স্থায়ী অগ্রগতিতে রূপ দিন',
    guestBody:
      'স্কোর, পরীক্ষার ইতিহাস, ধারাবাহিকতা ও ব্যক্তিগত পরামর্শ সংরক্ষণ করতে বিনামূল্যে শিক্ষার্থী অ্যাকাউন্ট তৈরি করুন।',
    createAccount: 'বিনামূল্যে অ্যাকাউন্ট খুলুন',
    signIn: 'আমার ইতিমধ্যে অ্যাকাউন্ট আছে',
  },
};
const emptyAnalytics = {
  testsCompleted: 0,
  questionsAttempted: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  overallScore: 0,
  averageScore: 0,
  bestScore: 0,
  streakDays: 0,
  thisMonth: { testsCompleted: 0, questionsAttempted: 0, averageScore: 0 },
  previousMonth: { testsCompleted: 0, questionsAttempted: 0, averageScore: 0 },
  recent: [],
  chapters: [],
};
const chapterName = (chapter, language) =>
  chapter?.name?.[language] ||
  (language === 'bn'
    ? chapter?.name?.bn || chapter?.name?.en
    : chapter?.name?.en || chapter?.name?.bn) ||
  chapter?.title ||
  '';
const number = (value, language, options) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', options);
const formatDate = (value, language) =>
  new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));

const modeName = (mode, language) => {
  const modes = {
    custom: ['কাস্টম', 'Custom'],
    quick: ['দ্রুত পরীক্ষা', 'Quick test'],
    chapter: ['অধ্যায় পরীক্ষা', 'Chapter test'],
    topic: ['টপিক অনুশীলন', 'Topic practice'],
    mistakes: ['ভুলের অনুশীলন', 'Mistake practice'],
  };
  const value = modes[mode || 'custom'];
  return value ? (language === 'bn' ? value[0] : value[1]) : String(mode).replaceAll('_', ' ');
};

function Metric({ icon: Icon, label, value, detail, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
  };
  return (
    <article className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={19} />
        </span>
        {detail && (
          <span className="text-right text-[10px] font-semibold text-base-content/45">
            {detail}
          </span>
        )}
      </div>
      <p className="mt-5 text-xs text-base-content/55">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </article>
  );
}

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const copy = text[language] || text.en;
  const [data, setData] = useState({ analytics: emptyAnalytics, chapters: [] });
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState('');
  const loadDashboard = useCallback(
    async (quiet = false) => {
      if (authLoading) return;
      quiet ? setRefreshing(true) : setLoading(true);
      try {
        const [a, c] = await Promise.all([
          user ? api('/analytics/student') : Promise.resolve({ data: emptyAnalytics }),
          api('/chapters'),
        ]);
        setData({ analytics: { ...emptyAnalytics, ...(a.data || {}) }, chapters: c.data || [] });
        setError('');
      } catch (requestError) {
        setError(requestError.message || copy.loadError);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authLoading, copy.loadError, user]
  );
  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(() => loadDashboard(true), 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadDashboard(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadDashboard]);

  const { analytics, chapters } = data;
  const recommendation = useMemo(() => {
    const target = [...(analytics.chapters || [])]
      .filter((x) => x.totalQuestions > 0)
      .sort((a, b) => a.accuracy - b.accuracy)[0];
    if (target) {
      const chapter = chapters.find((x) => String(x._id) === String(target.chapterId));
      if (chapter?.questionCount)
        return { chapter, label: copy.weaker, accuracy: Math.round(target.accuracy) };
    }
    const chapter = chapters.find((x) => x.questionCount > 0);
    return chapter ? { chapter, label: copy.strongest, accuracy: null } : null;
  }, [analytics.chapters, chapters, copy]);
  const monthDelta = analytics.previousMonth?.testsCompleted
    ? analytics.thisMonth.averageScore - analytics.previousMonth.averageScore
    : null;
  const firstName =
    (language === 'bn'
      ? user?.nameBangla || user?.nameEnglish
      : user?.nameEnglish || user?.nameBangla) ||
    user?.name ||
    '';
  const featured = [...chapters]
    .filter((x) => x.questionCount > 0)
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, 6);

  if (authLoading || loading)
    return (
      <div className="mx-auto max-w-7xl p-5 md:p-10" role="status" aria-label={copy.updated}>
        <div className="skeleton h-72 w-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((x) => (
            <div key={x} className="skeleton h-40" />
          ))}
        </div>
      </div>
    );
  if (error && !chapters.length && !analytics.testsCompleted)
    return (
      <div className="mx-auto max-w-2xl p-5 md:p-10">
        <div className="alert alert-error" role="alert">
          <span>{copy.loadError}</span>
          <button className="btn btn-sm" onClick={() => loadDashboard()}>
            {copy.retry}
          </button>
        </div>
      </div>
    );

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <section className="soft-grid relative overflow-hidden rounded-box bg-neutral px-6 py-9 text-neutral-content md:px-10 md:py-12">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[.18em] text-emerald-100">
            <Sparkles size={13} /> {copy.portal}
          </div>
          <p className="mb-2 text-sm font-semibold text-emerald-200">
            {user ? copy.greeting : copy.guestGreeting}
            {user && firstName ? `, ${firstName}` : ''}{user ? '?' : ''}
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            {user ? copy.hero : copy.guestHero}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            {user ? copy.heroBody : copy.guestHeroBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="btn btn-primary"
              href={user ? '/student/practice' : '/student/test?mode=quick&count=10&secondsPerQuestion=60'}
            >
              {user ? copy.start : copy.guestStart} <ArrowRight size={16} />
            </Link>
            {user ? (
              <Link
                className="btn btn-outline border-white/30 text-white hover:border-white"
                href="/student/performance"
              >
                <BarChart3 size={16} /> {copy.progress}
              </Link>
            ) : (
              <Link
                className="btn btn-outline border-white/30 text-white hover:border-white"
                href="/register"
              >
                {copy.createAccount}
              </Link>
            )}
          </div>
        </div>
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/60 blur-2xl" />
        {user && <div className="relative z-10 mt-8 w-fit rounded-box border border-white/10 bg-white/10 p-4 backdrop-blur md:absolute md:bottom-8 md:right-8 md:mt-0 md:min-w-48">
          <p className="text-[10px] font-bold tracking-widest text-white/55">{copy.streak}</p>
          <div className="mt-1 flex items-center gap-2">
            <Flame className="text-warning" size={25} />
            <b className="font-display text-3xl">
              {number(analytics.streakDays, language)}{' '}
              <small className="font-sans text-xs font-normal">
                {analytics.streakDays === 1 ? copy.day : copy.days}
              </small>
            </b>
          </div>
          <p className="mt-1 text-xs text-emerald-200">
            {analytics.streakDays ? copy.active : copy.noStreak}
          </p>
        </div>}
      </section>

      {!user && (
        <section className="mt-6 flex flex-col gap-5 rounded-box border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold">{copy.guestTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-base-content/65">{copy.guestBody}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/register" className="btn btn-primary">{copy.createAccount}</Link>
            <Link href="/login?next=%2Fstudent%2Fdashboard" className="btn btn-outline">{copy.signIn}</Link>
          </div>
        </section>
      )}

      {user && <><div className="mt-9 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {copy.overview}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold">{copy.progress}</h2>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          disabled={refreshing}
          onClick={() => loadDashboard(true)}
          title={copy.refresh}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />{' '}
          <span className="hidden sm:inline">{copy.updated}</span>
        </button>
      </div>
      {error && (
        <div className="alert alert-warning mt-4 text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Target}
          label={`${copy.tests} · ${copy.thisMonth}`}
          value={number(analytics.thisMonth.testsCompleted, language)}
          detail={`${number(analytics.testsCompleted, language)} ${copy.total}`}
        />
        <Metric
          icon={BookOpen}
          label={`${copy.questions} · ${copy.thisMonth}`}
          value={number(analytics.thisMonth.questionsAttempted, language)}
          detail={`${number(analytics.questionsAttempted, language)} ${copy.total}`}
          tone="accent"
        />
        <Metric
          icon={BarChart3}
          label={copy.average}
          value={`${number(analytics.thisMonth.averageScore, language)}%`}
          detail={
            monthDelta === null
              ? copy.newMonth
              : `${monthDelta >= 0 ? '+' : ''}${number(monthDelta, language)}% ${copy.scoreChange}`
          }
          tone="warning"
        />
        <Metric
          icon={CheckCircle2}
          label={copy.allTime}
          value={`${number(analytics.overallScore, language)}%`}
          detail={`${number(analytics.bestScore, language)}% ${copy.best.toLowerCase()}`}
          tone="success"
        />
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {copy.focus}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold">{copy.recommended}</h2>
          {recommendation ? (
            <div className="mt-5 flex flex-col gap-4 rounded-box bg-secondary p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-primary">{recommendation.label}</p>
                <h3 className="mt-1 font-display text-xl font-bold">
                  {chapterName(recommendation.chapter, language)}
                </h3>
                <p className="mt-1 text-xs text-base-content/55">
                  {number(recommendation.chapter.questionCount, language)} {copy.available}
                  {recommendation.accuracy !== null
                    ? ` · ${number(recommendation.accuracy, language)}% ${copy.allTime.toLowerCase()}`
                    : ''}
                </p>
              </div>
              <Link
                className="btn btn-primary shrink-0"
                href={`/student/test?mode=chapter&chapterId=${recommendation.chapter._id}&count=${Math.min(20, recommendation.chapter.questionCount)}&secondsPerQuestion=60`}
              >
                {copy.startTest} <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-box border border-dashed border-base-300 p-6 text-sm text-base-content/60">
              {copy.noRecommendation}
              <Link
                href="/student/test?mode=quick&count=10&secondsPerQuestion=60"
                className="mt-4 flex w-fit items-center gap-1 font-bold text-primary"
              >
                {copy.quick} <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
        <section className="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
                {copy.mistakes}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {number(analytics.incorrectAnswers, language)}
              </h2>
            </div>
            <span className="grid size-12 place-items-center rounded-full bg-warning/10 text-warning">
              <RotateCcw size={21} />
            </span>
          </div>
          <p className="mt-4 text-sm text-base-content/60">
            {number(analytics.correctAnswers, language)} {copy.correct.toLowerCase()} ·{' '}
            {number(analytics.questionsAttempted, language)} {copy.questions.toLowerCase()}
          </p>
          <Link
            href="/student/history"
            className="mt-5 flex items-center gap-1 text-xs font-bold text-primary"
          >
            {copy.revisit} <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      </>}

      {user && <section className="mt-11">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
              {copy.chaptersEyebrow}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold">{copy.chapters}</h2>
          </div>
          <Link className="text-xs font-bold text-primary" href="/student/practice#chapters">
            {copy.seeAll} →
          </Link>
        </div>
        {featured.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((chapter) => (
              <Link
                key={chapter._id}
                href={`/student/test?mode=chapter&chapterId=${chapter._id}&count=${Math.min(20, chapter.questionCount)}&secondsPerQuestion=60`}
                className="group rounded-box border border-base-300 bg-base-100 p-5 transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
                    {number(chapter.order, language, { minimumIntegerDigits: 2 })}
                  </span>
                  <ArrowRight
                    size={17}
                    className="text-base-content/30 transition group-hover:translate-x-1 group-hover:text-primary"
                  />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">
                  {chapterName(chapter, language)}
                </h3>
                <p className="mt-1 text-xs text-base-content/50">
                  {number(chapter.questionCount, language)} {copy.available}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-box border border-dashed border-base-300 p-8 text-center text-sm text-base-content/55">
            {copy.emptyChapters}
          </div>
        )}
      </section>}

      <section className="mt-11">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
              {copy.recentEyebrow}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold">{copy.recent}</h2>
          </div>
          <Link className="text-xs font-bold text-primary" href="/student/history">
            {copy.history} →
          </Link>
        </div>
        {analytics.recent.length ? (
          <div className="mt-5 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
            {analytics.recent.slice(0, 4).map((attempt) => (
              <div
                key={attempt.id || attempt.submittedAt}
                className="flex flex-wrap items-center gap-4 border-b border-base-300 p-4 last:border-0 sm:flex-nowrap"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Clock3 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold capitalize">
                    {modeName(attempt.mode, language)} · {number(attempt.totalQuestions, language)}{' '}
                    {copy.questions.toLowerCase()}
                  </p>
                  <p className="mt-1 text-xs text-base-content/45">
                    {formatDate(attempt.submittedAt, language)}
                  </p>
                </div>
                <div className="text-right">
                  <b className="font-display text-xl text-primary">
                    {number(Math.round(attempt.scorePercent || 0), language)}%
                  </b>
                  <Link
                    href={`/student/result?attemptId=${attempt.id}`}
                    className="ml-4 text-xs font-bold text-base-content/55 hover:text-primary"
                  >
                    {copy.review}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-box border border-dashed border-base-300 p-8 text-center text-sm text-base-content/55">
            {copy.noActivity}
          </div>
        )}
      </section>
    </main>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
