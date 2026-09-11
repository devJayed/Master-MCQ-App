'use client';

import {
  BookOpen,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useLanguage } from './LanguageProvider';
import SyllabusQuestionsDialog from './SyllabusQuestionsDialog';

const content = {
  en: {
    eyebrow: 'HSC ICT · QUESTION MAP',
    title: 'Syllabus',
    subtitle: 'Browse questions or choose Start exam for any chapter, topic, or subtopic.',
    questions: 'questions',
    question: 'question',
    start: 'Start exam',
    confirm: 'Do you want to start an exam?',
    cancel: 'Cancel',
    view: 'View questions',
    none: 'No questions yet',
    empty: 'No active syllabus content is available yet.',
    error: 'The syllabus could not be loaded. Please try again.',
    retry: 'Try again',
    loading: 'Loading syllabus and question availability...',
    hint: 'Click the question count to browse questions, or Start exam to confirm and begin.',
    topics: 'topics',
    topic: 'topic',
    expandChapter: 'Expand chapter',
    collapseChapter: 'Collapse chapter',
    expandTopic: 'Expand topic',
    collapseTopic: 'Collapse topic',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
  },
  bn: {
    eyebrow: 'এইচএসসি আইসিটি · প্রশ্ন মানচিত্র',
    title: 'সিলেবাস',
    subtitle:
      'প্রতিটি অধ্যায়, টপিক ও সাবটপিকের প্রশ্ন দেখুন অথবা স্টার্ট এক্সাম বাটন থেকে পরীক্ষা শুরু করুন।',
    questions: 'টি প্রশ্ন',
    question: 'টি প্রশ্ন',
    start: 'স্টার্ট এক্সাম',
    confirm: 'আপনি কি এক্সাম শুরু করতে চান?',
    cancel: 'বাতিল',
    view: 'প্রশ্ন দেখুন',
    none: 'এখনও প্রশ্ন নেই',
    empty: 'এখনও কোনো সক্রিয় সিলেবাস পাওয়া যায়নি।',
    error: 'সিলেবাস লোড করা যায়নি। আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন',
    loading: 'সিলেবাস ও প্রশ্নের তথ্য লোড হচ্ছে...',
    hint: 'প্রশ্ন দেখতে প্রশ্নসংখ্যার বাটনে অথবা পরীক্ষা শুরুর অনুমতি দিতে স্টার্ট এক্সাম বাটনে ক্লিক করুন।',
    topics: 'টি টপিক',
    topic: 'টি টপিক',
    expandChapter: 'অধ্যায় খুলুন',
    collapseChapter: 'অধ্যায় বন্ধ করুন',
    expandTopic: 'টপিক খুলুন',
    collapseTopic: 'টপিক বন্ধ করুন',
    expandAll: 'সব খুলুন',
    collapseAll: 'সব বন্ধ করুন',
  },
};

const number = (value, language, options) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', options);

const examHref = (type, item) => {
  const filter = type === 'chapter' ? 'chapterId' : type === 'topic' ? 'topicId' : 'subtopicId';
  const mode = type === 'chapter' ? 'chapter' : 'topic';
  return `/student/test?mode=${mode}&${filter}=${item._id}&count=${item.questionCount}&secondsPerQuestion=60`;
};

function SectionActions({ type, item, copy, language, label, onView, onStart }) {
  const count = item.questionCount;
  return (
    <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0">
      <button
        type="button"
        disabled={!count}
        onClick={() => onView({ type, item })}
        aria-label={`${number(count, language)} ${count === 1 ? copy.question : copy.questions} · ${copy.view}: ${label}`}
        className="btn btn-outline btn-primary btn-xs min-h-8 whitespace-nowrap"
      >
        {count
          ? `${number(count, language)} ${count === 1 ? copy.question : copy.questions}`
          : copy.none}
      </button>
      <button
        type="button"
        disabled={!count}
        onClick={() => onStart({ type, item })}
        aria-label={`${copy.start}: ${label}`}
        className="btn btn-primary btn-xs min-h-8 whitespace-nowrap"
      >
        <Play size={13} aria-hidden="true" /> {copy.start}
      </button>
    </div>
  );
}

