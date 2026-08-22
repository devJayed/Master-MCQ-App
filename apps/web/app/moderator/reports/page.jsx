import { Flag } from 'lucide-react';
const reports = [
  [
    'Ambiguous options',
    'What is the result of NAND?',
    'A student says options B and C could be correct.',
    'Open',
  ],
  [
    'Explanation needs detail',
    'Decimal conversion of 101101',
    'Please add the conversion steps for beginners.',
    'Open',
  ],
  ['Typo reported', 'HTML table attributes', '“colspan” is misspelled in option C.', 'Resolved'],
];
export default function Reports() {
  return (
    <div className="mx-auto max-w-5xl p-5 md:p-10">
      <p className="text-[10px] font-bold tracking-widest text-base-content/50">CONTENT QUALITY</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Question reports</h1>
      <p className="mt-2 text-sm text-base-content/60">
        Review student feedback and keep every question trustworthy.
      </p>
      <div className="mt-7 space-y-3">
        {reports.map(([type, question, detail, status]) => (
          <article className="card border border-base-300 bg-base-100" key={question}>
            <div className="card-body p-5 sm:flex-row sm:items-center">
              <Flag className={status === 'Open' ? 'text-error' : 'text-success'} size={21} />
              <div className="flex-1">
                <p className="text-xs font-bold text-primary">{type}</p>
                <h2 className="mt-1 font-semibold">{question}</h2>
                <p className="mt-1 text-sm text-base-content/60">{detail}</p>
              </div>
              <button className={`btn btn-sm ${status === 'Open' ? 'btn-primary' : 'btn-ghost'}`}>
                {status === 'Open' ? 'Review' : 'Resolved'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
