'use client';

import { Archive, FilePlus2, FileSpreadsheet, Filter, RotateCcw, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Pagination from '../../../components/Pagination';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

const text = (language, bangla, english) => (language === 'bn' ? bangla : english);
const number = (value, language) => Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
const labels = {
  draft: ['খসড়া', 'Draft'],
  published: ['প্রকাশিত', 'Published'],
  archived: ['আর্কাইভ করা', 'Archived'],
  easy: ['সহজ', 'Easy'],
  medium: ['মাঝারি', 'Medium'],
  hard: ['কঠিন', 'Hard'],
};

export default function TeacherQuestions() {
  const { language } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [status, setStatus] = useState('');
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [summary, setSummary] = useState({ total: 0, draft: 0, published: 0, archived: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const localName = (item) => item?.name?.[language] || (language === 'bn' ? item?.name?.bn || item?.name?.en : item?.name?.en || item?.name?.bn) || '—';
  const localQuestion = (question) => question?.question?.[language] || (language === 'bn' ? question?.question?.bn || question?.question?.en : question?.question?.en || question?.question?.bn) || text(language, 'প্রশ্ন পাওয়া যায়নি', 'Question unavailable');
  const label = (value) => text(language, ...(labels[value] || [value, value]));

  const loadQuestions = useCallback(async () => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (chapterId) query.set('chapterId', chapterId);
    if (topicId) query.set('topicId', topicId);
    if (status && !archived) query.set('status', status);
    if (search.trim()) query.set('search', search.trim());
    if (archived) query.set('archived', 'true');
    setLoading(true);
    try {
      const result = await api(`/questions/manage?${query}`);
      setQuestions(result.data || []);
      setSummary(result.summary || {});
      setTotal(result.pagination?.total || 0);
      if (result.pagination?.page && result.pagination.page !== page) setPage(result.pagination.page);
      setError('');
    } catch (requestError) {
      setError(requestError.message || text(language, 'প্রশ্নগুলো লোড করা যায়নি।', 'Questions could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [archived, chapterId, language, page, pageSize, search, status, topicId]);

  useEffect(() => { api('/chapters').then((result) => setChapters(result.data || [])).catch((requestError) => setError(requestError.message)); }, []);
  useEffect(() => {
    setTopicId('');
    if (!chapterId) return setTopics([]);
    api(`/topics?chapterId=${chapterId}`).then((result) => setTopics(result.data || [])).catch((requestError) => setError(requestError.message));
  }, [chapterId]);
  useEffect(() => { loadQuestions(); }, [loadQuestions]);
  useEffect(() => { setPage(1); }, [archived, chapterId, pageSize, search, status, topicId]);

  const archiveQuestion = async (id) => {
    if (!window.confirm(text(language, 'প্রশ্নটি আর্কাইভ করবেন? এটি শিক্ষার্থীদের কাছে আর দেখা যাবে না, তবে পরে পুনরুদ্ধার করা যাবে।', 'Archive this question? Students will no longer see it, but it can be restored later.'))) return;
    try {
      const result = await api(`/questions/${id}`, { method: 'DELETE' });
      setNotice(result.message || text(language, 'প্রশ্নটি আর্কাইভ করা হয়েছে।', 'Question archived.'));
      loadQuestions();
    } catch (requestError) { setError(requestError.message); }
  };
  const restoreQuestion = async (id) => {
    try {
      const result = await api(`/questions/${id}/restore`, { method: 'PATCH' });
      setNotice(result.message || text(language, 'প্রশ্নটি খসড়া হিসেবে পুনরুদ্ধার করা হয়েছে।', 'Question restored as a draft.'));
      loadQuestions();
    } catch (requestError) { setError(requestError.message); }
  };

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">{text(language, 'কনটেন্ট নিয়ন্ত্রণকেন্দ্র', 'CONTENT CONTROL CENTER')}</p><h1 className="mt-2 font-display text-4xl font-bold">{text(language, 'প্রশ্নভাণ্ডার', 'Question bank')}</h1><p className="mt-2 max-w-2xl text-sm text-base-content/60">{text(language, 'প্রশ্ন তৈরি, প্রকাশ, পর্যালোচনা, আর্কাইভ ও পুনরুদ্ধার করুন। সব পরিবর্তন নিরাপদ ও পুনরুদ্ধারযোগ্য রাখা হয়েছে।', 'Create, publish, review, archive, and restore questions. Destructive actions remain safe and recoverable.')}</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/teacher/questions/import" className="btn btn-outline"><FileSpreadsheet size={17} />{text(language, 'ইমপোর্ট', 'Import')}</Link><Link href="/teacher/questions/create" className="btn btn-primary"><FilePlus2 size={17} />{text(language, 'প্রশ্ন যোগ করুন', 'Add question')}</Link></div>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        [text(language, 'বর্তমান মোট', 'Current total'), summary.total],
        [text(language, 'প্রকাশিত', 'Published'), summary.published],
        [text(language, 'খসড়া', 'Drafts'), summary.draft],
        [archived ? text(language, 'আর্কাইভে', 'In archive') : text(language, 'দেখানো হচ্ছে', 'Showing'), total],
      ].map(([title, value]) => <article className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm" key={title}><p className="text-xs text-base-content/55">{title}</p><b className="mt-2 block font-display text-3xl">{number(value, language)}</b></article>)}</section>

      <section className="mt-5 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><label className="input input-bordered flex items-center gap-2"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="grow" placeholder={text(language, 'প্রশ্ন বা ট্যাগ খুঁজুন', 'Search questions or tags')} /></label><select value={chapterId} onChange={(event) => setChapterId(event.target.value)} className="select select-bordered"><option value="">{text(language, 'সব অধ্যায়', 'All chapters')}</option>{chapters.map((chapter) => <option value={chapter._id} key={chapter._id}>{localName(chapter)}</option>)}</select><select value={topicId} disabled={!chapterId} onChange={(event) => setTopicId(event.target.value)} className="select select-bordered"><option value="">{text(language, 'সব টপিক', 'All topics')}</option>{topics.map((topic) => <option value={topic._id} key={topic._id}>{localName(topic)}</option>)}</select><select value={status} disabled={archived} onChange={(event) => setStatus(event.target.value)} className="select select-bordered"><option value="">{text(language, 'সব অবস্থা', 'All statuses')}</option><option value="published">{label('published')}</option><option value="draft">{label('draft')}</option></select><button type="button" onClick={() => { setArchived((value) => !value); setStatus(''); }} className={`btn ${archived ? 'btn-primary' : 'btn-outline'}`}><Archive size={16} />{archived ? text(language, 'সক্রিয় প্রশ্ন দেখুন', 'View active') : text(language, 'আর্কাইভ দেখুন', 'View archive')}</button></div><p className="mt-3 flex items-center gap-2 text-xs text-base-content/45"><Filter size={14} />{text(language, `${number(total, language)}টি ফলাফল পাওয়া গেছে`, `${number(total, language)} results found`)}</p></section>

      {error && <div className="alert alert-error mt-4"><span>{error}</span></div>}{notice && <div className="alert alert-success mt-4"><span>{notice}</span></div>}
      <section className="mt-5 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm"><div className="overflow-x-auto"><table className="table"><thead><tr><th>{text(language, 'প্রশ্ন', 'Question')}</th><th>{text(language, 'অধ্যায় / টপিক', 'Chapter / topic')}</th><th>{text(language, 'কঠিনতা', 'Difficulty')}</th><th>{text(language, 'অবস্থা', 'Status')}</th><th className="text-right">{text(language, 'কার্যক্রম', 'Actions')}</th></tr></thead><tbody>{questions.map((question) => <tr key={question._id}><td><b className="block max-w-md text-sm">{localQuestion(question)}</b></td><td className="text-xs"><span>{localName(question.chapterId)}</span><br/><span className="text-base-content/50">{localName(question.topicId)}{question.subtopicId ? ` / ${localName(question.subtopicId)}` : ''}</span></td><td><span className="badge badge-ghost">{label(question.difficulty)}</span></td><td><span className={`badge ${question.status === 'published' ? 'badge-success' : question.status === 'draft' ? 'badge-warning' : 'badge-ghost'}`}>{label(question.status)}</span></td><td><div className="flex justify-end gap-2">{archived ? <button className="btn btn-outline btn-sm" onClick={() => restoreQuestion(question._id)}><RotateCcw size={14}/>{text(language, 'পুনরুদ্ধার', 'Restore')}</button> : <><Link href={`/teacher/questions/${question._id}/edit`} className="btn btn-ghost btn-sm">{text(language, 'সম্পাদনা', 'Edit')}</Link><button className="btn btn-ghost btn-sm text-error" onClick={() => archiveQuestion(question._id)} title={text(language, 'প্রশ্ন আর্কাইভ করুন', 'Archive question')} aria-label={text(language, 'প্রশ্ন আর্কাইভ করুন', 'Archive question')}><Trash2 size={14}/></button></>}</div></td></tr>)}{!loading && !questions.length && <tr><td colSpan="5" className="py-12 text-center text-base-content/55">{text(language, 'কোনো প্রশ্ন পাওয়া যায়নি।', 'No questions found.')}</td></tr>}</tbody></table></div>{loading && <p className="border-t border-base-300 p-6 text-center text-sm text-base-content/60">{text(language, 'প্রশ্ন লোড হচ্ছে…', 'Loading questions…')}</p>}<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} language={language} disabled={loading} /></section>
    </main>
  );
}
