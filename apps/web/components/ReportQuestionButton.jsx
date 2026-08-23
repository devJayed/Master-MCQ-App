'use client';

import { Flag, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';

export default function ReportQuestionButton({ questionId, attemptId, questionText }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('incorrect_answer');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api('/reports', { method: 'POST', body: JSON.stringify({ questionId, attemptId, type, details }) });
      setMessage(result.message);
      setDetails('');
      setError('');
      setOpen(false);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  return <>
    <div className="flex items-center gap-2"><button type="button" className="btn btn-ghost btn-sm text-base-content/60" onClick={() => { setOpen(true); setError(''); }}><Flag size={15} /> Report issue</button>{message && <span className="text-xs text-success">Report submitted</span>}</div>
    {open && <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby={`report-${questionId}`}><form className="modal-box" onSubmit={submit}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Quality feedback</p><h2 id={`report-${questionId}`} className="mt-1 font-display text-2xl font-bold">Report a question</h2></div><button type="button" className="btn btn-circle btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close report form"><X size={19} /></button></div><p className="mt-4 rounded-box bg-base-200 p-3 text-sm font-medium">{questionText}</p>{error && <div className="alert alert-error mt-4 py-3 text-sm">{error}</div>}<label className="form-control mt-4"><span className="label-text mb-2 font-semibold">What is wrong?</span><select className="select select-bordered" value={type} onChange={(event) => setType(event.target.value)}><option value="incorrect_answer">Incorrect answer</option><option value="ambiguous_options">Ambiguous options</option><option value="typo">Typo or formatting</option><option value="explanation">Explanation needs work</option><option value="other">Other issue</option></select></label><label className="form-control mt-4"><span className="label-text mb-2 font-semibold">Details</span><textarea required minLength={10} maxLength={1000} className="textarea textarea-bordered min-h-32" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe the issue clearly so a moderator can verify it…" /><span className="mt-1 text-right text-xs text-base-content/45">{details.length}/1000</span></label><div className="modal-action"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy || details.trim().length < 10}>{busy && <span className="loading loading-spinner loading-xs" />} Submit report</button></div></form><button type="button" className="modal-backdrop" onClick={() => setOpen(false)} aria-label="Close report form" /></div>}
  </>;
}