function SectionName({ item, children, className = '' }) {
  return (
    <span className={`${className} ${!item.questionCount ? 'text-base-content/55' : ''}`}>
      {children}
    </span>
  );
}

export default function SyllabusTree() {
  const router = useRouter();
  const confirmRef = useRef(null);
  const [examSection, setExamSection] = useState(null);
  const [questionSection, setQuestionSection] = useState(null);
  const { language } = useLanguage();
  const copy = content[language] || content.en;
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = confirmRef.current;
    if (examSection && !dialog.open) dialog.showModal();
    if (!examSection && dialog.open) dialog.close();
  }, [examSection]);

  const load = () => {
    setLoading(true);
    api('/syllabus/tree')
      .then((result) => {
        setTree(result.data || []);
        setError('');
      })
      .catch((requestError) => setError(requestError.message || copy.error))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = (id) => setExpanded((current) => ({ ...current, [id]: !current[id] }));
  const label = (item) =>
    item.name?.[language] ||
    (language === 'bn' ? item.name?.bn || item.name?.en : item.name?.en || item.name?.bn) ||
    item.title ||
    '—';
  const expandAll = () =>
    setExpanded(
      Object.fromEntries(
        tree.flatMap((chapter) => [
          [chapter._id, true],
          ...(chapter.topics || []).map((topic) => [topic._id, true]),
        ])
      )
    );
  const collapseAll = () => setExpanded({});

  return (
    <main className="mx-auto max-w-5xl p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/60">{copy.subtitle}</p>
        </div>
        <div className="max-w-sm text-xs text-base-content/50">
          <p className="flex items-start gap-2">
            <Play size={13} className="mt-0.5 shrink-0 fill-primary text-primary" /> {copy.hint}
          </p>
          {!!tree.length && !loading && (
            <div className="mt-2 flex justify-end gap-1">
              <button type="button" className="btn btn-ghost btn-xs" onClick={expandAll}>
                <ChevronsUpDown size={14} />
                {copy.expandAll}
              </button>
              <button type="button" className="btn btn-ghost btn-xs" onClick={collapseAll}>
                <ChevronsDownUp size={14} />
                {copy.collapseAll}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-7 space-y-3" role="status" aria-label={copy.loading}>
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error mt-7" role="alert">
          <span>{copy.error}</span>
          <button className="btn btn-sm" onClick={load}>
            <RefreshCw size={14} /> {copy.retry}
          </button>
        </div>
      ) : tree.length ? (
        <section className="mt-7 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
          {tree.map((chapter, chapterIndex) => (
            <article key={chapter._id} className="border-b border-base-300 last:border-0">
              <div className="flex flex-wrap items-center gap-2 p-3 transition hover:bg-base-200/60 sm:p-4">
                <button
                  onClick={() => toggle(chapter._id)}
                  className="btn btn-circle btn-ghost btn-sm shrink-0"
                  aria-label={expanded[chapter._id] ? copy.collapseChapter : copy.expandChapter}
                  aria-expanded={Boolean(expanded[chapter._id])}
                >
                  {expanded[chapter._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                  {number(chapter.order || chapterIndex + 1, language, { minimumIntegerDigits: 2 })}
                </span>
                <div className="min-w-0 flex-1">
                  <SectionName item={chapter} className="font-display text-lg font-bold">
                    {label(chapter)}
                  </SectionName>
                  <p className="mt-0.5 text-[11px] text-base-content/45">
                    {number(chapter.topics.length, language)}{' '}
                    {chapter.topics.length === 1 ? copy.topic : copy.topics}
                  </p>
                </div>
                <SectionActions
                  type="chapter"
                  item={chapter}
                  label={label(chapter)}
                  copy={copy}
                  language={language}
                  onView={setQuestionSection}
                  onStart={setExamSection}
                />
              </div>

              {expanded[chapter._id] && (
                <div className="border-t border-base-300 bg-base-200/30 px-3 py-2 sm:pl-16">
                  {chapter.topics.map((topic, topicIndex) => (
                    <div key={topic._id} className="border-b border-base-300/70 last:border-0">
                      <div className="flex flex-wrap items-center gap-2 py-3 pr-1">
                        <button
                          onClick={() => toggle(topic._id)}
                          className="btn btn-circle btn-ghost btn-xs shrink-0"
                          aria-label={expanded[topic._id] ? copy.collapseTopic : copy.expandTopic}
                          aria-expanded={Boolean(expanded[topic._id])}
                        >
                          {expanded[topic._id] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <SectionName item={topic} className="font-semibold">
                            {number(chapterIndex + 1, language)}.{number(topicIndex + 1, language)}{' '}
                            {label(topic)}
                          </SectionName>
                        </div>
                        <SectionActions
                          type="topic"
                          item={topic}
                          label={label(topic)}
                          copy={copy}
                          language={language}
                          onView={setQuestionSection}
                          onStart={setExamSection}
                        />
                      </div>

                      {expanded[topic._id] && (
                        <div className="mb-3 ml-6 overflow-hidden rounded-box border border-base-300 bg-base-100">
                          {topic.subtopics.length ? (
                            topic.subtopics.map((subtopic, subtopicIndex) => (
                              <div
                                key={subtopic._id}
                                className="flex flex-wrap items-center gap-3 border-b border-base-300 px-4 py-3 last:border-0 hover:bg-base-200/50"
                              >
                                <span className="text-xs font-bold text-primary">
                                  {number(chapterIndex + 1, language)}.
                                  {number(topicIndex + 1, language)}.
                                  {number(subtopicIndex + 1, language)}
                                </span>
                                <SectionName
                                  item={subtopic}
                                  className="min-w-0 flex-1 text-sm font-medium"
                                >
                                  {label(subtopic)}
                                </SectionName>
                                <SectionActions
                                  type="subtopic"
                                  item={subtopic}
                                  label={label(subtopic)}
                                  onView={setQuestionSection}
                                  onStart={setExamSection}
                                  copy={copy}
                                  language={language}
                                />
                              </div>
                            ))
                          ) : (
                            <p className="p-4 text-xs text-base-content/45">{copy.none}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      ) : (
        <div className="mt-7 rounded-box border border-dashed border-base-300 bg-base-100 p-10 text-center">
          <BookOpen className="mx-auto text-base-content/30" />
          <p className="mt-3 text-sm text-base-content/55">{copy.empty}</p>
        </div>
      )}
      <SyllabusQuestionsDialog
        section={questionSection}
        onClose={() => setQuestionSection(null)}
        language={language}
      />
      <dialog
        ref={confirmRef}
        className="modal"
        aria-labelledby="syllabus-exam-confirm-title"
        aria-describedby="syllabus-exam-confirm-section"
        onCancel={() => setExamSection(null)}
        onClose={() => setExamSection(null)}
      >
        <div className="modal-box">
          <h2 id="syllabus-exam-confirm-title" className="text-lg font-bold">
            {copy.confirm}
          </h2>
          <p
            id="syllabus-exam-confirm-section"
            className="mt-3 break-words text-sm text-base-content/65"
          >
            {examSection ? label(examSection.item) : ''}
          </p>
          <div className="modal-action">
            <button
              type="button"
              autoFocus
              className="btn btn-ghost"
              onClick={() => setExamSection(null)}
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!examSection}
              onClick={() => {
                if (!examSection) return;
                const href = examHref(examSection.type, examSection.item);
                setExamSection(null);
                router.push(href);
              }}
            >
              <Play size={16} aria-hidden="true" />
              {copy.start}
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
