'use client';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  RefreshCw,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useLanguage } from '../../../components/LanguageProvider';
import { CardGridSkeleton, Skeleton as SkeletonBlock } from '../../../components/Skeletons';
import { api } from '../../../lib/api';

const EMPTY = {
  students: 0,
  activeStudents: 0,
  questions: 0,
  published: 0,
  attempts: 0,
  averageScore: 0,
  weeklyAttempts: 0,
  weeklyActiveStudents: 0,
  publishRate: 0,
  chapterPerformance: [],
  recentAttempts: [],
};
const localText = (value, language) =>
  value?.[language] ||
  (language === 'bn' ? value?.bn || value?.en : value?.en || value?.bn) ||
  (language === 'bn' ? 'শিরোনামহীন' : 'Untitled');
const text = (language, bangla, english) => (language === 'bn' ? bangla : english);
const formatNumber = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
const relativeTime = (value, language) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(language === 'bn' ? 'bn' : 'en', {
    numeric: 'auto',
  });
  for (const [unit, size] of [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ])
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  return formatter.format(seconds, 'second');
};

function Skeleton() {
  return (
    <>
      <CardGridSkeleton className="mt-8 xl:grid-cols-4" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <SkeletonBlock className="h-96" />
        <SkeletonBlock className="h-96" />
      </div>
    </>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const loadDashboard = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const result = await api('/analytics/teacher');
      setData({ ...EMPTY, ...(result.data || {}) });
      setError('');
    } catch (requestError) {
      setError(requestError.message || text(language, 'ড্যাশবোর্ড লোড করা যায়নি।', 'The dashboard could not be loaded.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);
  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(() => loadDashboard(true), 60000);
    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const displayName =
    (language === 'bn' ? user?.nameBangla || user?.nameEnglish : user?.nameEnglish || user?.nameBangla) ||
    user?.name || text(language, 'শিক্ষক', 'Teacher');
  const metrics = [
    [
      text(language, 'মোট শিক্ষার্থী', 'Total students'),
      data.students,
      text(language, `${formatNumber(data.activeStudents, language)}টি সক্রিয় অ্যাকাউন্ট`, `${formatNumber(data.activeStudents, language)} active accounts`),
      Users,
      'text-primary',
    ],
    [
      text(language, 'সম্পন্ন টেস্ট', 'Tests completed'),
      data.attempts,
      text(language, `গত ৭ দিনে ${formatNumber(data.weeklyAttempts, language)}টি`, `${formatNumber(data.weeklyAttempts, language)} in the last 7 days`),
      ClipboardCheck,
      'text-accent',
    ],
    [
      text(language, 'গড় স্কোর', 'Average score'),
      `${formatNumber(data.averageScore, language)}%`,
      text(language, 'জমা দেওয়া সব টেস্টের হিসাবে', 'Across all submitted tests'),
      BarChart3,
      'text-warning',
    ],
    [
      text(language, 'প্রকাশিত প্রশ্ন', 'Published questions'),
      data.published,
      text(language, `${formatNumber(data.questions, language)}টি প্রশ্নের ${formatNumber(data.publishRate, language)}%`, `${formatNumber(data.publishRate, language)}% of ${formatNumber(data.questions, language)} questions`),
      CheckCircle2,
      'text-success',
    ],
  ];

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {text(language, 'শিক্ষা কার্যক্রম', 'LEARNING OPERATIONS')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{text(language, 'শিক্ষক ড্যাশবোর্ড', 'Teacher dashboard')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/60">
            {text(language, `স্বাগতম, ${displayName}। লাইভ প্ল্যাটফর্ম ডেটা থেকে শিক্ষার্থীদের অংশগ্রহণ, শেখার ফলাফল ও প্রশ্নভাণ্ডারের প্রস্তুতি দেখুন।`, `Welcome back, ${displayName}. Monitor student engagement, learning outcomes, and question-bank readiness from live platform data.`)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-ghost"
            disabled={refreshing}
            onClick={() => loadDashboard(true)}
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={17} /> {text(language, 'রিফ্রেশ', 'Refresh')}
          </button>
          <Link className="btn btn-primary" href="/teacher/syllabus">
            <BookOpen size={17} /> {text(language, 'সিলেবাস পরিচালনা', 'Manage syllabus')}
          </Link>
        </div>
      </header>
      {error && (
        <div className="alert alert-error mt-6">
          <AlertTriangle size={19} />
          <span className="flex-1">{error}</span>
          <button className="btn btn-sm" onClick={() => loadDashboard()}>
            {text(language, 'আবার চেষ্টা করুন', 'Retry')}
          </button>
        </div>
      )}
      {loading ? (
        <Skeleton />
      ) : (
        <>
          <section
            className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label={text(language, 'ক্লাসের সারসংক্ষেপ', 'Class overview')}
          >
            {metrics.map(([label, value, detail, Icon, tone]) => (
              <article
                className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm"
                key={label}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-base-content/60">{label}</p>
                  <Icon className={tone} size={21} />
                </div>
                <p className="mt-3 font-display text-3xl font-bold">
                  {typeof value === 'number' ? formatNumber(value, language) : value}
                </p>
                <p className="mt-1 text-xs text-base-content/45">{detail}</p>
              </article>
            ))}
          </section>
          <section className="mt-6 overflow-hidden rounded-box bg-neutral text-neutral-content shadow-sm">
            <div className="soft-grid grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <p className="text-[10px] font-bold tracking-[.18em] text-emerald-200">
                  {text(language, 'গত ৭ দিন', 'LAST 7 DAYS')}
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold">
                  {text(language, `${formatNumber(data.weeklyActiveStudents, language)} জন শিক্ষার্থী সক্রিয় ছিল`, `${formatNumber(data.weeklyActiveStudents, language)} students stayed active`)}
                </h2>
                <p className="mt-2 text-sm text-neutral-content/65">
                  {text(language, `তারা এ সপ্তাহে ${formatNumber(data.weeklyAttempts, language)}টি টেস্ট সম্পন্ন করেছে। পরবর্তী পাঠ পরিকল্পনায় নিচের অধ্যায়ভিত্তিক তথ্য ব্যবহার করুন।`, `They completed ${formatNumber(data.weeklyAttempts, language)} tests this week. Use the chapter insights below to guide the next lesson.`)}
                </p>
              </div>
              <div className="grid size-24 place-items-center rounded-full border-8 border-primary bg-white/10 text-center">
                <div>
                  <TrendingUp className="mx-auto text-emerald-200" size={20} />
                  <b className="font-display text-2xl">{formatNumber(data.averageScore, language)}%</b>
                </div>
              </div>
            </div>
          </section>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <section className="rounded-box border border-base-300 bg-base-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-base-300 p-5 md:p-6">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-base-content/50">
                    {text(language, 'শিক্ষার্থী কার্যক্রম', 'STUDENT ACTIVITY')}
                  </p>
                  <h2 className="font-display text-2xl font-bold">{text(language, 'সাম্প্রতিক টেস্টের ফলাফল', 'Recent test results')}</h2>
                </div>
                <UserRoundCheck className="text-primary" size={23} />
              </div>
              {data.recentAttempts.length ? (
                <div className="divide-y divide-base-300">
                  {data.recentAttempts.map((attempt) => {
                    const studentName =
                      (language === 'bn'
                        ? attempt.student?.nameBangla || attempt.student?.nameEnglish
                        : attempt.student?.nameEnglish || attempt.student?.nameBangla) ||
                      attempt.student?.name || text(language, 'শিক্ষার্থী', 'Student');
                    return (
                      <div className="flex items-center gap-4 p-5" key={attempt.id}>
                        <div className="avatar placeholder">
                          <div className="w-10 rounded-full bg-secondary text-xs font-bold text-primary">
                            {studentName.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{studentName}</p>
                          <p className="mt-0.5 text-xs text-base-content/50">
                            {formatNumber(attempt.totalQuestions, language)} {text(language, 'টি প্রশ্ন', 'questions')} ·{' '}
                            {text(language, attempt.mode === 'practice' ? 'অনুশীলন' : 'কাস্টম', String(attempt.mode || 'custom').replace('-', ' '))} ·{' '}
                            {relativeTime(attempt.submittedAt, language)}
                          </p>
                        </div>
                        <span
                          className={`badge font-bold ${attempt.scorePercent >= 80 ? 'badge-success' : attempt.scorePercent >= 60 ? 'badge-warning' : 'badge-error'}`}
                        >
                          {formatNumber(attempt.scorePercent, language)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-sm text-base-content/55">
                  {text(language, 'প্রথম টেস্ট জমা হওয়ার পর শিক্ষার্থীদের ফলাফল এখানে দেখা যাবে।', 'Student results will appear after the first submitted test.')}
                </div>
              )}
            </section>
            <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm md:p-6">
              <p className="text-[10px] font-bold tracking-widest text-base-content/50">
                {text(language, 'শেখার অন্তর্দৃষ্টি', 'LEARNING INSIGHTS')}
              </p>
              <h2 className="font-display text-2xl font-bold">{text(language, 'যেসব অধ্যায়ে সহায়তা প্রয়োজন', 'Chapters needing support')}</h2>
              <p className="mt-1 text-xs text-base-content/50">
                {text(language, 'শিক্ষার্থীদের উত্তরে সর্বনিম্ন সঠিকতার হার', 'Lowest accuracy across student answers')}
              </p>
              {data.chapterPerformance.length ? (
                <div className="mt-5 space-y-5">
                  {data.chapterPerformance.map((chapter) => (
                    <div key={chapter.chapterId}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-semibold">
                          {localText(chapter.name, language)}
                        </span>
                        <b className={chapter.accuracy < 60 ? 'text-error' : 'text-primary'}>
                          {formatNumber(chapter.accuracy, language)}%
                        </b>
                      </div>
                      <progress
                        className={`progress w-full ${chapter.accuracy < 60 ? 'progress-error' : 'progress-primary'}`}
                        value={chapter.accuracy}
                        max="100"
                      />
                      <p className="mt-1 text-[10px] text-base-content/40">
                        {text(language, `${formatNumber(chapter.attempted, language)}টি উত্তর বিশ্লেষণ করা হয়েছে`, `${formatNumber(chapter.attempted, language)} answers analyzed`)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-box bg-base-200 p-8 text-center">
                  <FileQuestion className="mx-auto text-base-content/30" size={30} />
                  <p className="mt-2 text-sm text-base-content/55">
                    {text(language, 'শিক্ষার্থীরা টেস্ট সম্পন্ন করলে অধ্যায়ভিত্তিক তথ্য এখানে দেখা যাবে।', 'Chapter insights unlock as students complete tests.')}
                  </p>
                </div>
              )}
              <Link className="btn btn-outline btn-sm mt-6 w-full" href="/teacher/syllabus">
                {text(language, 'সিলেবাস পর্যালোচনা', 'Review syllabus')} <ArrowRight size={14} />
              </Link>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
