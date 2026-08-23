'use client';

import { BookOpen, ChevronDown, ChevronRight, Play, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useLanguage } from './LanguageProvider';

const content = {
  en: {
    eyebrow: 'HSC ICT · QUESTION MAP',
    title: 'Syllabus',
    subtitle:
      'See every available question and start an exam directly from any chapter, topic, or subtopic.',
    questions: 'questions',
    question: 'question',
    start: 'Start exam',
    none: 'No questions yet',
    empty: 'No active syllabus content is available yet.',
    error: 'The syllabus could not be loaded. Please try again.',
    retry: 'Try again',
    loading: 'Loading syllabus and question availability...',
    hint: 'Click a name to start an exam with all available questions in that section.',
  },
  bn: {
    eyebrow: 'এইচএসসি আইসিটি · প্রশ্ন মানচিত্র',
    title: 'সিলেবাস',
    subtitle:
      'প্রতিটি অধ্যায়, টপিক ও সাবটপিকের প্রশ্নসংখ্যা দেখুন এবং নামের ওপর ক্লিক করে সরাসরি পরীক্ষা শুরু করুন।',
    questions: 'টি প্রশ্ন',
    question: 'টি প্রশ্ন',
    start: 'পরীক্ষা শুরু করুন',
    none: 'এখনও প্রশ্ন নেই',
    empty: 'এখনও কোনো সক্রিয় সিলেবাস পাওয়া যায়নি।',
    error: 'সিলেবাস লোড করা যায়নি। আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন',
    loading: 'সিলেবাস ও প্রশ্নের তথ্য লোড হচ্ছে...',
    hint: 'নামের ওপর ক্লিক করলে ওই অংশের সব পাওয়া যায় এমন প্রশ্ন নিয়ে পরীক্ষা শুরু হবে।',
  },
};

const examHref = (type, item) => {
  const filter = type === 'chapter' ? 'chapterId' : type === 'topic' ? 'topicId' : 'subtopicId';
  const mode = type === 'chapter' ? 'chapter' : 'topic';
  return `/student/test?mode=${mode}&${filter}=${item._id}&count=${item.questionCount}&secondsPerQuestion=60`;
};

function CountBadge({ count, copy }) {
  return (
    <span
      className={`badge badge-sm whitespace-nowrap ${count ? 'badge-primary badge-outline' : 'badge-ghost text-base-content/40'}`}
    >
      {count ? `${count} ${count === 1 ? copy.question : copy.questions}` : copy.none}
    </span>
  );
}

function ExamName({ type, item, children, copy, className = '' }) {
  if (!item.questionCount)
    return <span className={`${className} text-base-content/55`}>{children}</span>;
  return (
    <Link
      href={examHref(type, item)}
      className={`${className} group/name rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary`}
      title={`${copy.start} · ${item.questionCount} ${copy.questions}`}
    >
      {children}
      <Play
        size={13}
        className="ml-1.5 inline fill-current opacity-0 transition group-hover/name:opacity-100 group-focus-visible/name:opacity-100"
      />
    </Link>
  );
}

export default function SyllabusTree() {
  const { language } = useLanguage();
  const copy = content[language] || content.en;
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const label = (item) => item.name?.[language] || item.name?.en || item.name?.bn || item.title;

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
        <div className="flex items-center gap-2 text-xs text-base-content/50">
          <Play size={13} className="fill-primary text-primary" /> {copy.hint}
        </div>
      </div>

      {loading ? (
        <div className="mt-7 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error mt-7">
          <span>{copy.error}</span>
          <button className="btn btn-sm" onClick={load}>
            <RefreshCw size={14} /> {copy.retry}
          </button>
        </div>
      ) : tree.length ? (
        <section className="mt-7 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
          {tree.map((chapter, chapterIndex) => (
            <article key={chapter._id} className="border-b border-base-300 last:border-0">
              <div className="flex items-center gap-2 p-3 transition hover:bg-base-200/60 sm:p-4">
                <button
                  onClick={() => toggle(chapter._id)}
                  className="btn btn-circle btn-ghost btn-sm shrink-0"
                  aria-label={expanded[chapter._id] ? 'Collapse chapter' : 'Expand chapter'}
                  aria-expanded={Boolean(expanded[chapter._id])}
                >
                  {expanded[chapter._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                  {String(chapter.order || chapterIndex + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <ExamName
                    type="chapter"
                    item={chapter}
                    copy={copy}
                    className="font-display text-lg font-bold"
                  >
                    {label(chapter)}
                  </ExamName>
                  <p className="mt-0.5 text-[11px] text-base-content/45">
                    {chapter.topics.length} topics
                  </p>
                </div>
                <CountBadge count={chapter.questionCount} copy={copy} />
              </div>

              {expanded[chapter._id] && (
                <div className="border-t border-base-300 bg-base-200/30 px-3 py-2 sm:pl-16">
                  {chapter.topics.map((topic, topicIndex) => (
                    <div key={topic._id} className="border-b border-base-300/70 last:border-0">
                      <div className="flex items-center gap-2 py-3 pr-1">
                        <button
                          onClick={() => toggle(topic._id)}
                          className="btn btn-circle btn-ghost btn-xs shrink-0"
                          aria-label={expanded[topic._id] ? 'Collapse topic' : 'Expand topic'}
                          aria-expanded={Boolean(expanded[topic._id])}
                        >
                          {expanded[topic._id] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <ExamName type="topic" item={topic} copy={copy} className="font-semibold">
                            {chapterIndex + 1}.{topicIndex + 1} {label(topic)}
                          </ExamName>
                        </div>
                        <CountBadge count={topic.questionCount} copy={copy} />
                      </div>

                      {expanded[topic._id] && (
                        <div className="mb-3 ml-6 overflow-hidden rounded-box border border-base-300 bg-base-100">
                          {topic.subtopics.length ? (
                            topic.subtopics.map((subtopic, subtopicIndex) => (
                              <div
                                key={subtopic._id}
                                className="flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-0 hover:bg-base-200/50"
                              >
                                <span className="text-xs font-bold text-primary">
                                  {chapterIndex + 1}.{topicIndex + 1}.{subtopicIndex + 1}
                                </span>
                                <ExamName
                                  type="subtopic"
                                  item={subtopic}
                                  copy={copy}
                                  className="min-w-0 flex-1 text-sm font-medium"
                                >
                                  {label(subtopic)}
                                </ExamName>
                                <CountBadge count={subtopic.questionCount} copy={copy} />
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
    </main>
  );
}
