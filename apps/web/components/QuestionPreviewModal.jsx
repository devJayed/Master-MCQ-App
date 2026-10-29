'use client';

import { BookOpen, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { RichContent, Stimulus, localBlocks, localValue } from './RichContent';

const text = (language, bn, en) => (language === 'bn' ? bn : en);

export default function QuestionPreviewModal({ question, language, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const isOpen = Boolean(question);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll('button, [href], [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  if (!question) return null;
  const isMcq =
    question.questionType === 0 ||
    question.questionType === 'single_choice' ||
    question.questionType == null;
  const hasExplanation =
    localBlocks(question.explanationContent, language).length ||
    localValue(question.explanation, language).trim();
  const hasAnswer =
    localBlocks(question.answerContent, language).length ||
    localValue(question.answer, language).trim();

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 grid place-items-center bg-neutral/65 p-3 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-preview-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-base-300 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
              {text(language, 'প্রশ্ন পর্যালোচনা', 'Question review')}
            </p>
            <h2 id="question-preview-title" className="mt-1 font-display text-xl font-bold">
              {text(language, 'প্রশ্ন, উত্তর ও ব্যাখ্যা', 'Question, answer & explanation')}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm shrink-0"
            onClick={onClose}
            aria-label={text(language, 'প্রিভিউ বন্ধ করুন', 'Close preview')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div
          className="overflow-y-auto p-5 md:p-8"
          tabIndex={0}
          aria-label={text(language, 'প্রশ্নের বিস্তারিত', 'Question details')}
        >
          <Stimulus stimulus={question.stimulus} language={language} />
          <div
            className="font-display text-lg font-bold leading-relaxed"
            role="heading"
            aria-level={3}
          >
            <RichContent
              content={question.questionContent}
              fallback={question.question}
              language={language}
            />
          </div>
          {isMcq && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {(question.options || []).map((option) => {
                const isCorrect = option.key === question.correctAnswer;
                return (
                  <div
                    key={option.key}
                    className={
                      'flex min-h-14 min-w-0 items-start gap-3 rounded-btn border px-3 py-3 text-left sm:px-4 ' +
                      (isCorrect ? 'border-success/50 bg-success/10' : 'border-base-300')
                    }
                  >
                    <span
                      className={
                        'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ' +
                        (isCorrect
                          ? 'border-success bg-success text-success-content'
                          : 'border-base-300 bg-base-200')
                      }
                    >
                      {option.key}
                    </span>
                    <div className="min-w-0 flex-1 whitespace-normal break-words">
                      <RichContent
                        content={
                          question.optionContent?.find((item) => item.key === option.key)?.content
                        }
                        fallback={option.text}
                        language={language}
                      />
                      {isCorrect && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                          <CheckCircle2
                            size={14}
                            className="shrink-0 text-success"
                            aria-hidden="true"
                          />
                          {text(language, 'সঠিক উত্তর', 'Correct answer')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isMcq && !question.options?.some((option) => option.key === question.correctAnswer) && (
            <p className="mt-4 text-sm text-base-content/60">
              {text(language, 'সঠিক উত্তর দেওয়া হয়নি।', 'No correct answer provided.')}
            </p>
          )}
          {!isMcq && (
            <section className="mt-6 rounded-box border border-success/30 bg-success/5 p-4 md:p-5">
              <h3 className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
                {text(language, 'উত্তর', 'Answer')}
              </h3>
              {hasAnswer ? (
                <RichContent
                  className="mt-3 block whitespace-pre-wrap leading-relaxed"
                  content={question.answerContent}
                  fallback={question.answer}
                  language={language}
                />
              ) : (
                <p className="mt-3 text-sm text-base-content/60">
                  {text(language, 'উত্তর দেওয়া হয়নি।', 'No answer provided.')}
                </p>
              )}
            </section>
          )}
          <section className="mt-6 rounded-box border border-primary/20 bg-primary/5 p-4 md:p-5">
            <h3 className="flex items-center gap-2 font-bold">
              <BookOpen size={18} className="text-primary" aria-hidden="true" />
              {text(language, 'ব্যাখ্যা', 'Explanation')}
            </h3>
            {hasExplanation ? (
              <RichContent
                className="mt-3 block whitespace-pre-wrap leading-relaxed"
                content={question.explanationContent}
                fallback={question.explanation}
                language={language}
              />
            ) : (
              <p className="mt-3 text-sm text-base-content/60">
                {text(
                  language,
                  'এই প্রশ্নের ব্যাখ্যা দেওয়া হয়নি।',
                  'No explanation has been provided for this question.'
                )}
              </p>
            )}
          </section>
        </div>
        <footer className="flex justify-end border-t border-base-300 px-5 py-3">
          <button type="button" className="btn btn-sm btn-outline" onClick={onClose}>
            {text(language, 'বন্ধ করুন', 'Close')}
          </button>
        </footer>
      </section>
    </div>
  );
}
