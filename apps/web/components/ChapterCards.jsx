'use client';
import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
const fallback = [
  'ICT: World & Bangladesh',
  'Communication Systems',
  'Number System',
  'Web Design',
  'Programming',
  'Database & HTML',
];
export default function ChapterCards({ chapters = [] }) {
  const { language } = useLanguage();
  const items = chapters.length
    ? chapters
    : fallback.map((title, index) => ({ title, order: index + 1, questionCount: 18 + index * 3 }));
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((chapter, index) => (
        <Link
          key={chapter._id || index}
          href={`/student/practice?chapter=${chapter._id || index}`}
          className="card border border-base-300 bg-base-100 transition hover:-translate-y-1 hover:border-primary"
        >
          <div className="card-body gap-3 p-4">
            <span className="font-display text-xl font-bold text-primary">
              {String(chapter.order || index + 1).padStart(2, '0')}
            </span>
            <div>
              <b className="block text-xs leading-4">{chapter.name?.[language] || chapter.name?.bn || chapter.title}</b>
              <small className="text-[10px] text-base-content/50">
                {chapter.questionCount || 0} questions
              </small>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
