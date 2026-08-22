import { ArrowRight, BookOpen, BrainCircuit, RotateCcw, Timer } from 'lucide-react';
import Link from 'next/link';
import ChapterCards from '../../../components/ChapterCards';
import { api } from '../../../lib/api';

export const dynamic = 'force-dynamic';

const modes = [
  [BookOpen, 'Topic practice', 'Master one topic at a time'],
  [BrainCircuit, 'Chapter test', 'Measure chapter-level progress'],
  [Timer, 'Quick test', '10 random MCQs · 10 minutes'],
  [RotateCcw, 'Practice mistakes', 'Turn past errors into strengths'],
];
export default async function Practice() {
  let chapters = [];
  try {
    chapters = (await api('/chapters')).data;
  } catch {}
  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <p className="text-[10px] font-bold tracking-widest text-base-content/50">FIND YOUR FOCUS</p>
      <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
        What would you like
        <br />
        to practice today?
      </h1>
      <p className="mt-3 text-sm text-base-content/60">
        Choose a guided mode, or build a test that fits your study plan.
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {modes.map(([Icon, title, detail]) => (
          <Link
            key={title}
            href="/student/test"
            className="card border border-base-300 bg-base-100 transition hover:border-primary hover:shadow-md"
          >
            <div className="card-body p-5">
              <Icon className="mb-3 text-primary" />
              <b>{title}</b>
              <small className="text-xs text-base-content/55">{detail}</small>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-7">
        <h2 className="font-display text-2xl font-bold">Choose a chapter</h2>
        <div className="mt-4">
          <ChapterCards chapters={chapters} />
        </div>
      </div>
      <div className="mt-7 flex items-center justify-between rounded-box bg-secondary p-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary">TODAY&apos;S SUGGESTION</p>
          <h3 className="font-display text-xl font-bold">Number System: a 20-question sprint</h3>
          <p className="mt-1 text-sm text-base-content/60">
            A focused warm-up before you tackle a full chapter test.
          </p>
        </div>
        <Link href="/student/test" className="btn btn-primary btn-sm">
          Start <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
