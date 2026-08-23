'use client';

import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, Clock3, FilePlus2, FileQuestion, Flag, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

const EMPTY = {
  totalQuestions: 0, publishedQuestions: 0, draftQuestions: 0, archivedQuestions: 0,
  openReports: 0, inReviewReports: 0, resolvedReports: 0, reportResolutionRate: 100,
  questionsUpdatedThisWeek: 0, reportsResolvedThisWeek: 0, averageResolutionHours: 0,
  recentQuestions: [], recentReports: [],
};
const localText = (value, language) => value?.[language] || value?.bn || value?.en || 'Untitled question';
const relativeTime = (value, language) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const ranges = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  const formatter = new Intl.RelativeTimeFormat(language === 'bn' ? 'bn' : 'en', { numeric: 'auto' });
  for (const [unit, size] of ranges) if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  return formatter.format(seconds, 'second');
};
const reportTypes = { incorrect_answer: 'Incorrect answer', ambiguous_options: 'Ambiguous options', typo: 'Typo or formatting', explanation: 'Explanation issue', other: 'Other issue' };

function DashboardSkeleton() {
  return <><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-32 rounded-box" />)}</div><div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><div className="skeleton h-96 rounded-box" /><div className="skeleton h-96 rounded-box" /></div></>;
}

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await api('/analytics/moderator');
      setData({ ...EMPTY, ...(result.data || {}) });
      setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadDashboard(); }, []);

  const stats = [
    ['Total questions', data.totalQuestions, FileQuestion, 'text-primary', '/moderator/questions'],
    ['Published', data.publishedQuestions, CheckCircle2, 'text-success', '/moderator/questions'],
    ['Awaiting review', data.draftQuestions, Clock3, 'text-warning', '/moderator/questions'],
    ['Open reports', data.openReports, Flag, 'text-error', '/moderator/reports'],
  ];
  const displayName = user?.nameEnglish || user?.name || 'Moderator';

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[10px] font-bold tracking-widest text-base-content/50">CONTENT OPERATIONS</p><h1 className="mt-2 font-display text-4xl font-bold">Moderator dashboard</h1><p className="mt-2 text-sm text-base-content/60">Welcome back, {displayName}. Here is the live state of your content quality workflow.</p></div>
        <div className="flex flex-wrap items-center gap-3"><Link href="/moderator/syllabus" className="btn btn-outline border-base-300"><BookOpen size={17} /> Syllabus config</Link><Link href="/moderator/questions/create" className="btn btn-primary"><FilePlus2 size={17} /> Add a question</Link></div>
      </header>

      {error && <div className="alert alert-error mt-6"><AlertTriangle size={19} /><span className="flex-1">{error}</span><button type="button" className="btn btn-sm" onClick={loadDashboard}><RefreshCw size={15} /> Retry</button></div>}
      {loading ? <DashboardSkeleton /> : <>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Content overview">
          {stats.map(([label, value, Icon, color, href]) => <Link href={href} className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" key={label}><div className="card-body p-5"><div className="flex items-center justify-between"><p className="text-xs text-base-content/60">{label}</p><Icon className={color} size={20} /></div><b className="mt-1 font-display text-3xl">{Number(value).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</b></div></Link>)}
        </section>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <section className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body p-5 md:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold tracking-widest text-base-content/50">RECENT CONTENT</p><h2 className="font-display text-2xl font-bold">Question activity</h2></div><Link href="/moderator/questions" className="btn btn-ghost btn-sm text-primary">View all <ArrowRight size={15} /></Link></div>
            {data.recentQuestions.length ? <div className="mt-3 divide-y divide-base-300">{data.recentQuestions.map((question) => <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center" key={question._id}><div className="min-w-0 flex-1"><b className="block truncate text-sm">{localText(question.question, language)}</b><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/50"><span>{localText(question.topicId?.name || question.chapterId?.name, language)}</span><span aria-hidden="true">·</span><span>{relativeTime(question.updatedAt, language)}</span><span className={`badge badge-xs ${question.status === 'published' ? 'badge-success' : question.status === 'draft' ? 'badge-warning' : 'badge-ghost'}`}>{question.status}</span></div></div><Link href={`/moderator/questions/${question._id}/edit`} className="btn btn-outline btn-sm">Review</Link></div>)}</div> : <div className="py-12 text-center text-sm text-base-content/55">No questions have been added yet.</div>}
          </div></section>

          <section className="card bg-neutral text-neutral-content shadow-sm"><div className="card-body p-5 md:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold tracking-widest text-emerald-100">QUALITY SNAPSHOT</p><h2 className="font-display text-2xl font-bold">Last 7 days</h2></div><ShieldCheck className="text-secondary" size={25} /></div><div className="mt-3 space-y-4 border-y border-white/15 py-5 text-sm"><p className="flex justify-between gap-4"><span className="text-neutral-content/70">Questions updated</span><b>{data.questionsUpdatedThisWeek}</b></p><p className="flex justify-between gap-4"><span className="text-neutral-content/70">Reports resolved</span><b>{data.reportsResolvedThisWeek}</b></p><p className="flex justify-between gap-4"><span className="text-neutral-content/70">Average resolution time</span><b>{data.averageResolutionHours ? `${data.averageResolutionHours}h` : '—'}</b></p><div><p className="mb-2 flex justify-between"><span className="text-neutral-content/70">All-time report resolution</span><b>{data.reportResolutionRate}%</b></p><progress className="progress progress-secondary w-full" value={data.reportResolutionRate} max="100" /></div></div><Link href="/moderator/reports" className="btn btn-secondary mt-2 border-0">Resolve reports {data.openReports > 0 && <span className="badge badge-neutral">{data.openReports}</span>}</Link></div></section>
        </div>

        <section className="mt-5 rounded-box border border-base-300 bg-base-100 shadow-sm"><div className="flex flex-col justify-between gap-2 border-b border-base-300 p-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold tracking-widest text-base-content/50">REPORT QUEUE</p><h2 className="font-display text-2xl font-bold">Needs attention</h2></div><p className="text-sm text-base-content/55">{data.openReports + data.inReviewReports} active reports</p></div>
          {data.recentReports.length ? <div className="divide-y divide-base-300">{data.recentReports.map((report) => <div className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_160px] md:items-center" key={report._id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`badge badge-sm ${report.status === 'open' ? 'badge-error' : 'badge-warning'}`}>{report.status === 'in_review' ? 'In review' : 'Open'}</span><span className="text-xs font-bold uppercase tracking-wide text-primary">{reportTypes[report.type]}</span></div><p className="mt-2 truncate text-sm font-semibold">{localText(report.questionId?.question, language)}</p><p className="mt-1 text-xs text-base-content/50">Reported {relativeTime(report.createdAt, language)}</p></div><Link href="/moderator/reports" className="btn btn-outline btn-sm">Open queue <ArrowRight size={14} /></Link></div>)}</div> : <div className="p-10 text-center"><CheckCircle2 className="mx-auto text-success" size={32} /><p className="mt-2 font-semibold">The report queue is clear</p><p className="mt-1 text-sm text-base-content/55">There are no open or in-review reports.</p></div>}
        </section>
      </>}
    </div>
  );
}
