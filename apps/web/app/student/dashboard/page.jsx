import { ArrowRight, Flame, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';
import ChapterCards from '../../../components/ChapterCards';
import { api } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let chapters = [];
  try {
    chapters = (await api('/chapters')).data;
  } catch {}
  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <section className="soft-grid relative overflow-hidden rounded-box bg-neutral px-7 py-10 text-neutral-content md:px-12">
        <div className="relative z-10 max-w-xl">
          <p className="mb-2 text-[10px] font-bold tracking-[.18em] text-emerald-100">
            HSC ICT • MONDAY, 10 AUGUST
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Ready to sharpen your <span className="text-emerald-200">ICT skills?</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Small, consistent practice turns difficult topics into your strongest chapters.
          </p>
          <Link className="btn btn-primary mt-6" href="/student/practice">
            Start today&apos;s practice <ArrowRight size={16} />
          </Link>
        </div>
        <div className="absolute -right-10 -top-12 hidden size-72 rounded-full bg-primary/70 md:block" />
        <div className="absolute bottom-7 right-8 hidden rounded-box bg-base-100 p-4 text-base-content shadow-xl md:block">
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">YOUR STREAK</p>
          <b className="font-display text-3xl">
            12 <small className="font-sans text-xs font-normal">days</small>
          </b>
          <p className="text-xs text-primary">You&apos;re doing brilliantly!</p>
        </div>
      </section>
      <div className="mt-10 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">
            BUILD MOMENTUM
          </p>
          <h2 className="font-display text-2xl font-bold">Quick practice</h2>
        </div>
        <Link className="text-xs font-bold text-primary" href="/student/practice">
          See all chapters →
        </Link>
      </div>
      <div className="mt-4">
        <ChapterCards chapters={chapters} />
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="flex justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-base-content/50">
                  YOUR PROGRESS
                </p>
                <h2 className="font-display text-2xl font-bold">This month</h2>
              </div>
              <span className="badge badge-success badge-outline">+6% from July</span>
            </div>
            <div className="mt-4 flex items-center gap-8">
              <div
                className="radial-progress text-primary"
                style={{
                  '--value': 78,
                  '--size': '8rem',
                  '--thickness': '.8rem',
                }}
                role="progressbar"
              >
                <span className="font-display text-xl font-bold">78%</span>
              </div>
              <div className="space-y-3 text-sm">
                <p>
                  <b className="text-primary">24</b> Tests completed
                </p>
                <p>
                  <b className="text-accent">480</b> Questions solved
                </p>
                <p>
                  <b className="text-warning">12</b> Day streak
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-base-content/50">
                  CURATED FOR YOU
                </p>
                <h2 className="font-display text-2xl font-bold">Jayed&apos;s picks</h2>
              </div>
              <div className="avatar placeholder">
                <div className="w-8 rounded-full bg-warning text-xs">JH</div>
              </div>
            </div>
            {[
              [Flame, 'Number System Sprint', '20 questions · 20 min'],
              [Star, 'Logic Gate Challenge', '15 questions · 15 min'],
            ].map(([Icon, title, detail]) => (
              <Link
                key={title}
                href="/student/test"
                className="flex items-center gap-3 border-b border-base-300 py-3 last:border-0"
              >
                <Icon size={20} className="text-accent" />
                <div className="flex-1">
                  <b className="block text-sm">{title}</b>
                  <small className="text-xs text-base-content/55">{detail}</small>
                </div>
                <ArrowRight size={17} className="text-primary" />
              </Link>
            ))}
            <Link
              href="/student/practice?mode=mistakes"
              className="mt-2 flex items-center gap-2 text-xs font-bold text-primary"
            >
              <RotateCcw size={14} /> Practice my 37 mistakes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
