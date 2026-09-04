'use client';

import { ArrowLeft, Languages, WandSparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../../components/LanguageProvider';
import { api } from '../../../../lib/api';
import RichContentEditor from '../../../../components/RichContentEditor';
import { RichContent, Stimulus } from '../../../../components/RichContent';

const FIXED_STIMULUS_TITLE = {
  bn: 'নিচের উদ্দীপকের আলোকে পরবর্তী প্রশ্নটির উত্তর দাও',
  en: 'Answer the next question based on the following stem/stimulus',
};

const initialForm = {
  questionType: 0,
  chapterId: '',
  topicId: '',
  subtopicId: '',
  question: { bn: '', en: '' },
  contentVersion: 1,
  stimulus: { groupId: '', title: FIXED_STIMULUS_TITLE, content: { bn: [], en: [] } },
  questionContent: { bn: [], en: [] },
  options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: { bn: '', en: '' } })),
  correctAnswer: 'A',
  explanation: { bn: '', en: '' },
  explanationContent: { bn: [], en: [] },
  answer: { bn: '', en: '' },
  answerContent: { bn: [], en: [] },
  optionContent: ['A', 'B', 'C', 'D'].map((key) => ({ key, content: { bn: [], en: [] } })),
  difficulty: 'medium',
  sourceType: 'teacher',
  tags: [],
};

const text = (language, bn, en) => (language === 'bn' ? bn : en);
const SOURCE_TYPES = {
  teacher: ['শিক্ষক', 'Teacher'],
  board: ['বোর্ড প্রশ্ন', 'Board question'],
  model_test: ['মডেল টেস্ট', 'Model test'],
  practice: ['অনুশীলন', 'Practice'],
  admission: ['অ্যাডমিশন ', 'Admission'],
};
const QUESTION_TYPES = [
  [0, 'বহুনির্বাচনি প্রশ্ন', 'MCQ'],
  [1, 'জ্ঞানমূলক প্রশ্ন', 'Knowledge question'],
  [2, 'অনুধাবনমূলক প্রশ্ন', 'Comprehension question'],
  [3, 'প্রয়োগমূলক প্রশ্ন', 'Application question'],
  [4, 'উচ্চতর দক্ষতামূলক প্রশ্ন', 'Higher-order question'],
];

const hasStimulusContent = (stimulus) =>
  Boolean(
    stimulus?.groupId?.trim() ||
      stimulus?.content?.bn?.length ||
      stimulus?.content?.en?.length
  );

const hasMeaningfulBlock = (block) => {
  if (block?.type === 'image') return Boolean(block.url?.trim());
  if (block?.type === 'table')
    return block.rows?.some((row) => row.some((cell) => String(cell || '').trim()));
  return Boolean(block?.text?.trim());
};
const hasRichLanguage = (content, language) =>
  Boolean(content?.[language]?.some(hasMeaningfulBlock));

