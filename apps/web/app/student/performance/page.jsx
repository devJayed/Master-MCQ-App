'use client';

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Clock3,
  RefreshCw,
  Target,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { CardGridSkeleton, Skeleton, SkeletonStatus } from '../../../components/Skeletons';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { api } from '../../../lib/api';

const labels = {
  en: {
    eyebrow: 'THE BIG PICTURE',
    title: 'Your performance',
    subtitle: 'A live view of your submitted tests and learning progress.',
    tests: 'Tests completed',
    questions: 'Questions attempted',
    correct: 'Correct answers',
    incorrect: 'Incorrect answers',
    unanswered: 'Unanswered',
    overall: 'Overall score',
    average: 'Average test score',
    best: 'Best test score',
    accuracy: 'Answer breakdown',
    recent: 'Recent test performance',
    trend: 'Performance trend',
    chapterWise: 'Chapter-wise performance',
    chapter: 'Chapter',
    attempted: 'Attempted',
    marks: 'Marks',
    accuracyLabel: 'Accuracy',
    averageChapterScore: 'Average score',
    noData: 'No data',
    noChapterAttempts: 'No questions attempted from this chapter yet.',
    date: 'Submitted',
    score: 'Score',
    time: 'Time taken',
    review: 'Review',
    emptyTitle: 'No test history yet',
    emptyBody: 'Complete and submit a test to start building your performance dashboard.',
    create: 'Create a test',
    loading: 'Loading performance...',
    minutes: 'min',
    seconds: 'sec',
    error: 'Performance could not be loaded. Please try again.',
    retry: 'Try again',
    action: 'Action',
    noRecent: 'No recent test results yet.',
  },
  bn: {
    eyebrow: 'সামগ্রিক চিত্র',
    title: 'আপনার পারফরম্যান্স',
    subtitle: 'আপনার জমা দেওয়া টেস্ট ও শেখার অগ্রগতির লাইভ চিত্র।',
    tests: 'সম্পন্ন টেস্ট',
    questions: 'চেষ্টা করা প্রশ্ন',
    correct: 'সঠিক উত্তর',
    incorrect: 'ভুল উত্তর',
    unanswered: 'উত্তর দেওয়া হয়নি',
    overall: 'সামগ্রিক স্কোর',
    average: 'গড় টেস্ট স্কোর',
    best: 'সেরা টেস্ট স্কোর',
    accuracy: 'উত্তরের বিশ্লেষণ',
    recent: 'সাম্প্রতিক টেস্ট পারফরম্যান্স',
    trend: 'পারফরম্যান্সের ধারা',
    chapterWise: 'অধ্যায়ভিত্তিক পারফরম্যান্স',
    chapter: 'অধ্যায়',
    attempted: 'চেষ্টা করা হয়েছে',
    marks: 'নম্বর',
    accuracyLabel: 'নির্ভুলতা',
    averageChapterScore: 'গড় স্কোর',
    noData: 'কোনো তথ্য নেই',
    noChapterAttempts: 'এই অধ্যায় থেকে এখনও কোনো প্রশ্ন চেষ্টা করা হয়নি।',
    date: 'জমা দেওয়া হয়েছে',
    score: 'স্কোর',
    time: 'সময় লেগেছে',
    review: 'ফলাফল দেখুন',
    emptyTitle: 'এখনও কোনো টেস্ট ইতিহাস নেই',
    emptyBody: 'পারফরম্যান্স ড্যাশবোর্ড তৈরি করতে একটি টেস্ট সম্পন্ন করে জমা দিন।',
    create: 'টেস্ট তৈরি করুন',
    loading: 'পারফরম্যান্স লোড হচ্ছে...',
    minutes: 'মিনিট',
    seconds: 'সেকেন্ড',
    error: 'পারফরম্যান্স লোড করা যায়নি। আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন',
    action: 'কার্যক্রম',
    noRecent: 'এখনো কোনো সাম্প্রতিক পরীক্ষার ফল নেই।',
  },
};

const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 1,
  });

const formatDate = (value, language) =>
  new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));

const formatTime = (seconds, language) => {
  const minutes = Math.floor((seconds || 0) / 60);
  const remainder = (seconds || 0) % 60;
  return minutes
    ? `${number(minutes, language)} ${labels[language].minutes}${remainder ? ` ${number(remainder, language)} ${labels[language].seconds}` : ''}`
    : `${number(remainder, language)} ${labels[language].seconds}`;
};

