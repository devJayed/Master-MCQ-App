'use client';

import { CheckCircle2, Clock3, ExternalLink, Flag, Inbox, Search, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import Pagination from '../../../components/Pagination';
import { api } from '../../../lib/api';

const TYPES = { incorrect_answer: 'Incorrect answer', ambiguous_options: 'Ambiguous options', typo: 'Typo or formatting', explanation: 'Explanation needs work', other: 'Other issue' };
const STATUSES = { open: 'Open', in_review: 'In review', resolved: 'Resolved', dismissed: 'Dismissed' };
const BADGES = { open: 'badge-error', in_review: 'badge-warning', resolved: 'badge-success', dismissed: 'badge-ghost' };
const localText = (value, language) => value?.[language] || value?.bn || value?.en || 'Question unavailable';
const formatDate = (value, language) => new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function Reports() {
  const { language } = useLanguage();
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, in_review: 0, resolved: 0 });
  const [status, setStatus] = useState('open');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReports = async () => {
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
      if (result.pagination?.page && result.pagination.page !== page) setPage(result.pagination.page);
      setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, [page, pageSize, status, type, search]);
  useEffect(() => { setPage(1); }, [pageSize, status, type, search]);

  const openReview = (report) => {
    setSelected(report);
    setResolutionNote(report.resolutionNote || '');
    setNotice('');
    setError('');
  };

  const updateReport = async (nextStatus) => {
    setSaving(true);
    try {
      const result = await api(`/reports/${selected._id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, resolutionNote }) });
      setNotice(result.message);
      setSelected(null);
      await loadReports();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const metrics = [
    ['Open', summary.open, Flag, 'text-error'],
    ['In review', summary.in_review, Clock3, 'text-warning'],
    ['Resolved', summary.resolved, CheckCircle2, 'text-success'],
    ['All reports', summary.total, Inbox, 'text-primary'],
  ];

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-[10px] font-bold tracking-widest text-base-content/50">CONTENT QUALITY</p><h1 className="mt-2 font-display text-4xl font-bold">Question reports</h1><p className="mt-2 text-sm text-base-content/60">Triage student feedback, document decisions, and keep the question bank trustworthy.</p></div>
        <div className="badge badge-lg border-primary/20 bg-primary/5 font-semibold text-primary"><ShieldCheck size={16} /> Quality workspace</div>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
        {metrics.map(([label, value, Icon, tone]) => <div key={label} className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-base-content/60">{label}</span><Icon size={19} className={tone} /></div><p className="mt-2 font-display text-3xl font-bold">{value || 0}</p></div>)}
      </section>

      <section className="mt-6 rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="grid gap-3 border-b border-base-300 p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <label className="input input-bordered flex items-center gap-2"><Search size={17} /><input className="grow" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question or report details" /></label>
          <select className="select select-bordered" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select className="select select-bordered" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by issue type"><option value="">All issue types</option>{Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
        {error && <div className="alert alert-error m-4"><span>{error}</span></div>}
        {notice && <div className="alert alert-success m-4"><span>{notice}</span></div>}
        {loading ? <div className="p-12 text-center text-sm text-base-content/60"><span className="loading loading-spinner loading-sm mr-2" />Loading reports…</div> : reports.length ? (
          <div className="divide-y divide-base-300">{reports.map((report) => <article className="grid gap-4 p-5 transition hover:bg-base-200/40 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center" key={report._id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`badge badge-sm ${BADGES[report.status]}`}>{STATUSES[report.status]}</span><span className="text-xs font-bold uppercase tracking-wide text-primary">{TYPES[report.type]}</span></div><h2 className="mt-2 truncate font-semibold">{localText(report.questionId?.question, language)}</h2><p className="mt-1 line-clamp-2 text-sm text-base-content/65">{report.details}</p><p className="mt-2 text-xs text-base-content/45">Reported by {report.reportedBy?.nameEnglish || report.reportedBy?.name || 'Student'} · {formatDate(report.createdAt, language)}</p></div><button type="button" className="btn btn-outline btn-sm lg:justify-self-end" onClick={() => openReview(report)}>Review report</button></article>)}</div>
        ) : <div className="p-12 text-center"><CheckCircle2 className="mx-auto text-success" size={34} /><h2 className="mt-3 font-semibold">No reports match these filters</h2><p className="mt-1 text-sm text-base-content/60">Try another filter or check back later.</p></div>}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} language={language} disabled={loading} />
      </section>

      {selected && <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="report-review-title"><div className="modal-box max-w-2xl"><div className="flex items-start justify-between gap-4"><div><span className={`badge badge-sm ${BADGES[selected.status]}`}>{STATUSES[selected.status]}</span><h2 id="report-review-title" className="mt-2 font-display text-2xl font-bold">{TYPES[selected.type]}</h2></div><button type="button" className="btn btn-circle btn-ghost btn-sm" onClick={() => setSelected(null)} aria-label="Close review"><X size={20} /></button></div><div className="mt-5 rounded-box bg-base-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-base-content/50">Reported question</p><p className="mt-2 font-semibold">{localText(selected.questionId?.question, language)}</p><div className="mt-3 flex flex-wrap gap-2"><span className="badge badge-outline">{selected.questionId?.difficulty || 'Unknown difficulty'}</span><span className="badge badge-outline">Question: {selected.questionId?.status || 'Unavailable'}</span>{selected.questionId?.isDeleted && <span className="badge badge-error">Archived</span>}</div></div><div className="mt-5"><p className="text-xs font-bold uppercase tracking-wide text-base-content/50">Student feedback</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selected.details}</p><p className="mt-2 text-xs text-base-content/50">{selected.reportedBy?.email} · {formatDate(selected.createdAt, language)}</p></div><label className="form-control mt-5"><span className="label-text mb-2 font-semibold">Resolution note</span><textarea className="textarea textarea-bordered min-h-28" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} maxLength={1000} placeholder="Document what you checked and the action taken…" /><span className="mt-1 text-right text-xs text-base-content/45">{resolutionNote.length}/1000</span></label><div className="modal-action flex-wrap">{selected.questionId?._id && <Link href={`/moderator/questions/${selected.questionId._id}/edit`} className="btn btn-ghost" target="_blank">Edit question <ExternalLink size={15} /></Link>}<button type="button" className="btn btn-outline" disabled={saving} onClick={() => updateReport('in_review')}>Mark in review</button><button type="button" className="btn btn-ghost text-error" disabled={saving} onClick={() => updateReport('dismissed')}>Dismiss</button><button type="button" className="btn btn-success" disabled={saving} onClick={() => updateReport('resolved')}>{saving && <span className="loading loading-spinner loading-xs" />} Resolve</button></div></div><button type="button" className="modal-backdrop" onClick={() => setSelected(null)} aria-label="Close report review" /></div>}
    </div>
  );
}
