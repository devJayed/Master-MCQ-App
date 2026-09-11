'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import Pagination from './Pagination';
import { RichContent, Stimulus } from './RichContent';

const difficulties = {
  easy: ['সহজ', 'Easy'],
  medium: ['মাঝারি', 'Medium'],
  hard: ['কঠিন', 'Hard'],
};

function QuestionsDialog({ section, onClose, language }) {
  const dialog = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [result, setResult] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const bn = language === 'bn';
  const title =
    section.item.name?.[language] ||
    section.item.name?.bn ||
    section.item.name?.en ||
    section.item.title;

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const filter =
      section.type === 'chapter'
        ? 'chapterId'
        : section.type === 'topic'
          ? 'topicId'
          : 'subtopicId';
    const query = new URLSearchParams({
      [filter]: section.item._id,
      page: String(page),
      pageSize: String(pageSize),
    });
    setLoading(true);
    setError('');
    api(`/questions?${query}`, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        setResult({ data: response.data || [], total: response.pagination?.total || 0 });
        if (response.pagination?.page && response.pagination.page !== page)
          setPage(response.pagination.page);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [section.type, section.item._id, page, pageSize, retry]);

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="syllabus-questions-title"
      onCancel={onClose}
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
    >
      <div className="modal-box max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl p-0">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-base-300 bg-base-100 p-5">
          <div className="min-w-0">
            <h2
              id="syllabus-questions-title"
              className="break-words font-display text-xl font-bold"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              {bn
                ? 'প্রশ্নসমূহ, ট্যাগ ও ডিফিকালটি লেভেল'
                : 'Questions, tags, and difficulty levels'}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            className="btn btn-circle btn-ghost btn-sm shrink-0"
            aria-label={bn ? 'বন্ধ করুন' : 'Close'}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="space-y-4 p-5" aria-busy={loading}>
          {loading ? (
            <p role="status" className="py-8 text-center">
              {bn ? 'প্রশ্ন লোড হচ্ছে…' : 'Loading questions…'}
            </p>
          ) : error ? (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setRetry((value) => value + 1)}
              >
                {bn ? 'আবার চেষ্টা করুন' : 'Try again'}
              </button>
            </div>
          ) : result.data.length ? (
            result.data.map((question, index) => (
              <article key={question._id} className="rounded-box border border-base-300 p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="badge badge-outline">
                    {bn ? 'ডিফিকালটি' : 'Difficulty'}:{' '}
                    {difficulties[question.difficulty]?.[bn ? 0 : 1] || question.difficulty}
                  </span>
                  {(question.tags || []).map((tag, tagIndex) => (
                    <span
                      key={`${tag}-${tagIndex}`}
                      className="badge badge-ghost h-auto max-w-full whitespace-normal break-words"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Stimulus stimulus={question.stimulus} language={language} />
                <div className="flex gap-2 font-semibold">
                  <span>
                    {((page - 1) * pageSize + index + 1).toLocaleString(bn ? 'bn-BD' : 'en-US')}.
                  </span>
                  <RichContent
                    className="min-w-0 flex-1"
                    content={question.questionContent}
                    fallback={question.question}
                    language={language}
                  />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['A', 'B', 'C', 'D'].map((key) => (
                    <div
                      key={key}
                      className="flex min-w-0 gap-2 rounded-lg bg-base-200 p-3 text-sm"
                    >
                      <b>{key}.</b>
                      <RichContent
                        className="min-w-0 flex-1"
                        content={
                          question.optionContent?.find((option) => option.key === key)?.content
                        }
                        fallback={question.options?.find((option) => option.key === key)?.text}
                        language={language}
                      />
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <p className="py-8 text-center text-base-content/60">
              {bn ? 'কোনো প্রকাশিত প্রশ্ন পাওয়া যায়নি।' : 'No published questions found.'}
            </p>
          )}
        </div>
        {!error && result.total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={result.total}
            language={language}
            disabled={loading}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label={bn ? 'বন্ধ করুন' : 'Close'}>{bn ? 'বন্ধ করুন' : 'Close'}</button>
      </form>
    </dialog>
  );
}

export default function SyllabusQuestionsDialog(props) {
  if (!props.section) return null;
  return <QuestionsDialog key={`${props.section.type}-${props.section.item._id}`} {...props} />;
}