function Metric({ icon: Icon, label, value, tone = 'primary' }) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    error: 'bg-error/10 text-error',
    warning: 'bg-warning/10 text-warning',
  };
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <div
        className={`mb-3 grid size-9 place-items-center rounded-full ${toneClasses[tone] || toneClasses.primary}`}
      >
        <Icon size={17} />
      </div>
      <p className="text-xs text-base-content/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function PerformanceContent() {
  const { language } = useLanguage();
  const copy = labels[language];
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPerformance = useCallback(() => {
    setLoading(true);
    setError('');
    api('/analytics/student')
      .then((result) => setPerformance(result.data))
      .catch(() => setError(copy.error))
      .finally(() => setLoading(false));
  }, [copy.error]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  if (loading)
    return (
      <SkeletonStatus className="mx-auto max-w-7xl p-5 md:p-10" label={copy.loading}>
        <Skeleton className="h-32 w-full" />
        <CardGridSkeleton className="mt-4" />
      </SkeletonStatus>
    );
  if (error)
    return (
      <div className="mx-auto max-w-4xl p-5 md:p-10">
        <div className="alert alert-error" role="alert">
          <span className="flex-1">{error}</span>
          <button type="button" className="btn btn-sm" onClick={loadPerformance}>
            <RefreshCw size={14} />
            {copy.retry}
          </button>
        </div>
      </div>
    );

  const safePerformance = {
    testsCompleted: 0,
    questionsAttempted: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    unansweredQuestions: 0,
    overallScore: 0,
    averageScore: 0,
    bestScore: 0,
    trend: [],
    recent: [],
    chapters: [],
    ...performance,
  };
  const totalAnswers =
    safePerformance.correctAnswers +
    safePerformance.incorrectAnswers +
    safePerformance.unansweredQuestions;
  const correctPercent = totalAnswers
    ? Math.round((safePerformance.correctAnswers / totalAnswers) * 100)
    : 0;
  const incorrectPercent = totalAnswers
    ? Math.round((safePerformance.incorrectAnswers / totalAnswers) * 100)
    : 0;
  const unansweredPercent = Math.max(0, 100 - correctPercent - incorrectPercent);
  const maxTrend = Math.max(...safePerformance.trend.map((item) => item.scorePercent || 0), 1);
  const chapters = safePerformance.chapters;

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">{copy.eyebrow}</p>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="mt-2 font-display text-4xl font-bold">{copy.title}</h1>
          <p className="mt-3 text-sm text-base-content/60">{copy.subtitle}</p>
        </div>
        <Link href="/student/history" className="btn btn-outline btn-sm">
          {copy.review}
          <ArrowRight size={14} />
        </Link>
      </div>

      {!safePerformance.testsCompleted && (
        <section className="mt-8 rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center shadow-sm">
          <BarChart3 className="mx-auto text-primary" size={34} />
          <h2 className="mt-4 font-display text-2xl font-bold">{copy.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-base-content/60">{copy.emptyBody}</p>
          <Link href="/student/create-test" className="btn btn-primary mt-6">
            {copy.create}
          </Link>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Target}
          label={copy.tests}
          value={number(safePerformance.testsCompleted, language)}
        />
        <Metric
          icon={CircleHelp}
          label={copy.questions}
          value={number(safePerformance.questionsAttempted, language)}
          tone="secondary"
        />
        <Metric
          icon={CheckCircle2}
          label={copy.correct}
          value={number(safePerformance.correctAnswers, language)}
          tone="success"
        />
        <Metric
          icon={XCircle}
          label={copy.incorrect}
          value={number(safePerformance.incorrectAnswers, language)}
          tone="error"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={CircleHelp}
          label={copy.unanswered}
          value={number(safePerformance.unansweredQuestions, language)}
          tone="warning"
        />
        <Metric
          icon={BarChart3}
          label={copy.overall}
          value={`${number(safePerformance.overallScore, language)}%`}
        />
        <Metric
          icon={BarChart3}
          label={copy.average}
          value={`${number(safePerformance.averageScore, language)}%`}
          tone="secondary"
        />
        <Metric
          icon={Target}
          label={copy.best}
          value={`${number(safePerformance.bestScore, language)}%`}
          tone="success"
        />
      </div>

      <section className="mt-6 rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 p-5">
          <h2 className="font-display text-xl font-bold">{copy.chapterWise}</h2>
          <p className="mt-1 text-xs text-base-content/60">{copy.subtitle}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{copy.chapter}</th>
                <th>{copy.attempted}</th>
                <th>{copy.correct}</th>
                <th>{copy.incorrect}</th>
                <th>{copy.unanswered}</th>
                <th>{copy.marks}</th>
                <th>{copy.accuracyLabel}</th>
                <th>{copy.averageChapterScore}</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter) => {
                const chapterName =
                  chapter.name?.[language] ||
                  (language === 'bn'
                    ? chapter.name?.bn || chapter.name?.en
                    : chapter.name?.en || chapter.name?.bn) ||
                  chapter.title ||
                  '—';
                const hasData = chapter.totalQuestions > 0;
                const accuracy = Math.round(chapter.accuracy || 0);
                return (
                  <tr key={String(chapter.chapterId)}>
                    <td className="min-w-52">
                      <div className="font-semibold">{chapterName}</div>
                      <progress
                        className="progress progress-primary mt-2 w-full"
                        value={hasData ? accuracy : 0}
                        max="100"
                      />
                    </td>
                    <td>
                      {hasData ? (
                        number(chapter.totalQuestions, language)
                      ) : (
                        <span className="text-base-content/45">{copy.noData}</span>
                      )}
                    </td>
                    <td className="text-success">
                      {hasData ? number(chapter.correctAnswers, language) : '—'}
                    </td>
                    <td className="text-error">
                      {hasData ? number(chapter.incorrectAnswers, language) : '—'}
                    </td>
                    <td className="text-warning">
                      {hasData ? number(chapter.unansweredQuestions, language) : '—'}
                    </td>
                    <td>
                      {hasData
                        ? `${number(chapter.marksObtained, language)} / ${number(chapter.totalMarks, language)}`
                        : '—'}
                    </td>
                    <td className="font-bold text-primary">
                      {hasData ? `${number(accuracy, language)}%` : '—'}
                    </td>
                    <td>
                      {hasData ? (
                        `${number(Math.round(chapter.averageScore || 0), language)}%`
                      ) : (
                        <span className="text-xs text-base-content/45">
                          {copy.noChapterAttempts}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="font-display text-xl font-bold">{copy.accuracy}</h2>
          <div className="mt-5 space-y-4">
            {[
              [copy.correct, safePerformance.correctAnswers, correctPercent, 'success'],
              [copy.incorrect, safePerformance.incorrectAnswers, incorrectPercent, 'error'],
              [copy.unanswered, safePerformance.unansweredQuestions, unansweredPercent, 'warning'],
            ].map(([label, value, percent, tone]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <b>
                    {number(value, language)} · {number(percent, language)}%
                  </b>
                </div>
                <progress
                  className={`progress progress-${tone} w-full`}
                  value={percent}
                  max="100"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{copy.trend}</h2>
            <BarChart3 className="text-primary" size={20} />
          </div>
          <div className="mt-5 flex h-40 items-end gap-2 border-b border-base-300 px-2">
            {safePerformance.trend.map((item, index) => (
              <div
                key={`${item.submittedAt}-${index}`}
                className="group flex h-full flex-1 items-end"
                title={`${number(item.scorePercent, language)}% · ${formatDate(item.submittedAt, language)}`}
              >
                <div
                  className="w-full rounded-t bg-primary/70 transition hover:bg-primary"
                  style={{ height: `${Math.max(5, ((item.scorePercent || 0) / maxTrend) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-base-content/50">
            <span>
              {safePerformance.trend[0]
                ? formatDate(safePerformance.trend[0].submittedAt, language)
                : ''}
            </span>
            <span>
              {safePerformance.trend.at(-1)
                ? formatDate(safePerformance.trend.at(-1).submittedAt, language)
                : ''}
            </span>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-base-300 p-5">
          <h2 className="font-display text-xl font-bold">{copy.recent}</h2>
          <Clock3 className="text-primary" size={20} />
        </div>
        {safePerformance.recent.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <caption className="sr-only">{copy.recent}</caption>
              <thead>
                <tr>
                  <th>{copy.date}</th>
                  <th>{copy.questions}</th>
                  <th>{copy.score}</th>
                  <th>{copy.time}</th>
                  <th className="text-right">{copy.action}</th>
                </tr>
              </thead>
              <tbody>
                {safePerformance.recent.map((attempt) => (
                  <tr key={attempt.id || attempt.submittedAt}>
                    <td>{formatDate(attempt.submittedAt, language)}</td>
                    <td>{number(attempt.totalQuestions, language)}</td>
                    <td className="font-bold text-primary">
                      {number(Math.round(attempt.scorePercent || 0), language)}%
                    </td>
                    <td>{formatTime(attempt.timeTakenSeconds, language)}</td>
                    <td className="text-right">
                      <Link
                        className="btn btn-ghost btn-sm text-primary"
                        href={`/student/result?attemptId=${attempt.id}`}
                      >
                        {copy.review}
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-base-content/55">{copy.noRecent}</p>
        )}
      </section>
    </main>
  );
}

export default function Performance() {
  return (
    <ProtectedRoute roles={['student']}>
      <PerformanceContent />
    </ProtectedRoute>
  );
}
