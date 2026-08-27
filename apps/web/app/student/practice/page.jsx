'use client';

import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Clock3,
  Settings2,
  Sparkles,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { ListSkeleton } from '../../../components/Skeletons';
import { api } from '../../../lib/api';

const modes = [
  {
    icon: BookOpen,
    title: ['টপিক অনুশীলন', 'Topic practice'],
    detail: [
      'লক্ষ্যভিত্তিক প্রস্তুতির জন্য অধ্যায়, টপিক ও সাবটপিক বেছে নিন।',
      'Choose a chapter, topic, and subtopic for focused revision.',
    ],
    action: ['টপিক বেছে নিন', 'Choose a topic'],
    href: '/student/create-test?mode=topic',
  },
  {
    icon: BrainCircuit,
    title: ['অধ্যায় পরীক্ষা', 'Chapter test'],
    detail: [
      'নিচ থেকে একটি অধ্যায় বেছে নিয়ে ২০ প্রশ্নের পরীক্ষা শুরু করুন।',
      'Select a chapter below and start a balanced 20-question exam.',
    ],
    action: ['অধ্যায় বেছে নিন', 'Choose a chapter'],
    href: '#chapters',
  },
  {
    icon: Timer,
    title: ['দ্রুত পরীক্ষা', 'Quick test'],
    detail: [
      'প্রতি প্রশ্নে ৬০ সেকেন্ড সময় নিয়ে ১০টি এলোমেলো প্রশ্নে পরীক্ষা দিন।',
      'Jump straight into 10 random questions with 60 seconds each.',
    ],
    action: ['দ্রুত পরীক্ষা শুরু করুন', 'Start quick test'],
    href: '/student/test?mode=quick&count=10&secondsPerQuestion=60',
    featured: true,
  },
  {
    icon: Settings2,
    title: ['কাস্টম পরীক্ষা', 'Custom exam'],
    detail: [
      'প্রশ্নের উৎস, বোর্ড, বছর, কঠিনতা, সংখ্যা ও সময় নিজের মতো নির্ধারণ করুন।',
      'Control question source, board, year, difficulty, count, and time.',
    ],
    action: ['পরীক্ষা তৈরি করুন', 'Build an exam'],
    href: '/student/create-test?mode=custom',
  },
];

const copy = (language, bangla, english) => (language === 'bn' ? bangla : english);
const number = (value, language, options) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', options);