function LocalizedField({ label, value, onChange, language, multiline = false, required = false, readOnly = false }) {
  const Field = multiline ? 'textarea' : 'input';
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="form-control">
        <span className="label-text font-semibold">
          {label} — {text(language, 'বাংলা', 'Bangla')}{' '}
          {required && <em className="text-error">*</em>}
        </span>
        <Field
          required={required}
          readOnly={readOnly}
          value={value.bn}
          onChange={(event) => onChange({ ...value, bn: event.target.value })}
          className={`${multiline ? 'textarea min-h-28' : 'input'} input-bordered mt-1`}
          placeholder={text(language, 'বাংলায় লিখুন', 'Write in Bangla')}
        />
      </label>
      <label className="form-control">
        <span className="label-text font-semibold">
          {label} — English{' '}
          {!readOnly && <small className="font-normal text-base-content/50">({text(language, 'ঐচ্ছিক', 'optional')})</small>}
        </span>
        <Field
          readOnly={readOnly}
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.target.value })}
          className={`${multiline ? 'textarea min-h-28' : 'input'} input-bordered mt-1`}
          placeholder={text(language, 'ইংরেজি লিখুন বা তৈরি করুন', 'Write or generate English')}
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
  const [messageTone, setMessageTone] = useState('error');
  const [tagsInput, setTagsInput] = useState('');

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
        setForm({
          ...initialForm,
          ...editorForm,
          questionType: editorForm.questionType === 'single_choice' || editorForm.questionType == null ? 0 : Number(editorForm.questionType),
          subtopicId: editorForm.subtopicId || '',
          stimulus: {
            ...(editorForm.stimulus || initialForm.stimulus),
            title: FIXED_STIMULUS_TITLE,
          },
          questionContent: editorForm.questionContent || initialForm.questionContent,
          explanationContent: editorForm.explanationContent || initialForm.explanationContent,
          optionContent: initialForm.optionContent.map((fallback) =>
            editorForm.optionContent?.find((item) => item.key === fallback.key) || fallback
          ),
        });
        setTagsInput((editorForm.tags || []).join(', '));
      })
      .catch((error) =>
        setMessage(
          error.message || text(language, 'প্রশ্নটি লোড করা যায়নি।', 'Could not load the question.')
        )
      );
  }, [questionId]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateQuestion = (value) =>
    setForm((current) => {
      const questionContent = { ...current.questionContent };
      for (const languageKey of ['bn', 'en']) {
        if (value[languageKey]?.trim()) questionContent[languageKey] = [];
      }
      return { ...current, question: value, questionContent };
    });
  const updateQuestionContent = (value) =>
    setForm((current) => {
      const question = { ...current.question };
      for (const languageKey of ['bn', 'en']) {
        if (hasRichLanguage(value, languageKey)) question[languageKey] = '';
      }
      return { ...current, question, questionContent: value };
    });
  const updateOption = (index, text) =>
    setForm((current) => ({
      ...current,
      options: current.options.map((option, itemIndex) =>
        itemIndex === index ? { ...option, text } : option
      ),
    }));
  const updateOptionContent = (key, content) =>
    setForm((current) => ({
      ...current,
      optionContent: current.optionContent.map((item) =>
        item.key === key ? { ...item, content } : item
      ),
    }));
  const changeChapter = (chapterId) =>
    setForm((current) => ({ ...current, chapterId, topicId: '', subtopicId: '' }));
  const changeTopic = (topicId) => setForm((current) => ({ ...current, topicId, subtopicId: '' }));
  const generate = async (targets) => {
    setBusy(true);
    setMessage('');
    setMessageTone('error');
    try {
      const result = await api('/questions/translate', {
        method: 'POST',
        body: JSON.stringify({ payload: form, targets }),
      });
      const { generatedEnglishFields, ...translated } = result.data;
      setForm(translated);
      setMessage(
        generatedEnglishFields.length
          ? text(
              language,
              `ইংরেজি তৈরি হয়েছে: ${generatedEnglishFields.join(', ')}।`,
              `Generated English for ${generatedEnglishFields.join(', ')}.`
            )
          : text(
              language,
              'নির্বাচিত সব ইংরেজি ঘর আগে থেকেই পূরণ করা ছিল।',
              'All selected English fields were already filled.'
            )
      );
      setMessageTone('success');
    } catch (error) {
      setMessage(error.message || text(language, 'অনুবাদ তৈরি করা যায়নি।', 'Translation failed.'));
    } finally {
      setBusy(false);
    }
  };
  const submit = async (status) => {
    setMessage('');
    setMessageTone('error');
    for (const languageKey of ['bn', 'en']) {
      const hasPlain = Boolean(form.question?.[languageKey]?.trim());
      const hasRich = hasRichLanguage(form.questionContent, languageKey);
      if (hasPlain && hasRich) {
        setMessage(`Use either plain or rich ${languageKey === 'bn' ? 'Bangla' : 'English'} question content, not both.`);
        return;
      }
      if (languageKey === 'bn' && !hasPlain && !hasRich) {
        setMessage('Enter Bangla plain question text or Bangla rich question content.');
        return;
      }
      if (form.questionType === 0 && status === 'published' && !hasPlain && !hasRich) {
        setMessage(`Add ${languageKey === 'bn' ? 'Bangla' : 'English'} question content before publishing.`);
        return;
      }
    }
    if (form.questionType !== 0) {
      const hasPlainAnswer = Boolean(form.answer?.bn?.trim());
      const hasRichAnswer = hasRichLanguage(form.answerContent, 'bn');
      if (hasPlainAnswer && hasRichAnswer) {
        setMessage('Use either plain or rich Bangla answer content, not both.');
        return;
      }
      if (!hasPlainAnswer && !hasRichAnswer) {
        setMessage('Enter Bangla plain answer text or Bangla rich answer content.');
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        tags: tagsInput
          .split(/[|,;]+/)
          .map((tag) => tag.trim())
          .filter(Boolean),
        status,
      };
      if (!payload.subtopicId) delete payload.subtopicId;
      if (!hasStimulusContent(payload.stimulus)) {
        delete payload.stimulus;
      } else {
        payload.stimulus = { ...payload.stimulus, title: FIXED_STIMULUS_TITLE };
      }
      await api(questionId ? `/questions/${questionId}` : '/questions', {
        method: questionId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      router.push(basePath);
    } catch (error) {
      setMessage(
        error.message || text(language, 'প্রশ্নটি সংরক্ষণ করা যায়নি।', 'Could not save question.')
      );
    } finally {
      setBusy(false);
    }
  };
  const local = (value) =>
    value?.[language] ||
    (language === 'bn' ? value?.bn || value?.en : value?.en || value?.bn) ||
    '';
  const localName = (item) => local(item?.name) || '—';

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-10">
      <Link href={basePath} className="btn btn-ghost btn-sm mb-4 -ml-3">
        <ArrowLeft size={16} />
        {text(language, 'প্রশ্নভাণ্ডারে ফিরুন', 'Back to question bank')}
      </Link>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">
            {text(language, 'দ্বিভাষিক প্রশ্নভাণ্ডার', 'BILINGUAL QUESTION BANK')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {questionId
              ? text(language, 'দ্বিভাষিক প্রশ্ন সম্পাদনা করুন', 'Edit bilingual question')
              : text(language, 'দ্বিভাষিক প্রশ্ন তৈরি করুন', 'Create bilingual question')}
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            {text(
              language,
              'Excel টেমপ্লেটের একই ঘরগুলো পূরণ করুন। বাংলা আবশ্যক; ইংরেজি ঐচ্ছিক এবং প্রয়োজনে তৈরি করা যাবে।',
              'Complete the same fields used by the Excel template. Bangla is required; English is optional and can be generated when needed.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => generate(form.questionType === 0 ? ['question', 'options', 'explanation'] : ['question'])}
          disabled={busy}
          className="btn btn-outline border-primary text-primary"
        >
          {busy ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <WandSparkles size={16} />
          )}{' '}
          {text(language, 'অনুপস্থিত ইংরেজি তৈরি করুন', 'Generate missing English')}
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
            <label className="form-control">
              <span className="label-text font-semibold">{text(language, 'প্রশ্নের ধরন', 'Question type')}</span>
              <select
                className="select select-bordered mt-1"
                value={form.questionType}
                disabled={Boolean(questionId)}
                onChange={(event) => update('questionType', Number(event.target.value))}
              >
                {QUESTION_TYPES.map(([value, bn, en]) => <option key={value} value={value}>{text(language, bn, en)}</option>)}
              </select>
              <span className="mt-1 text-xs text-base-content/50">{questionId ? text(language, 'তৈরির পরে ধরন পরিবর্তন করা যায় না।', 'Type cannot be changed after creation.') : text(language, 'ধরন অনুযায়ী প্রয়োজনীয় ঘর দেখানো হবে।', 'Required fields adapt to the selected type.')}</span>
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label-text font-semibold">
                  {text(language, 'অধ্যায়', 'Chapter')}
                </span>
                <select
                  required
                  value={form.chapterId}
                  onChange={(event) => changeChapter(event.target.value)}
                  className="select select-bordered mt-1"
                >
                  <option value="">
                    {text(language, 'অধ্যায় নির্বাচন করুন', 'Select chapter')}
                  </option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {localName(chapter)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-semibold">{text(language, 'টপিক', 'Topic')}</span>
                <select
                  required
                  disabled={!form.chapterId}
                  value={form.topicId}
                  onChange={(event) => changeTopic(event.target.value)}
                  className="select select-bordered mt-1"
                >
                  <option value="">{text(language, 'টপিক নির্বাচন করুন', 'Select topic')}</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {localName(topic)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-semibold">
                  {text(language, 'সাবটপিক', 'Subtopic')}{' '}
                  <small className="font-normal text-base-content/50">
                    {text(language, '(ঐচ্ছিক)', '(optional)')}
                  </small>
                </span>
                <select
                  disabled={!form.topicId}
                  value={form.subtopicId}
                  onChange={(event) => update('subtopicId', event.target.value)}
                  className="select select-bordered mt-1"
                >
                  <option value="">{text(language, 'কোনো সাবটপিক নয়', 'No subtopic')}</option>
                  {subtopics.map((subtopic) => (
                    <option key={subtopic._id} value={subtopic._id}>
                      {localName(subtopic)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {[0, 3, 4].includes(form.questionType) && <details className="rounded-box border border-primary/20 bg-primary/5 p-4">
              <summary className="cursor-pointer font-semibold">Shared stimulus / passage</summary>
              <p className="mt-2 text-xs text-base-content/60">Use the same group ID on related questions. Add passage text, code, diagrams, equations, or tables as ordered blocks.</p>
              <div className="mt-4 grid gap-3">
                <label className="form-control">
                  <span className="label-text text-xs font-semibold">Stimulus group ID</span>
                  <input className="input input-bordered input-sm mt-1" value={form.stimulus?.groupId || ''} onChange={(event) => update('stimulus', { ...form.stimulus, groupId: event.target.value })} placeholder="e.g. hsc-ict-db-rb-2024-stimulus-1" />
                </label>
                <LocalizedField label="Stimulus instruction" language={language} value={FIXED_STIMULUS_TITLE} onChange={() => {}} multiline readOnly />
                <RichContentEditor label="Stimulus content" value={form.stimulus?.content} onChange={(content) => update('stimulus', { ...form.stimulus, content })} />
              </div>
            </details>}
            <div>
              <div className="mb-2 flex justify-between">
                <b>{text(language, 'প্রশ্ন', 'Question')}</b>
                <button
                  type="button"
                  onClick={() => generate(['question'])}
                  disabled={busy}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <Languages size={14} /> {text(language, 'ইংরেজি তৈরি করুন', 'Generate English')}
                </button>
              </div>
              <LocalizedField
                label={text(language, 'প্রশ্ন', 'Question')}
                language={language}
                value={form.question}
                onChange={updateQuestion}
                required={!hasRichLanguage(form.questionContent, 'bn')}
                multiline
              />
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-primary">Use rich question body</summary>
                <p className="my-2 text-xs text-base-content/60">Use either plain text or rich content for each language. Rich question blocks map directly to Question Rich BN and Question Rich EN in Excel.</p>
                <RichContentEditor label="Question body" value={form.questionContent} onChange={updateQuestionContent} />
              </details>
            </div>
            {form.questionType === 0 && <fieldset>
              <div className="mb-2 flex justify-between">
                <legend className="font-semibold">{text(language, 'বিকল্পসমূহ', 'Options')}</legend>
                <button
                  type="button"
                  onClick={() => generate(['options'])}
                  disabled={busy}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <Languages size={14} /> {text(language, 'ইংরেজি তৈরি করুন', 'Generate English')}
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
                      <small>{text(language, 'সঠিক উত্তর', 'Correct answer')}</small>
                    </div>
                    <LocalizedField
                      label={`${text(language, 'বিকল্প', 'Option')} ${option.key}`}
                      language={language}
                      value={option.text}
                      onChange={(text) => updateOption(index, text)}
                      required
                    />
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-primary">Add rich option content</summary>
                      <RichContentEditor label={`Option ${option.key}`} value={form.optionContent?.find((item) => item.key === option.key)?.content} onChange={(content) => updateOptionContent(option.key, content)} />
                    </details>
                  </div>
                ))}
              </div>
            </fieldset>}
            {form.questionType === 0 ? <div>
              <div className="mb-2 flex justify-between">
                <b>{text(language, 'ব্যাখ্যা', 'Explanation')}</b>
                <button
                  type="button"
                  onClick={() => generate(['explanation'])}
                  disabled={busy}
                  className="btn btn-ghost btn-xs text-primary"
                >
                  <Languages size={14} /> {text(language, 'ইংরেজি তৈরি করুন', 'Generate English')}
                </button>
              </div>
              <LocalizedField
                label={text(language, 'ব্যাখ্যা', 'Explanation')}
                language={language}
                value={form.explanation}
                onChange={(value) => update('explanation', value)}
                required
                multiline
              />
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-primary">Add rich explanation content</summary>
                <RichContentEditor label="Explanation" value={form.explanationContent} onChange={(value) => update('explanationContent', value)} />
              </details>
            </div> : <div>
              <div className="mb-2 flex justify-between">
                <b>{text(language, 'উত্তর', 'Answer')}</b>
              </div>
              <LocalizedField
                label={text(language, 'উত্তর', 'Answer')}
                language={language}
                value={form.answer}
                onChange={(value) => {
                  update('answer', value);
                  if (value.bn?.trim() || value.en?.trim())
                    setForm((current) => ({ ...current, answer: value, answerContent: {
                      bn: value.bn?.trim() ? [] : current.answerContent.bn,
                      en: value.en?.trim() ? [] : current.answerContent.en,
                    } }));
                }}
                required={!hasRichLanguage(form.answerContent, 'bn')}
                multiline
              />
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-primary">{text(language, 'সমৃদ্ধ উত্তর ব্যবহার করুন', 'Use rich answer')}</summary>
                <RichContentEditor label="Answer" value={form.answerContent} onChange={(value) => setForm((current) => ({ ...current, answer: {
                  bn: hasRichLanguage(value, 'bn') ? '' : current.answer.bn,
                  en: hasRichLanguage(value, 'en') ? '' : current.answer.en,
                }, answerContent: value }))} />
              </details>
            </div>}
          </div>
        </section>
        <aside className="space-y-5">
          <section className="card border border-base-300 bg-base-200">
            <div className="card-body p-5">
              <p className="text-[10px] font-bold tracking-widest text-primary">
                {text(language, 'ভাষার প্রিভিউ', 'LANGUAGE PREVIEW')}
              </p>
              <Stimulus stimulus={form.stimulus} language={language} />
              <div className="mt-2 font-display text-lg font-bold" role="heading" aria-level={2}>
                <RichContent content={form.questionContent} fallback={form.question} language={language} />
              </div>
              {form.questionType === 0 && form.options.map((option) => (
                <div className="mt-2 text-sm" key={option.key}>
                  <b>{option.key}.</b>{' '}
                  <RichContent content={form.optionContent?.find((item) => item.key === option.key)?.content} fallback={option.text} language={language} />
                </div>
              ))}
              <div className="mt-4 border-t border-base-300 pt-3 text-xs">
                <b>{form.questionType === 0 ? text(language, 'ব্যাখ্যা', 'Explanation') : text(language, 'উত্তর', 'Answer')}</b>
                <RichContent className="mt-1" content={form.questionType === 0 ? form.explanationContent : form.answerContent} fallback={form.questionType === 0 ? form.explanation : form.answer} language={language} />
              </div>
            </div>
          </section>
          <section className="card border border-base-300 bg-base-100">
            <div className="card-body">
              <label className="form-control">
                <span className="label-text font-semibold">
                  {text(language, 'কঠিনতা', 'Difficulty')}
                </span>
                <select
                  value={form.difficulty}
                  onChange={(event) => update('difficulty', event.target.value)}
                  className="select select-bordered select-sm mt-1"
                >
                  <option value="easy">{text(language, 'সহজ', 'Easy')}</option>
                  <option value="medium">{text(language, 'মাঝারি', 'Medium')}</option>
                  <option value="hard">{text(language, 'কঠিন', 'Hard')}</option>
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-semibold">{text(language, 'উৎস', 'Source')}</span>
                <select
                  value={form.sourceType}
                  onChange={(event) => update('sourceType', event.target.value)}
                  className="select select-bordered select-sm mt-1"
                >
                  {Object.entries(SOURCE_TYPES).map(([value, copy]) => (
                    <option value={value} key={value}>
                      {text(language, ...copy)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-semibold">
                  {text(language, 'ট্যাগ', 'Tags')}{' '}
                  <small className="font-normal text-base-content/50">
                    {text(language, '(কমা দিয়ে আলাদা করুন)', '(comma separated)')}
                  </small>
                </span>
                <input
                  className="input input-bordered input-sm mt-1"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder={text(
                    language,
                    'যেমন: এইচএসসি, সংখ্যা পদ্ধতি',
                    'e.g. HSC, number system'
                  )}
                />
              </label>
              {message && (
                <p
                  className={`text-xs ${messageTone === 'success' ? 'text-success' : 'text-error'}`}
                  role={messageTone === 'success' ? 'status' : 'alert'}
                >
                  {message}
                </p>
              )}
              <div className="divider" />
              <button disabled={busy} className="btn btn-outline" type="submit">
                {text(language, 'খসড়া সংরক্ষণ করুন', 'Save draft')}
              </button>
              <button
                disabled={busy}
                onClick={() => submit('published')}
                className="btn btn-primary"
                type="button"
              >
                {busy ? (
                  <span className="loading loading-spinner" />
                ) : (
                  text(language, 'দ্বিভাষিক প্রশ্ন প্রকাশ করুন', 'Publish bilingual question')
                )}
              </button>
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}

export default function CreateQuestion() {
  return <QuestionEditor />;
}
