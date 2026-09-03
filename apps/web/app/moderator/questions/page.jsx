'use client';

import {
  Archive,
  FilePlus2,
  FileSpreadsheet,
  Filter,
  Eye,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import Pagination from '../../../components/Pagination';
import { TableRowsSkeleton } from '../../../components/Skeletons';
import QuestionPreviewModal from '../../../components/QuestionPreviewModal';
import { RichContent } from '../../../components/RichContent';
import { api } from '../../../lib/api';

const text = (language, bn, en) => (language === 'bn' ? bn : en);
const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
const LABELS = {
  draft: ['খসড়া', 'Draft'],
  published: ['প্রকাশিত', 'Published'],
  archived: ['আর্কাইভ করা', 'Archived'],
  easy: ['সহজ', 'Easy'],
  medium: ['মাঝারি', 'Medium'],
  hard: ['কঠিন', 'Hard'],
};

export default function ModeratorQuestions() {
  const { language } = useLanguage();
  const [questions, setQuestions] = useState([]),
    [chapters, setChapters] = useState([]),
    [topics, setTopics] = useState([]);
  const [chapterId, setChapterId] = useState(''),
    [topicId, setTopicId] = useState(''),
    [status, setStatus] = useState(''),
    [archived, setArchived] = useState(false),
    [search, setSearch] = useState('');
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [summary, setSummary] = useState({}),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const local = (value, fallback) =>
    value?.[language] ||
    (language === 'bn' ? value?.bn || value?.en : value?.en || value?.bn) ||
    fallback;
  const name = (item) => local(item?.name, '—');
  const label = (value) => text(language, ...(LABELS[value] || [value, value]));

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
      if (result.pagination?.page && result.pagination.page !== page)
        setPage(result.pagination.page);
      setError('');
    } catch (requestError) {
      setError(
        requestError.message ||
          text(language, 'প্রশ্নগুলো লোড করা যায়নি।', 'Questions could not be loaded.')
      );
    } finally {
      setLoading(false);
    }
  }, [archived, chapterId, language, page, pageSize, search, status, topicId]);

  useEffect(() => {
    api('/chapters')
      .then((result) => setChapters(result.data || []))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setTopicId('');
    if (!chapterId) return setTopics([]);
    api(`/topics?chapterId=${chapterId}`)
      .then((result) => setTopics(result.data || []))
      .catch((e) => setError(e.message));
  }, [chapterId]);
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);
  useEffect(() => {
    setPage(1);
  }, [archived, chapterId, pageSize, search, status, topicId]);

  const archiveQuestion = async (id) => {
    if (
      !window.confirm(
        text(
          language,
          'প্রশ্নটি আর্কাইভ করবেন? শিক্ষার্থীরা এটি আর দেখতে পাবে না, তবে পরে পুনরুদ্ধার করা যাবে।',
          'Archive this question? Students will no longer see it, but it can be restored later.'
        )
      )
    )
      return;
    try {
      const result = await api(`/questions/${id}`, { method: 'DELETE' });
      setNotice(
        result?.message || text(language, 'প্রশ্নটি আর্কাইভ করা হয়েছে।', 'Question archived.')
      );
      setError('');
      await loadQuestions();
    } catch (e) {
      setError(e.message);
    }
  };
  const restoreQuestion = async (id) => {
    try {
      const result = await api(`/questions/${id}/restore`, { method: 'PATCH' });
      setNotice(
        result?.message ||
          text(
            language,
            'প্রশ্নটি খসড়া হিসেবে পুনরুদ্ধার করা হয়েছে।',
            'Question restored as a draft.'
          )
      );
      setError('');
      await loadQuestions();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {text(language, 'কনটেন্ট লাইব্রেরি', 'CONTENT LIBRARY')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {text(language, 'প্রশ্নভাণ্ডার', 'Question bank')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-base-content/60">
            {text(
              language,
              'প্রশ্ন খুঁজুন, পর্যালোচনা করুন এবং প্রকাশনার অবস্থা পরিচালনা করুন। আর্কাইভ করা প্রশ্নও পুনরুদ্ধার করা যাবে।',
              'Find, review, and manage questions. Archived questions remain recoverable.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/moderator/questions/import" className="btn btn-outline">
            <FileSpreadsheet size={17} />
            {text(language, 'ইমপোর্ট', 'Import')}
          </Link>
          <Link href="/moderator/questions/create" className="btn btn-primary">
            <FilePlus2 size={17} />
            {text(language, 'প্রশ্ন যোগ করুন', 'Add question')}
          </Link>
        </div>
      </header>
      <section
        className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label={text(language, 'প্রশ্নের সারসংক্ষেপ', 'Question summary')}
      >
        {[
          [text(language, 'বর্তমান মোট', 'Current total'), summary.total],
          [text(language, 'প্রকাশিত', 'Published'), summary.published],
          [text(language, 'খসড়া', 'Drafts'), summary.draft],
          [
            archived
              ? text(language, 'আর্কাইভে', 'In archive')
              : text(language, 'ফিল্টারে পাওয়া গেছে', 'Matching filters'),
            total,
          ],
        ].map(([title, value]) => (
          <article
            className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"
            key={title}
          >
            <p className="text-xs text-base-content/55">{title}</p>
            <b className="mt-2 block font-display text-3xl">{number(value, language)}</b>
          </article>
        ))}
      </section>
      <section className="mt-5 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="input input-bordered flex items-center gap-2">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="grow"
              placeholder={text(language, 'প্রশ্ন বা ট্যাগ খুঁজুন', 'Search questions or tags')}
              aria-label={text(language, 'প্রশ্ন খুঁজুন', 'Search questions')}
            />
          </label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="select select-bordered"
            aria-label={text(language, 'অধ্যায়', 'Chapter')}
          >
            <option value="">{text(language, 'সব অধ্যায়', 'All chapters')}</option>
            {chapters.map((item) => (
              <option key={item._id} value={item._id}>
                {name(item)}
              </option>
            ))}
          </select>
          <select
            value={topicId}
            disabled={!chapterId}
            onChange={(e) => setTopicId(e.target.value)}
            className="select select-bordered"
            aria-label={text(language, 'টপিক', 'Topic')}
          >
            <option value="">{text(language, 'সব টপিক', 'All topics')}</option>
            {topics.map((item) => (
              <option key={item._id} value={item._id}>
                {name(item)}
              </option>
            ))}
          </select>
          <select
            value={status}
            disabled={archived}
            onChange={(e) => setStatus(e.target.value)}
            className="select select-bordered"
            aria-label={text(language, 'অবস্থা', 'Status')}
          >
            <option value="">{text(language, 'সব অবস্থা', 'All statuses')}</option>
            <option value="published">{label('published')}</option>
            <option value="draft">{label('draft')}</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setArchived((value) => !value);
              setStatus('');
            }}
            className={`btn ${archived ? 'btn-primary' : 'btn-outline'}`}
          >
            <Archive size={16} />
            {archived
              ? text(language, 'সক্রিয় প্রশ্ন দেখুন', 'View active')
              : text(language, 'আর্কাইভ দেখুন', 'View archive')}
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-base-content/45">
          <Filter size={14} />
          {text(
            language,
            `${number(total, language)}টি ফলাফল পাওয়া গেছে`,
            `${number(total, language)} results found`
          )}
        </p>
      </section>
      {error && (
        <div className="alert alert-error mt-4" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="alert alert-success mt-4" role="status">
          {notice}
        </div>
      )}
      <section className="mt-5 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{text(language, 'প্রশ্ন', 'Question')}</th>
                <th>{text(language, 'অধ্যায় / টপিক', 'Chapter / topic')}</th>
                <th>{text(language, 'কঠিনতা', 'Difficulty')}</th>
                <th>{text(language, 'অবস্থা', 'Status')}</th>
                <th className="text-right">{text(language, 'কার্যক্রম', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <TableRowsSkeleton rows={pageSize > 5 ? 5 : pageSize} /> : questions.map((q) => (
                <tr key={q._id}>
                  <td>
                    <RichContent
                      content={q.questionContent}
                      fallback={q.question}
                      language={language}
                      className="max-w-md text-sm font-semibold"
                    />
                  </td>
                  <td className="text-xs">
                    {name(q.chapterId)}
                    <br />
                    <span className="text-base-content/50">
                      {name(q.topicId)}
                      {q.subtopicId ? ` / ${name(q.subtopicId)}` : ''}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-ghost">{label(q.difficulty)}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${q.status === 'published' ? 'badge-success' : q.status === 'draft' ? 'badge-warning' : 'badge-ghost'}`}
                    >
                      {label(q.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPreviewQuestion(q)}
                        title={text(language, 'মূল প্রশ্নের প্রিভিউ', 'Preview original question')}
                        aria-label={text(language, 'মূল প্রশ্নের প্রিভিউ', 'Preview original question')}
                      >
                        <Eye size={16} />
                      </button>
                      {archived ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => restoreQuestion(q._id)}
                        >
                          <RotateCcw size={14} />
                          {text(language, 'পুনরুদ্ধার', 'Restore')}
                        </button>
                      ) : (
                        <>
                          <Link
                            href={`/moderator/questions/${q._id}/edit`}
                            className="btn btn-ghost btn-sm"
                            title={text(language, 'প্রশ্ন সম্পাদনা করুন', 'Edit question')}
                            aria-label={text(language, 'প্রশ্ন সম্পাদনা করুন', 'Edit question')}
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => archiveQuestion(q._id)}
                            className="btn btn-ghost btn-sm text-error"
                            aria-label={text(language, 'প্রশ্ন আর্কাইভ করুন', 'Archive question')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !questions.length && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-base-content/60">
                    {archived
                      ? text(
                          language,
                          'আর্কাইভে কোনো প্রশ্ন পাওয়া যায়নি।',
                          'No archived questions found.'
                        )
                      : text(language, 'কোনো প্রশ্ন পাওয়া যায়নি।', 'No questions found.')}
                  </td>
                </tr>
              )}
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
      </section>
      <QuestionPreviewModal question={previewQuestion} language={language} onClose={() => setPreviewQuestion(null)} />
    </main>
  );
}
