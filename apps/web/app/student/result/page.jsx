'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import ReportQuestionButton from '../../../components/ReportQuestionButton';
import { api } from '../../../lib/api';

const localText = (value, language) => value?.[language] || value?.bn || value?.en || '';

function ResultContent() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [attempt, setAttempt] = useState(null);
  const [openExplanations, setOpenExplanations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const attemptId = searchParams.get('attemptId');
    if (!attemptId) {
      setError(language === 'bn' ? 'এই পরীক্ষার ফলাফল পাওয়া যায়নি।' : 'This test result could not be found.');
      setLoading(false);
      return;
    }
    api(`/attempts/${attemptId}`)
      .then((result) => setAttempt(result.data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [language, searchParams]);

  if (loading) return <div className="p-10 text-center text-sm">{language === 'bn' ? 'ফলাফল লোড হচ্ছে...' : 'Loading result...'}</div>;
  if (error || !attempt) return <div className="mx-auto max-w-xl p-10 text-center text-error">{error || 'Result not found.'}</div>;

  const questions = attempt.questionSnapshots || [];
  const title = language === 'bn' ? 'টেস্ট ফলাফল ও পর্যালোচনা' : 'Test result and review';
  const correctLabel = language === 'bn' ? 'সঠিক' : 'Correct';
  const incorrectLabel = language === 'bn' ? 'ভুল' : 'Incorrect';
  const explanationLabel = language === 'bn' ? 'ব্যাখ্যা' : 'Explanation';
  const scorePercent = attempt.scorePercent ?? 0;

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-10">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-primary">{language === 'bn' ? 'টেস্ট সম্পন্ন' : 'TEST COMPLETE'}</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-base-content/60">{attempt.correctCount} / {questions.length} {language === 'bn' ? 'সঠিক' : 'correct'} · {scorePercent}%</p>
        </div>
        <div className="flex gap-3">
          <Link href="/student/dashboard" className="btn btn-ghost">{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</Link>
          <Link href="/student/create-test" className="btn btn-primary">{language === 'bn' ? 'আরেকটি টেস্ট' : 'Try another test'}</Link>
        </div>
      </header>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const questionKey = String(question.questionId || index);
          const answer = {
            selectedAnswer: question.selectedAnswer || null,
            isCorrect: question.status === 'correct',
          };
          const isOpen = Boolean(openExplanations[questionKey]);
          return (
            <article key={questionKey} className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body gap-4">
                <div className="flex items-start gap-3">
                  <span className="badge badge-primary mt-1">{index + 1}</span>
                  <h2 className="flex-1 text-lg font-bold">{localText(question.question, language)}</h2>
                  <span className={`badge ${answer.isCorrect ? 'badge-success' : 'badge-error'}`}>
                    {answer.isCorrect ? correctLabel : incorrectLabel}
                  </span>
                </div>

                <div className="space-y-2" aria-label={language === 'bn' ? 'উত্তরের বিকল্পসমূহ' : 'Answer options'}>
                  {question.options.map((option) => {
                    const isSelected = answer.selectedAnswer === option.key;
                    const isCorrect = question.correctAnswer === option.key;
                    const showCorrectMark = isCorrect;
                    const showIncorrectMark = !answer.isCorrect && isSelected && !isCorrect;
                    const isCorrectSelection = answer.isCorrect && isSelected;
                    return (
                      <div
                        key={option.key}
                        className={`flex min-h-14 items-center gap-3 rounded-box border px-4 py-3 ${isCorrectSelection ? 'border-primary/40 bg-primary/5 text-primary' : showIncorrectMark ? 'border-error/40 bg-error/5 text-error' : 'border-base-300'}`}
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs">
                          {option.key}
                        </span>
                        <span className="flex-1">{localText(option.text, language)}</span>
                        {showCorrectMark && <span className="text-lg font-bold text-success" aria-label={correctLabel}>✓</span>}
                        {showIncorrectMark && <span className="text-lg font-bold text-error" aria-label={incorrectLabel}>✕</span>}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm w-fit"
                  onClick={() => setOpenExplanations((current) => ({ ...current, [questionKey]: !current[questionKey] }))}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (language === 'bn' ? 'ব্যাখ্যা লুকান' : 'Hide explanation') : explanationLabel}
                </button>
                <ReportQuestionButton questionId={question.questionId} attemptId={attempt._id} questionText={localText(question.question, language)} />
                {isOpen && <div className="rounded-box bg-base-200 p-4 text-sm leading-6"><p className="font-semibold">{explanationLabel}</p><p className="mt-1">{localText(question.explanation, language)}</p></div>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function Result() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm">Loading result...</div>}>
      <ResultContent />
    </Suspense>
  );
}
