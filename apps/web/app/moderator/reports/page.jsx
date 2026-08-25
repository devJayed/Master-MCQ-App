'use client';

import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flag,
  Inbox,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import Pagination from '../../../components/Pagination';
import { api } from '../../../lib/api';

const TYPES = {
  incorrect_answer: ['ভুল উত্তর', 'Incorrect answer'],
  ambiguous_options: ['অস্পষ্ট বিকল্প', 'Ambiguous options'],
  typo: ['বানান বা ফরম্যাটিং', 'Typo or formatting'],
  explanation: ['ব্যাখ্যা সংশোধন প্রয়োজন', 'Explanation needs work'],
  other: ['অন্যান্য সমস্যা', 'Other issue'],
};
const STATUSES = {
  open: ['খোলা', 'Open'],
  in_review: ['পর্যালোচনায়', 'In review'],
  resolved: ['সমাধান করা', 'Resolved'],
  dismissed: ['বাতিল', 'Dismissed'],
};
const DIFFICULTIES = {
  easy: ['সহজ', 'Easy'],
  medium: ['মাঝারি', 'Medium'],
  hard: ['কঠিন', 'Hard'],
};
const QUESTION_STATUSES = {
  draft: ['খসড়া', 'Draft'],
  published: ['প্রকাশিত', 'Published'],
  archived: ['আর্কাইভ করা', 'Archived'],
};
const BADGES = {
  open: 'badge-error',
  in_review: 'badge-warning',
  resolved: 'badge-success',
  dismissed: 'badge-ghost',
};
const text = (language, bn, en) => (language === 'bn' ? bn : en);
const label = (map, value, language) =>
  text(language, ...(map[value] || [value || '—', value || '—']));
const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
const localText = (value, language) =>
  value?.[language] ||
  (language === 'bn' ? value?.bn || value?.en : value?.en || value?.bn) ||
  text(language, 'প্রশ্ন পাওয়া যায়নি', 'Question unavailable');
