'use client';

import { Languages, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../../components/LanguageProvider';
import { api } from '../../../../lib/api';

const initialForm = {
  chapterId: '',
  topicId: '',
  subtopicId: '',
  question: { bn: '', en: '' },
  options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: { bn: '', en: '' } })),
  correctAnswer: 'A',
  explanation: { bn: '', en: '' },
  difficulty: 'easy',
  sourceType: 'teacher',
  tags: [],
};

function LocalizedField({ label, value, onChange, multiline = false, required = false }) {
  const Field = multiline ? 'textarea' : 'input';
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="form-control">
        <span className="label-text font-semibold">
          {label} - Bangla {required && <em className="text-error">*</em>}
        </span>
        <Field
          required={required}
          value={value.bn}
          onChange={(event) => onChange({ ...value, bn: event.target.value })}
          className={`${multiline ? 'textarea min-h-28' : 'input'} input-bordered mt-1`}
        />
      </label>
      <label className="form-control">
        <span className="label-text font-semibold">
          {label} - English <small className="font-normal text-base-content/50">(optional)</small>
        </span>
        <Field
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.target.value })}
          className={`${multiline ? 'textarea min-h-28' : 'input'} input-bordered mt-1`}
        />
      </label>
    </div>
  );
}

export function QuestionEditor({ questionId, basePath = '/moderator/questions' }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/chapters')
      .then((result) => setChapters(result.data))
      .catch((error) => setMessage(error.message));
  }, []);
  useEffect(() => {
    setTopics([]);
    setSubtopics([]);
    if (!form.chapterId) return;
    api(`/topics?chapterId=${form.chapterId}`)
      .then((result) => setTopics(result.data))
      .catch((error) => setMessage(error.message));
  }, [form.chapterId]);
  useEffect(() => {
    setSubtopics([]);
    if (!form.topicId) return;
    api(`/subtopics?topicId=${form.topicId}`)
      .then((result) => setSubtopics(result.data))
      .catch((error) => setMessage(error.message));
  }, [form.topicId]);
  useEffect(() => {
    if (!questionId) return;
    api(`/questions/${questionId}/manage`)
      .then((result) => {
        const { _id, __v, createdBy, updatedBy, createdAt, updatedAt, isDeleted, ...editorForm } =
          result.data;
        setForm({ ...initialForm, ...editorForm, subtopicId: editorForm.subtopicId || '' });
      })
      .catch((error) => setMessage(error.message || 'Could not load the question.'));
  }, [questionId]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateOption = (index, text) =>
    setForm((current) => ({
      ...current,
      options: current.options.map((option, itemIndex) =>
        itemIndex === index ? { ...option, text } : option
      ),
    }));
  const changeChapter = (chapterId) =>
    setForm((current) => ({ ...current, chapterId, topicId: '', subtopicId: '' }));
  const changeTopic = (topicId) => setForm((current) => ({ ...current, topicId, subtopicId: '' }));
  const generate = async (targets) => {
    setBusy(true);
    setMessage('');
    try {
      const result = await api('/questions/translate', {
        method: 'POST',
        body: JSON.stringify({ payload: form, targets }),
      });
      const { generatedEnglishFields, ...translated } = result.data;
      setForm(translated);
      setMessage(
        generatedEnglishFields.length
          ? `Generated English for ${generatedEnglishFields.join(', ')}.`
          : 'All selected English fields were entered manually.'
      );
    } catch (error) {
      setMessage(error.message || 'Translation failed.');
    } finally {
      setBusy(false);
    }
  };
  const submit = async (status) => {
    setBusy(true);
    setMessage('');
    try {
      const payload = { ...form, status };
      console.log('Submitting payload:', payload);
      if (!payload.subtopicId) delete payload.subtopicId;
      await api(questionId ? `/questions/${questionId}` : '/questions', {
        method: questionId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      router.push(basePath);
    } catch (error) {
      setMessage(error.message || 'Could not save question.');
    } finally {
      setBusy(false);
    }
  };
  const local = (value) => value?.[language] || value?.bn || '';

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">
            BILINGUAL QUESTION BANK
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {questionId ? 'Edit bilingual question' : 'Create bilingual question'}
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            Choose a chapter and topic first. Bangla is required; supplied English is never
            overwritten.
          </p>
        </div>
        <button
          type="button"
          onClick={() => generate(['question', 'options', 'explanation'])}
          disabled={busy}
          className="btn btn-outline border-primary text-primary"
        >
          <WandSparkles size={16} /> Generate missing English
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit('draft');
        }}
        className="mt-7 grid gap-6 lg:grid-cols-[1fr_285px]"
      >
        <section className="card border border-base-300 bg-base-100">
          <div className="card-body gap-7">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label-text font-semibold">Chapter</span>
                <select
                  required
                  value={form.chapterId}
                  onChange={(event) => changeChapter(event.target.value)}
                  className="select select-bordered mt-1"
                >
                  <option value="">Select chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {chapter.name?.[language] || chapter.name?.bn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-semibold">Topic</span>
                <select
                  required
                  disabled={!form.chapterId}
                  value={form.topicId}
                  onChange={(event) => changeTopic(event.target.value)}
                  className="select select-bordered mt-1"
                >
                  <option value="">Select topic</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.name?.[language] || topic.name?.bn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-semibold">
                  Subtopic <small className="font-normal text-base-content/50">(optional)</small>
                </span>
                <select
                  disabled={!form.topicId}
                  value={form.subtopicId}
                  onChange={(event) => update('subtopicId', event.target.value)}
                  className="select select-bordered mt-1"
                >
                  <option value="">No subtopic</option>
                  {subtopics.map((subtopic) => (
                    <option key={subtopic._id} value={subtopic._id}>
                      {subtopic.name?.[language] || subtopic.name?.bn}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <div className="mb-2 flex justify-between">
                <b>Question</b>
                <button
                  type="button"
                  onClick={() => generate(['question'])}
                  disabled={busy}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <Languages size={14} /> Generate English
                </button>
              </div>
              <LocalizedField
                label="Question"
                value={form.question}
                onChange={(value) => update('question', value)}
                required
                multiline
              />
            </div>
            <fieldset>
              <div className="mb-2 flex justify-between">
                <legend className="font-semibold">Options</legend>
                <button
                  type="button"
                  onClick={() => generate(['options'])}
                  disabled={busy}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <Languages size={14} /> Generate English
                </button>
              </div>
              <div className="space-y-4">
                {form.options.map((option, index) => (
                  <div className="rounded-box border border-base-300 p-3" key={option.key}>
                    <div className="mb-2 flex items-center gap-3">
                      <input
                        type="radio"
                        name="correct"
                        checked={form.correctAnswer === option.key}
                        onChange={() => update('correctAnswer', option.key)}
                        className="radio radio-primary radio-sm"
                      />
                      <b className="text-primary">{option.key}</b>
                      <small>Correct answer</small>
                    </div>
                    <LocalizedField
                      label={`Option ${option.key}`}
                      value={option.text}
                      onChange={(text) => updateOption(index, text)}
                      required
                    />
                  </div>
                ))}
              </div>
            </fieldset>
            <div>
              <div className="mb-2 flex justify-between">
                <b>Explanation</b>
                <button
                  type="button"
                  onClick={() => generate(['explanation'])}
                  disabled={busy}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <Languages size={14} /> Generate English
                </button>
              </div>
              <LocalizedField
                label="Explanation"
                value={form.explanation}
                onChange={(value) => update('explanation', value)}
                required
                multiline
              />
            </div>
          </div>
        </section>
        <aside className="space-y-5">
          <section className="card border border-base-300 bg-base-200">
            <div className="card-body p-5">
              <p className="text-[10px] font-bold tracking-widest text-primary">LANGUAGE PREVIEW</p>
              <h2 className="mt-2 font-display text-lg font-bold">
                {local(form.question) || 'Question preview'}
              </h2>
              {form.options.map((option) => (
                <p className="mt-2 text-sm" key={option.key}>
                  <b>{option.key}.</b> {local(option.text) || '—'}
                </p>
              ))}
              <p className="mt-4 border-t border-base-300 pt-3 text-xs">
                {local(form.explanation) || 'Explanation preview'}
              </p>
            </div>
          </section>
          <section className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <label className="form-control">
                <span className="label-text font-semibold">Difficulty</span>
                <select
                  value={form.difficulty}
                  onChange={(event) => update('difficulty', event.target.value)}
                  className="select select-bordered select-sm mt-1"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              {message && <p className="text-xs text-error">{message}</p>}
              <div className="divider" />
              <button disabled={busy} className="btn btn-outline" type="submit">
                Save draft
              </button>
              <button
                disabled={busy}
                onClick={() => submit('published')}
                className="btn btn-primary"
                type="button"
              >
                {busy ? <span className="loading loading-spinner" /> : 'Publish bilingual question'}
              </button>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}

export default function CreateQuestion() {
  return <QuestionEditor />;
}
