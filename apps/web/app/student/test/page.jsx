'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

const shuffle = (items) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};
const copy = (language, bangla, english) => (language === 'bn' ? bangla : english);

function TestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [seconds, setSeconds] = useState(600);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submissionKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const query = {
      chapterId: params.get('chapterId') || undefined,
      topicId: params.get('topicId') || undefined,
      subtopicId: params.get('subtopicId') || undefined,
      sourceType: params.get('sourceType') || undefined,
      board: params.get('board') || undefined,
      year: params.get('year') || undefined,
      tags: params.get('tags') || undefined,
      difficulty: params.get('difficulty') || undefined,
      limit: params.get('count') || '20',
    };
    const filteredQuery = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined)
    );

    api(`/questions?${new URLSearchParams(filteredQuery).toString()}`)
      .then((response) => {
        const safeResults = response.data || [];
        const requestedCount = Math.max(1, Number(params.get('count') || 20));
        const selected = shuffle(safeResults).slice(
          0,
          Math.min(requestedCount, safeResults.length)
        );
        setQuestions(selected);
        setAnswers(new Array(selected.length).fill(undefined));
        const configuredSeconds = Number(params.get('secondsPerQuestion'));
        const configuredMinutes = Number(params.get('minutes') || 0);
        setSeconds(
          Math.max(
            0,
            selected.length *
              (Number.isFinite(configuredSeconds) && configuredSeconds > 0
                ? configuredSeconds
                : configuredMinutes * 60)
          )
        );
        if (!selected.length) {
          setSeconds(0);
        }
      })
      .catch((error) => {
        setQuestions([]);
        setAnswers([]);
        setLoadError(
          error.message ||
            copy(
              language,
              'পরীক্ষাটি প্রস্তুত করা যায়নি। আবার চেষ্টা করুন।',
              'The exam could not be prepared. Please try again.'
            )
        );
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (loading || !questions.length || !seconds) return;
    const interval = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [loading, questions.length, seconds]);

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const configuredSeconds = Number(searchParams.get('secondsPerQuestion') || 0);
    const timeAllocatedSeconds = configuredSeconds * questions.length;
    try {
      const result = await api('/attempts', {
        method: 'POST',
        body: JSON.stringify({
          mode: ['topic', 'chapter', 'quick', 'mistakes', 'custom', 'model'].includes(
            searchParams.get('mode')
          )
            ? searchParams.get('mode')
            : 'custom',
          submissionKey,
          questionIds: questions.map((question) => question._id),
          answers: questions.map((question, itemIndex) => ({
            questionId: question._id,
            selectedAnswer: answers[itemIndex] || null,
          })),
          filters: Object.fromEntries(
            [...searchParams.entries()].filter(
              ([key]) => !['count', 'minutes', 'secondsPerQuestion'].includes(key)
            )
          ),
          timeAllocatedSeconds,
          timeTakenSeconds: Math.max(0, timeAllocatedSeconds - seconds),
        }),
      });
      router.push(`/student/result?attemptId=${result.data._id}`);
    } catch (error) {
      setSubmitError(
        error.message || copy(language, 'পরীক্ষা জমা দেওয়া যায়নি।', 'Could not submit the test.')
      );
      setSubmitting(false);
    }
  };

  const select = (key) =>
    setAnswers((current) => {
      const next = [...current];
      next[index] = key;
      return next;
    });

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-5 md:p-10">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body text-center">
            <span className="loading loading-spinner loading-lg mx-auto text-primary" />
            <p className="mt-4 text-sm text-base-content/60">
              {copy(
                language,
                'আপনার পরীক্ষা প্রস্তুত করা হচ্ছে...',
                'Preparing your custom test...'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-3xl p-5 md:p-10">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body text-center">
            <h1 className="font-display text-3xl font-bold">
              {loadError
                ? copy(language, 'পরীক্ষাটি প্রস্তুত করা যায়নি', 'Could not prepare this exam')
                : copy(language, 'কোনো মিল থাকা প্রশ্ন পাওয়া যায়নি', 'No matching questions found')}
            </h1>
            <p className="mt-3 text-sm text-base-content/60">
              {loadError ||
                copy(
                  language,
                  'ফিল্টার কমিয়ে অথবা অন্য অধ্যায় বা বোর্ড বেছে আবার চেষ্টা করুন।',
                  'Try widening the filters or choosing a different chapter or board.'
                )}
            </p>
            <button
              className="btn btn-primary mx-auto mt-5"
              onClick={() => router.push('/student/create-test')}
            >
              {copy(language, 'ফিল্টার পরিবর্তন করুন', 'Adjust filters')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[index];
  return (
    <div className="mx-auto max-w-3xl p-5 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => router.push('/student/dashboard')} className="btn btn-ghost btn-sm">
          ← {copy(language, 'পরীক্ষা থেকে বের হন', 'Exit test')}
        </button>
        <div className="w-56 text-center">
          <small>
            {copy(language, 'প্রশ্ন', 'Question')} {index + 1} {copy(language, 'এর মধ্যে', 'of')}{' '}
            {questions.length}
          </small>
          <progress
            className="progress progress-primary block w-full"
            value={index + 1}
            max={questions.length}
          />
        </div>
        <b>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </b>
      </div>
      <section className="card border border-base-300 bg-base-100">
        <div className="card-body p-6 md:p-10">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            {question.sourceType === 'board'
              ? copy(language, 'বোর্ড প্রশ্ন', 'Board question')
              : question.sourceType === 'teacher'
                ? copy(language, 'শিক্ষক প্রদত্ত প্রশ্ন', 'Teacher question')
                : question.sourceType === 'model_test'
                  ? copy(language, 'মডেল টেস্ট', 'Model test')
                  : copy(language, 'অনুশীলন প্রশ্ন', 'Practice question')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-snug">
            {question.question[language] || question.question.bn || question.question.en}
          </h1>
          <div className="mt-7 space-y-3">
            {question.options.map((option) => (
              <button
                key={option.key}
                onClick={() => select(option.key)}
                className={`btn h-auto min-h-14 w-full justify-start text-left ${answers[index] === option.key ? 'btn-primary' : 'btn-outline border-base-300'}`}
              >
                <span className="mr-2 grid size-6 place-items-center rounded-full border border-current text-xs">
                  {option.key}
                </span>
                {option.text[language] || option.text.bn || option.text.en}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={!index}
              className="btn btn-ghost btn-sm"
            >
              ← {copy(language, 'আগের প্রশ্ন', 'Previous')}
            </button>
            <div className="flex gap-1">
              {questions.map((_, itemIndex) => (
                <i
                  key={itemIndex}
                  className={`size-1.5 rounded-full ${index === itemIndex ? 'bg-primary' : 'bg-base-300'}`}
                />
              ))}
            </div>
            <button
              onClick={() => (index === questions.length - 1 ? finish() : setIndex(index + 1))}
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting
                ? copy(language, 'জমা দেওয়া হচ্ছে...', 'Submitting...')
                : index === questions.length - 1
                  ? copy(language, 'পরীক্ষা শেষ করুন', 'Finish test')
                  : copy(language, 'পরের প্রশ্ন', 'Next question')}{' '}
              →
            </button>
          </div>
          {submitError && <p className="mt-4 text-center text-sm text-error">{submitError}</p>}
        </div>
      </section>
    </div>
  );
}

export default function Test() {
  const { language } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl p-5 md:p-10">
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body text-center">
              <span className="loading loading-spinner loading-lg mx-auto text-primary" />
              <p className="mt-4 text-sm text-base-content/60">
                {copy(
                  language,
                  'আপনার পরীক্ষা প্রস্তুত করা হচ্ছে...',
                  'Preparing your custom test...'
                )}
              </p>
            </div>
          </div>
        </div>
      }
    >
      <TestContent />
    </Suspense>
  );
}
