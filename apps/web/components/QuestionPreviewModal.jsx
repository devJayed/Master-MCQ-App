'use client';

import { X } from 'lucide-react';
import { RichContent, Stimulus } from './RichContent';

const text = (language, bn, en) => (language === 'bn' ? bn : en);

export default function QuestionPreviewModal({ question, language, onClose }) {
  if (!question) return null;
  const isMcq = question.questionType === 0 || question.questionType === 'single_choice' || question.questionType == null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral/65 p-3 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-preview-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-2xl">
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
              {isMcq ? text(language, 'শিক্ষার্থী পরীক্ষার দৃশ্য', 'Student test view') : text(language, 'শিক্ষার্থী পাঠের দৃশ্য', 'Student study view')}
            </p>
            <h2 id="question-preview-title" className="mt-1 font-display text-xl font-bold">
              {text(language, 'মূল প্রশ্নের প্রিভিউ', 'Original question preview')}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm"
            onClick={onClose}
            aria-label={text(language, 'প্রিভিউ বন্ধ করুন', 'Close preview')}
          >
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto p-5 md:p-8">
          <Stimulus stimulus={question.stimulus} language={language} />
          <div className="font-display text-lg font-bold leading-relaxed" role="heading" aria-level={3}>
            <RichContent
              content={question.questionContent}
              fallback={question.question}
              language={language}
            />
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {(question.options || []).map((option) => (
              <div
                key={option.key}
                className="flex min-h-14 min-w-0 items-start gap-2 rounded-btn border border-base-300 px-3 py-3 text-left sm:px-4"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs">
                  {option.key}
                </span>
                <div className="min-w-0 flex-1 whitespace-normal break-words">
                  <RichContent
                    content={question.optionContent?.find((item) => item.key === option.key)?.content}
                    fallback={option.text}
                    language={language}
                  />
                </div>
              </div>
            ))}
          </div>
          {!isMcq && <div className="mt-6 rounded-box bg-base-200 p-4">
            <b className="text-sm">{text(language, 'উত্তর', 'Answer')}</b>
            <RichContent className="mt-2" content={question.answerContent} fallback={question.answer} language={language} />
          </div>}
        </div>

        <footer className="border-t border-base-300 px-5 py-3 text-xs text-base-content/55">
          {isMcq ? text(
            language,
            'সঠিক উত্তর ও ব্যাখ্যা লুকানো আছে—পরীক্ষার সময় শিক্ষার্থী যেভাবে প্রশ্নটি দেখে, এটি সেই দৃশ্য।',
            'The correct answer and explanation are hidden to match the student test experience.'
          ) : text(language, 'এটি লিখিত প্রশ্নের পাঠ ও উত্তর দৃশ্য।', 'This is the written-question study and answer view.')}
        </footer>
      </section>
    </div>
  );
}