const formatDate = (value, language) =>
  new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function Reports() {
  const { language } = useLanguage();
  const [reports, setReports] = useState([]),
    [summary, setSummary] = useState({}),
    [status, setStatus] = useState('open'),
    [type, setType] = useState(''),
    [search, setSearch] = useState('');
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [total, setTotal] = useState(0),
    [selected, setSelected] = useState(null),
    [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');

  const loadReports = useCallback(async () => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) query.set('status', status);
    if (type) query.set('type', type);
    if (search.trim()) query.set('search', search.trim());
    setLoading(true);
    try {
      const result = await api(`/reports?${query}`);
      setReports(result.data || []);
      setSummary(result.summary || {});
      setTotal(result.pagination?.total || 0);
      if (result.pagination?.page && result.pagination.page !== page)
        setPage(result.pagination.page);
      setError('');
    } catch (requestError) {
      setError(
        requestError.message ||
          text(language, 'রিপোর্টগুলো লোড করা যায়নি।', 'Reports could not be loaded.')
      );
    } finally {
      setLoading(false);
    }
  }, [language, page, pageSize, search, status, type]);
  useEffect(() => {
    loadReports();
  }, [loadReports]);
  useEffect(() => {
    setPage(1);
  }, [pageSize, status, type, search]);

  const openReview = (report) => {
    setSelected(report);
    setResolutionNote(report.resolutionNote || '');
    setNotice('');
    setError('');
  };
  const closeReview = () => {
    if (!saving) setSelected(null);
  };
  const updateReport = async (nextStatus) => {
    if (['resolved', 'dismissed'].includes(nextStatus) && resolutionNote.trim().length < 5) {
      setError(
        text(
          language,
          'রিপোর্ট বন্ধ করার আগে অন্তত ৫ অক্ষরের একটি সংক্ষিপ্ত সিদ্ধান্ত লিখুন।',
          'Add a resolution note of at least 5 characters before closing this report.'
        )
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api(`/reports/${selected._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, resolutionNote }),
      });
      setNotice(
        text(language, 'রিপোর্টটি সফলভাবে হালনাগাদ হয়েছে।', 'Report updated successfully.')
      );
      setSelected(null);
      await loadReports();
    } catch (requestError) {
      setError(
        requestError.message ||
          text(language, 'রিপোর্টটি হালনাগাদ করা যায়নি।', 'Report could not be updated.')
      );
    } finally {
      setSaving(false);
    }
  };

  const reporterName = (report) =>
    (language === 'bn'
      ? report.reportedBy?.nameBangla || report.reportedBy?.nameEnglish
      : report.reportedBy?.nameEnglish || report.reportedBy?.nameBangla) ||
    report.reportedBy?.name ||
    text(language, 'শিক্ষার্থী', 'Student');
  const metrics = [
    [text(language, 'খোলা', 'Open'), summary.open, Flag, 'text-error'],
    [text(language, 'পর্যালোচনায়', 'In review'), summary.in_review, Clock3, 'text-warning'],
    [text(language, 'সমাধান করা', 'Resolved'), summary.resolved, CheckCircle2, 'text-success'],
    [text(language, 'সব রিপোর্ট', 'All reports'), summary.total, Inbox, 'text-primary'],
  ];

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">
            {text(language, 'কনটেন্টের মান', 'CONTENT QUALITY')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {text(language, 'প্রশ্নের রিপোর্ট', 'Question reports')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/60">
            {text(
              language,
              'শিক্ষার্থীদের মতামত যাচাই করুন, সিদ্ধান্ত নথিভুক্ত করুন এবং প্রশ্নভাণ্ডার নির্ভরযোগ্য রাখুন।',
              'Triage student feedback, document decisions, and keep the question bank trustworthy.'
            )}
          </p>
        </div>
        <div className="badge badge-lg border-primary/20 bg-primary/5 font-semibold text-primary">
          <ShieldCheck size={16} />
          {text(language, 'মান নিয়ন্ত্রণ কেন্দ্র', 'Quality workspace')}
        </div>
      </header>
      <section
        className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label={text(language, 'রিপোর্টের সারসংক্ষেপ', 'Report summary')}
      >
        {metrics.map(([title, value, Icon, tone]) => (
          <article
            key={title}
            className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/60">{title}</span>
              <Icon size={19} className={tone} />
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{number(value, language)}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="grid gap-3 border-b border-base-300 p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <label className="input input-bordered flex items-center gap-2">
            <Search size={17} />
            <input
              className="grow"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text(
                language,
                'প্রশ্ন বা রিপোর্টের বিবরণ খুঁজুন',
                'Search question or report details'
              )}
              aria-label={text(language, 'রিপোর্ট খুঁজুন', 'Search reports')}
            />
          </label>
          <select
            className="select select-bordered"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label={text(language, 'অবস্থা দিয়ে ফিল্টার করুন', 'Filter by status')}
          >
            <option value="">{text(language, 'সব অবস্থা', 'All statuses')}</option>
            {Object.keys(STATUSES).map((value) => (
              <option key={value} value={value}>
                {label(STATUSES, value, language)}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered"
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label={text(language, 'সমস্যার ধরন দিয়ে ফিল্টার করুন', 'Filter by issue type')}
          >
            <option value="">{text(language, 'সব ধরনের সমস্যা', 'All issue types')}</option>
            {Object.keys(TYPES).map((value) => (
              <option key={value} value={value}>
                {label(TYPES, value, language)}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <div className="alert alert-error m-4" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="alert alert-success m-4" role="status">
            {notice}
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center text-sm text-base-content/60" role="status">
            <span className="loading loading-spinner loading-sm mr-2" />
            {text(language, 'রিপোর্ট লোড হচ্ছে…', 'Loading reports…')}
          </div>
        ) : reports.length ? (
          <div className="divide-y divide-base-300">
            {reports.map((report) => (
              <article
                className="grid gap-4 p-5 transition hover:bg-base-200/40 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center"
                key={report._id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge badge-sm ${BADGES[report.status]}`}>
                      {label(STATUSES, report.status, language)}
                    </span>
                    <span className="text-xs font-bold tracking-wide text-primary">
                      {label(TYPES, report.type, language)}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate font-semibold">
                    {localText(report.questionId?.question, language)}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-base-content/65">{report.details}</p>
                  <p className="mt-2 text-xs text-base-content/45">
                    {text(
                      language,
                      `রিপোর্ট করেছেন ${reporterName(report)}`,
                      `Reported by ${reporterName(report)}`
                    )}{' '}
                    · {formatDate(report.createdAt, language)}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm lg:justify-self-end"
                  onClick={() => openReview(report)}
                >
                  {text(language, 'রিপোর্ট পর্যালোচনা', 'Review report')}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto text-success" size={34} />
            <h2 className="mt-3 font-semibold">
              {text(language, 'এই ফিল্টারে কোনো রিপোর্ট নেই', 'No reports match these filters')}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              {text(
                language,
                'অন্য ফিল্টার ব্যবহার করুন অথবা পরে আবার দেখুন।',
                'Try another filter or check back later.'
              )}
            </p>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          language={language}
          disabled={loading}
        />
      </section>
      {selected && (
        <div
          className="modal modal-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-review-title"
        >
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`badge badge-sm ${BADGES[selected.status]}`}>
                  {label(STATUSES, selected.status, language)}
                </span>
                <h2 id="report-review-title" className="mt-2 font-display text-2xl font-bold">
                  {label(TYPES, selected.type, language)}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-circle btn-ghost btn-sm"
                onClick={closeReview}
                disabled={saving}
                aria-label={text(language, 'পর্যালোচনা বন্ধ করুন', 'Close review')}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 rounded-box bg-base-200 p-4">
              <p className="text-xs font-bold tracking-wide text-base-content/50">
                {text(language, 'রিপোর্ট করা প্রশ্ন', 'REPORTED QUESTION')}
              </p>
              <p className="mt-2 font-semibold">
                {localText(selected.questionId?.question, language)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge badge-outline">
                  {label(DIFFICULTIES, selected.questionId?.difficulty, language)}
                </span>
                <span className="badge badge-outline">
                  {text(language, 'প্রশ্ন', 'Question')}:{' '}
                  {label(QUESTION_STATUSES, selected.questionId?.status, language)}
                </span>
                {selected.questionId?.isDeleted && (
                  <span className="badge badge-error">
                    {text(language, 'আর্কাইভ করা', 'Archived')}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold tracking-wide text-base-content/50">
                {text(language, 'শিক্ষার্থীর মতামত', 'STUDENT FEEDBACK')}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selected.details}</p>
              <p className="mt-2 text-xs text-base-content/50">
                {selected.reportedBy?.email || reporterName(selected)} ·{' '}
                {formatDate(selected.createdAt, language)}
              </p>
            </div>
            <label className="form-control mt-5">
              <span className="label-text mb-2 font-semibold">
                {text(language, 'সিদ্ধান্তের নোট', 'Resolution note')}
              </span>
              <textarea
                className="textarea textarea-bordered min-h-28"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                maxLength={1000}
                placeholder={text(
                  language,
                  'যা যাচাই করেছেন এবং যে ব্যবস্থা নিয়েছেন তা লিখুন…',
                  'Document what you checked and the action taken…'
                )}
              />
              <span className="mt-1 flex justify-between text-xs text-base-content/45">
                <span>
                  {text(
                    language,
                    'সমাধান বা বাতিল করতে অন্তত ৫ অক্ষর আবশ্যক।',
                    'At least 5 characters are required to resolve or dismiss.'
                  )}
                </span>
                <span>
                  {number(resolutionNote.length, language)}/{number(1000, language)}
                </span>
              </span>
            </label>
            {error && (
              <div className="alert alert-error mt-4" role="alert">
                {error}
              </div>
            )}
            <div className="modal-action flex-wrap">
              {selected.questionId?._id && (
                <Link
                  href={`/moderator/questions/${selected.questionId._id}/edit`}
                  className="btn btn-ghost"
                  target="_blank"
                >
                  {text(language, 'প্রশ্ন সম্পাদনা', 'Edit question')}
                  <ExternalLink size={15} />
                </Link>
              )}
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={() => updateReport('in_review')}
              >
                {text(language, 'পর্যালোচনায় রাখুন', 'Mark in review')}
              </button>
              <button
                type="button"
                className="btn btn-ghost text-error"
                disabled={saving}
                onClick={() => updateReport('dismissed')}
              >
                {text(language, 'বাতিল করুন', 'Dismiss')}
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={saving}
                onClick={() => updateReport('resolved')}
              >
                {saving && <span className="loading loading-spinner loading-xs" />}
                {text(language, 'সমাধান করুন', 'Resolve')}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            onClick={closeReview}
            disabled={saving}
            aria-label={text(language, 'রিপোর্ট পর্যালোচনা বন্ধ করুন', 'Close report review')}
          />
        </div>
      )}
    </main>
  );
}
