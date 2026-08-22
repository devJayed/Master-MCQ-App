import { BookOpen, CheckCircle2, Clock3, FilePlus2, FileQuestion, Flag } from 'lucide-react';
import Link from 'next/link';

const stats = [
  ['Total questions', '2,450', FileQuestion, 'text-primary'],
  ['Published', '2,180', CheckCircle2, 'text-success'],
  ['Awaiting review', '86', Clock3, 'text-warning'],
  ['Open reports', '7', Flag, 'text-error'],
];
const activity = [
  ['Which gate is known as the universal gate?', 'Logic Gates', 'Edited 12 min ago', 'Review'],
  ['Convert (110101)₂ to decimal', 'Number System', 'Added 37 min ago', 'Publish'],
  ['Which HTML property makes a table border?', 'Web Design', 'Reported 1 hr ago', 'Review'],
];
export default function ModeratorDashboard() {
  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">
            CONTENT OPERATIONS
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">Moderator dashboard</h1>
          <p className="mt-2 text-sm text-base-content/60">
            Keep the HSC ICT question bank accurate, clear, and ready for students.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/moderator/syllabus" className="btn btn-outline border-base-300">
            <BookOpen size={17} /> Syllabus config
          </Link>
          <Link href="/moderator/questions/create" className="btn btn-primary">
            <FilePlus2 size={17} /> Add a question
          </Link>
        </div>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon, color]) => (
          <div className="card border border-base-300 bg-base-100" key={label}>
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-base-content/60">{label}</p>
                <Icon className={color} size={20} />
              </div>
              <b className="mt-1 font-display text-3xl">{value}</b>
            </div>
          </div>
        ))}
      </section>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-base-content/50">
                  NEEDS ATTENTION
                </p>
                <h2 className="font-display text-2xl font-bold">Question activity</h2>
              </div>
              <Link href="/moderator/questions" className="text-xs font-bold text-primary">
                View question bank →
              </Link>
            </div>
            <div className="mt-3 divide-y divide-base-300">
              {activity.map(([question, topic, time, action]) => (
                <div
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                  key={question}
                >
                  <div className="flex-1">
                    <b className="block text-sm">{question}</b>
                    <small className="text-xs text-base-content/55">
                      {topic} · {time}
                    </small>
                  </div>
                  <button
                    className={`btn btn-sm ${action === 'Publish' ? 'btn-primary' : 'btn-outline border-base-300'}`}
                  >
                    {action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card bg-neutral text-neutral-content">
          <div className="card-body">
            <p className="text-[10px] font-bold tracking-widest text-emerald-100">
              QUALITY SNAPSHOT
            </p>
            <h2 className="font-display text-2xl font-bold">This week</h2>
            <div className="mt-3 space-y-4 border-y border-white/15 py-5 text-sm">
              <p className="flex justify-between">
                <span>Questions reviewed</span>
                <b>142</b>
              </p>
              <p className="flex justify-between">
                <span>Published after review</span>
                <b>96%</b>
              </p>
              <p className="flex justify-between">
                <span>Average review time</span>
                <b>8 min</b>
              </p>
            </div>
            <Link href="/moderator/reports" className="btn btn-secondary mt-2 border-0">
              Resolve reports
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
