'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Pagination from '../../../components/Pagination';
import { api } from '../../../lib/api';

const formatDate = (value, language) =>
  new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatDuration = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

function HistoryContent() {
  const { language } = useLanguage();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api(`/attempts/me?page=${page}&pageSize=${pageSize}`)
      .then((result) => {
        setAttempts(result.data || []);
        setTotal(result.pagination?.total || 0);
        setError('');
        if (result.pagination?.page && result.pagination.page !== page) setPage(result.pagination.page);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => setPage(1), [pageSize]);

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-10">
      <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">{language === 'bn' ? 'আপনার শেখার রেকর্ড' : 'YOUR LEARNING LOG'}</p>
      <h1 className="mt-2 font-display text-4xl font-bold">{language === 'bn' ? 'টেস্টের ইতিহাস' : 'Test history'}</h1>
      <p className="mt-3 text-sm text-base-content/60">{language === 'bn' ? 'আপনার জমা দেওয়া সব পরীক্ষার ফলাফল ও রিভিউ দেখুন।' : 'Open any submitted test to revisit its complete review.'}</p>

      {loading && <p className="mt-8 text-sm text-base-content/60">{language === 'bn' ? 'ইতিহাস লোড হচ্ছে...' : 'Loading history...'}</p>}
      {error && <div className="alert alert-error mt-8">{error}</div>}
      {!loading && !error && !attempts.length && <div className="mt-8 rounded-box border border-dashed border-base-300 p-10 text-center text-sm text-base-content/60">{language === 'bn' ? 'এখনও কোনো টেস্ট জমা দেওয়া হয়নি।' : 'No submitted tests yet.'}</div>}

      {!loading && !error && attempts.length > 0 && (
        <div className="mt-7 rounded-box border border-base-300 bg-base-100 shadow-sm">
          <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{language === 'bn' ? 'Attempt ID' : 'Attempt ID'}</th>
                <th>{language === 'bn' ? 'জমা দেওয়ার সময়' : 'Submitted'}</th>
                <th>{language === 'bn' ? 'প্রশ্ন' : 'Questions'}</th>
                <th>{language === 'bn' ? 'স্কোর' : 'Score'}</th>
                <th>{language === 'bn' ? 'সময়' : 'Time'}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt._id}>
                  <td className="font-mono text-xs">{String(attempt._id).slice(-8)}</td>
                  <td>{formatDate(attempt.submittedAt || attempt.createdAt, language)}</td>
                  <td>{attempt.totalQuestions || attempt.questionIds?.length || 0}</td>
                  <td className="font-bold text-primary">{attempt.marksObtained ?? attempt.correctCount} / {attempt.totalMarks ?? attempt.totalQuestions} ({attempt.scorePercent || 0}%)</td>
                  <td>{formatDuration(attempt.timeTakenSeconds ?? attempt.durationSeconds)}</td>
                  <td><Link className="btn btn-primary btn-sm" href={`/student/result?attemptId=${attempt._id}`}>{language === 'bn' ? 'রিভিউ দেখুন' : 'Review'}</Link></td>
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
    </div>
  );
}

export default function History() {
  return <ProtectedRoute roles={['student']}><HistoryContent /></ProtectedRoute>;
}