export default function Practice() {
  const { language } = useLanguage();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadChapters = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api('/chapters')
      .then((result) => setChapters(result.data || []))
      .catch(() =>
        setLoadError(
          copy(
            language,
            'অধ্যায়গুলো লোড করা যায়নি। আবার চেষ্টা করুন।',
            'Chapters could not be loaded. Please try again.'
          )
        )
      )
      .finally(() => setLoading(false));
  }, [language]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  const nameOf = (chapter) =>
    chapter.name?.[language] ||
    (language === 'bn'
      ? chapter.name?.bn || chapter.name?.en
      : chapter.name?.en || chapter.name?.bn) ||
    chapter.title ||
    copy(
      language,
      `অধ্যায় ${number(chapter.order, language)}`,
      `Chapter ${number(chapter.order, language)}`
    );
  const recommended = chapters.find((chapter) => chapter.questionCount >= 10);
  const recommendedCount = recommended ? Math.min(20, recommended.questionCount) : 10;

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <section className="soft-grid relative overflow-hidden rounded-box bg-neutral px-6 py-9 text-neutral-content md:px-10 md:py-12">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[.18em] text-emerald-100">
            <Sparkles size={13} /> {copy(language, 'অনুশীলন কেন্দ্র', 'PRACTICE CENTRE')}
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            {copy(
              language,
              'আজকের অনুশীলনই হোক পরীক্ষার আত্মবিশ্বাস।',
              "Turn today's practice into exam-day confidence."
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            {copy(
              language,
              'দ্রুত পরীক্ষা দিয়ে এখনই শুরু করুন, একটি অধ্যায়ে মনোযোগ দিন অথবা প্রয়োজন অনুযায়ী নিজের পরীক্ষা তৈরি করুন।',
              'Start instantly with a quick test, focus on one chapter, or build an exam around exactly what you need to revise.'
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="btn btn-primary"
              href="/student/test?mode=quick&count=10&secondsPerQuestion=60"
            >
              {copy(language, 'দ্রুত পরীক্ষা শুরু করুন', 'Start quick test')}{' '}
              <ArrowRight size={16} />
            </Link>
            <Link
              className="btn btn-outline border-white/30 text-white hover:border-white"
              href="/student/create-test"
            >
              {copy(language, 'কাস্টম পরীক্ষা তৈরি করুন', 'Build custom exam')}
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/60 blur-2xl" />
      </section>

      <section className="mt-10" aria-labelledby="practice-modes-heading">
        <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
          {copy(language, 'পরীক্ষার ধরন বেছে নিন', 'CHOOSE YOUR FORMAT')}
        </p>
        <h2 id="practice-modes-heading" className="mt-1 font-display text-3xl font-bold">
          {copy(language, 'আপনি কীভাবে অনুশীলন করতে চান?', 'How would you like to practice?')}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modes.map(({ icon: Icon, title, detail, action, href, featured }) => (
            <Link
              key={title[1]}
              href={href}
              className={`group card border transition duration-200 hover:-translate-y-1 hover:shadow-lg ${featured ? 'border-primary bg-primary text-primary-content' : 'border-base-300 bg-base-100 hover:border-primary'}`}
            >
              <div className="card-body p-5">
                <span
                  className={`grid size-11 place-items-center rounded-box ${featured ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}
                >
                  <Icon size={21} />
                </span>
                <div className="mt-3">
                  <h3 className="font-display text-xl font-bold">{copy(language, ...title)}</h3>
                  <p
                    className={`mt-2 text-xs leading-5 ${featured ? 'text-white/75' : 'text-base-content/60'}`}
                  >
                    {copy(language, ...detail)}
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-bold">
                  {copy(language, ...action)}{' '}
                  <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="chapters" className="mt-12 scroll-mt-6" aria-labelledby="chapters-heading">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
              {copy(language, 'অধ্যায়ভিত্তিক পরীক্ষা', 'CHAPTER EXAMS')}
            </p>
            <h2 id="chapters-heading" className="mt-1 font-display text-3xl font-bold">
              {copy(language, 'অধ্যায় থেকে পরীক্ষা শুরু করুন', 'Start from a chapter')}
            </h2>
          </div>
          <p className="text-xs text-base-content/55">
            {copy(
              language,
              'সর্বোচ্চ ২০টি প্রশ্ন · প্রতি প্রশ্নে ১ মিনিট',
              'Up to 20 questions · 1 minute per question'
            )}
          </p>
        </div>

        {loading ? (
          <ListSkeleton count={3} rowClassName="h-44" className="mt-5 grid gap-4 space-y-0 sm:grid-cols-2 lg:grid-cols-3" />
        ) : loadError ? (
          <div className="alert alert-error mt-5 text-sm" role="alert">
            <span className="flex-1">{loadError}</span>
            <button type="button" className="btn btn-sm" onClick={loadChapters}>
              {copy(language, 'আবার চেষ্টা করুন', 'Try again')}
            </button>
          </div>
        ) : chapters.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => {
              const count = Math.min(20, chapter.questionCount || 0);
              const available = count > 0;
              const content = (
                <div className="card-body gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
                      {number(chapter.order, language, { minimumIntegerDigits: 2 })}
                    </span>
                    <span
                      className={`badge badge-sm ${available ? 'badge-ghost' : 'badge-outline opacity-60'}`}
                    >
                      {number(chapter.questionCount, language)}{' '}
                      {copy(language, 'টি প্রশ্ন', 'questions')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{nameOf(chapter)}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-base-content/55">
                      <Clock3 size={13} />{' '}
                      {available
                        ? copy(
                            language,
                            `${number(count, language)} মিনিট`,
                            `${number(count, language)} minutes`
                          )
                        : copy(language, 'প্রশ্ন শিগগিরই আসছে', 'Questions coming soon')}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-primary">
                    {available
                      ? copy(language, 'অধ্যায় পরীক্ষা শুরু করুন', 'Start chapter test')
                      : copy(language, 'এখনো পাওয়া যাচ্ছে না', 'Not available yet')}
                    {available && <ArrowRight size={14} />}
                  </span>
                </div>
              );
              return available ? (
                <Link
                  key={chapter._id}
                  href={`/student/test?mode=chapter&chapterId=${chapter._id}&count=${count}&secondsPerQuestion=60`}
                  className="card border border-base-300 bg-base-100 transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={chapter._id}
                  className="card border border-base-300 bg-base-100 opacity-70"
                  aria-disabled="true"
                >
                  {content}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center">
            <BookOpen className="mx-auto text-base-content/35" />
            <h3 className="mt-3 font-bold">
              {copy(
                language,
                'এখনো কোনো অধ্যায় পরীক্ষা পাওয়া যাচ্ছে না',
                'No chapter exams are available yet'
              )}
            </h3>
            <p className="mt-1 text-sm text-base-content/55">
              {copy(
                language,
                'দ্রুত পরীক্ষা দিন অথবা প্রশ্ন প্রকাশিত হলে আবার চেষ্টা করুন।',
                'Try a quick test or return when questions are published.'
              )}
            </p>
          </div>
        )}
      </section>

      {recommended && (
        <section className="mt-10 flex flex-col gap-5 rounded-box bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.18em] text-primary">
              {copy(language, 'পরবর্তী সুপারিশ', 'RECOMMENDED NEXT')}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">
              {nameOf(recommended)} ·{' '}
              {copy(
                language,
                `${number(recommendedCount, language)} প্রশ্নের দ্রুত পরীক্ষা`,
                `${number(recommendedCount, language)}-question sprint`
              )}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              {copy(
                language,
                'পর্যাপ্ত প্রকাশিত প্রশ্নসহ একটি অধ্যায় থেকে বাছাই করা লক্ষ্যভিত্তিক পরীক্ষা।',
                'A focused exam selected from a chapter with enough published questions.'
              )}
            </p>
          </div>
          <Link
            href={`/student/test?mode=chapter&chapterId=${recommended._id}&count=${recommendedCount}&secondsPerQuestion=60`}
            className="btn btn-primary shrink-0"
          >
            {copy(language, 'পরীক্ষা শুরু করুন', 'Start exam')} <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </main>
  );
}
