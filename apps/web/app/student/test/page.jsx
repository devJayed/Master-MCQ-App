'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { TestSkeleton } from '../../../components/Skeletons';
import { api } from '../../../lib/api';
import { RichContent, Stimulus } from '../../../components/RichContent';

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
    return <TestSkeleton />;
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
    <div className="mx-auto max-w-3xl p-3 sm:p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-2">
        <button onClick={() => router.push('/student/dashboard')} className="btn btn-ghost btn-sm">
          ← {copy(language, 'পরীক্ষা থেকে বের হন', 'Exit test')}
        </button>
        <div className="min-w-0 flex-1 text-center sm:max-w-56">
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
        <div className="card-body gap-0 p-4 sm:p-5 md:p-6">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
            {question.sourceType === 'board'
              ? copy(language, 'বোর্ড প্রশ্ন', 'Board question')
              : question.sourceType === 'teacher'
                ? copy(language, 'শিক্ষক প্রদত্ত প্রশ্ন', 'Teacher question')
                : question.sourceType === 'model_test'
                  ? copy(language, 'মডেল টেস্ট', 'Model test')
                  : question.sourceType === 'admission'
                    ? copy(language, 'অ্যাডমিশন প্রশ্ন', 'Admission question')
                    : copy(language, 'অনুশীলন প্রশ্ন', 'Practice question')}
          </p>
          <Stimulus stimulus={question.stimulus} language={language} />
          <div className="mt-1 whitespace-pre-wrap font-display text-base font-bold leading-relaxed" role="heading" aria-level={1}>
            <RichContent
              content={question.questionContent}
              fallback={question.question}
              language={language}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.options.map((option) => (
              <button
                key={option.key}
                onClick={() => select(option.key)}
                className={`btn h-auto min-h-12 w-full min-w-0 flex-nowrap justify-start px-3 py-2 text-left text-sm font-medium ${answers[index] === option.key ? 'btn-primary' : 'btn-outline border-base-300'}`}
              >
                <span className="mr-1 grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs sm:mr-2">
                  {option.key}
                </span>
                <div className="min-w-0 whitespace-normal break-words">
                  <RichContent
                    content={question.optionContent?.find((item) => item.key === option.key)?.content}
                    fallback={option.text}
                    language={language}
                  />
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 sm:gap-3">
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={!index}
              className="btn btn-ghost btn-xs whitespace-nowrap px-2 sm:btn-sm sm:px-3"
            >
              ← {copy(language, 'আগের প্রশ্ন', 'Previous')}
            </button>
            <div className="flex min-w-0 items-center justify-center overflow-hidden px-1">
              {questions.length <= 12 ? (
                <div className="flex gap-1">
                  {questions.map((_, itemIndex) => (
                    <i
                      key={itemIndex}
                      className={`size-1.5 shrink-0 rounded-full ${index === itemIndex ? 'bg-primary' : 'bg-base-300'}`}
                    />
                  ))}
                </div>
              ) : (
                <span className="whitespace-nowrap text-xs font-semibold text-base-content/55">
                  {index + 1}/{questions.length}
                </span>
              )}
            </div>
            <button
              onClick={() => (index === questions.length - 1 ? finish() : setIndex(index + 1))}
              disabled={submitting}
              className="btn btn-primary btn-xs whitespace-nowrap px-2 sm:btn-sm sm:px-3"
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
  return (
    <Suspense fallback={<TestSkeleton />}>
      <TestContent />
    </Suspense>
  );
}
