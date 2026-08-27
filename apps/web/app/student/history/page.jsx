'use client';

import { ArrowRight, Clock3, FileQuestion, History as HistoryIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Pagination from '../../../components/Pagination';
import { ListSkeleton } from '../../../components/Skeletons';
import { api } from '../../../lib/api';

const formatDate = (value, language) =>
  new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const text = (language, bn, en) => (language === 'bn' ? bn : en);
const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
const MODES = {
  topic: ['টপিক অনুশীলন', 'Topic practice'],
  chapter: ['অধ্যায় পরীক্ষা', 'Chapter test'],
  quick: ['দ্রুত পরীক্ষা', 'Quick test'],
  mistakes: ['ভুলের অনুশীলন', 'Mistake practice'],
  custom: ['কাস্টম পরীক্ষা', 'Custom test'],
  model: ['মডেল টেস্ট', 'Model test'],
};
const modeName = (mode, language) => text(language, ...(MODES[mode] || MODES.custom));

const formatDuration = (seconds = 0, language) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (!minutes)
    return text(
      language,
      `${number(remainder, language)} সেকেন্ড`,
      `${number(remainder, language)}s`
    );
  return remainder
    ? text(
        language,
        `${number(minutes, language)} মিনিট ${number(remainder, language)} সেকেন্ড`,
        `${number(minutes, language)}m ${number(remainder, language)}s`
      )
    : text(language, `${number(minutes, language)} মিনিট`, `${number(minutes, language)}m`);
};

function HistoryContent() {
  const { language } = useLanguage();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadAttempts = useCallback(() => {
    setLoading(true);
    api(`/attempts/me?page=${page}&pageSize=${pageSize}`)
      .then((result) => {
        setAttempts(result.data || []);
        setTotal(result.pagination?.total || 0);
        setError('');
        if (result.pagination?.page && result.pagination.page !== page)
          setPage(result.pagination.page);
      })
      .catch(() =>
        setError(
          text(
            language,
            'ইতিহাস লোড করা যায়নি। আবার চেষ্টা করুন।',
            'History could not be loaded. Please try again.'
          )
        )
      )
      .finally(() => setLoading(false));
  }, [language, page, pageSize]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  useEffect(() => setPage(1), [pageSize]);

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {text(language, 'আপনার শেখার রেকর্ড', 'YOUR LEARNING LOG')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {text(language, 'পরীক্ষার ইতিহাস', 'Test history')}
          </h1>
          <p className="mt-3 text-sm text-base-content/60">
            {text(
              language,
              'জমা দেওয়া যেকোনো পরীক্ষা খুলে সম্পূর্ণ ফলাফল ও উত্তর আবার দেখুন।',
              'Open any submitted test to revisit its complete results and answers.'
            )}
          </p>
        </div>
        {!loading && (
          <div className="badge badge-lg badge-outline">
            <HistoryIcon size={16} />
            {text(
              language,
              `${number(total, language)}টি পরীক্ষা`,
              `${number(total, language)} tests`
            )}
          </div>
        )}
      </header>

      {loading && (
        <ListSkeleton count={3} className="mt-8" />
      )}
      {error && (
        <div className="alert alert-error mt-8" role="alert">
          <span className="flex-1">{error}</span>
          <button type="button" className="btn btn-sm" onClick={loadAttempts}>
            <RefreshCw size={14} />
            {text(language, 'আবার চেষ্টা করুন', 'Try again')}
          </button>
        </div>
      )}
      {!loading && !error && !attempts.length && (
        <div className="mt-8 rounded-box border border-dashed border-base-300 p-10 text-center">
          <FileQuestion className="mx-auto text-base-content/30" size={34} />
          <h2 className="mt-3 font-semibold">
            {text(language, 'এখনো কোনো পরীক্ষা জমা দেওয়া হয়নি', 'No submitted tests yet')}
          </h2>
          <p className="mt-1 text-sm text-base-content/55">
            {text(
              language,
              'একটি পরীক্ষা শেষ করলে ফলাফল এখানে দেখা যাবে।',
              'Complete a test and its result will appear here.'
            )}
          </p>
          <Link href="/student/practice" className="btn btn-primary btn-sm mt-5">
            {text(language, 'অনুশীলন শুরু করুন', 'Start practicing')}
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {!loading && !error && attempts.length > 0 && (
        <div className="mt-7 rounded-box border border-base-300 bg-base-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="table">
              <caption className="sr-only">
                {text(language, 'জমা দেওয়া পরীক্ষার ইতিহাস', 'Submitted test history')}
              </caption>
              <thead>
                <tr>
                  <th>{text(language, 'পরীক্ষার ধরন', 'Test type')}</th>
                  <th>{text(language, 'জমা দেওয়ার সময়', 'Submitted')}</th>
                  <th>{text(language, 'প্রশ্ন', 'Questions')}</th>
                  <th>{text(language, 'স্কোর', 'Score')}</th>
                  <th>{text(language, 'সময়', 'Time')}</th>
                  <th className="text-right">{text(language, 'কার্যক্রম', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt._id}>
                    <td>
                      <span className="font-semibold">{modeName(attempt.mode, language)}</span>
                      <small className="mt-0.5 block font-mono text-base-content/40">
                        #{String(attempt._id).slice(-6).toUpperCase()}
                      </small>
                    </td>
                    <td>{formatDate(attempt.submittedAt || attempt.createdAt, language)}</td>
                    <td>
                      {number(attempt.totalQuestions || attempt.questionIds?.length, language)}
                    </td>
                    <td>
                      <span
                        className={`badge font-bold ${(attempt.scorePercent || 0) >= 80 ? 'badge-success' : (attempt.scorePercent || 0) >= 50 ? 'badge-warning' : 'badge-error'}`}
                      >
                        {number(attempt.marksObtained ?? attempt.correctCount, language)} /{' '}
                        {number(attempt.totalMarks ?? attempt.totalQuestions, language)} ·{' '}
                        {number(attempt.scorePercent, language)}%
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock3 size={14} className="text-base-content/40" />
                        {formatDuration(
                          attempt.timeTakenSeconds ?? attempt.durationSeconds,
                          language
                        )}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        className="btn btn-primary btn-sm"
                        href={`/student/result?attemptId=${attempt._id}`}
                      >
                        {text(language, 'ফলাফল দেখুন', 'View result')}
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            language={language}
            disabled={loading}
          />
        </div>
      )}
    </main>
  );
}

export default function History() {
  return (
    <ProtectedRoute roles={['student']}>
      <HistoryContent />
    </ProtectedRoute>
  );
}
