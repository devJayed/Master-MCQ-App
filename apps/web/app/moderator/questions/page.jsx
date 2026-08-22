'use client';

import { Filter, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

export default function ModeratorQuestions() {
  const { language } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const name = (item) => item?.name?.[language] || item?.name?.bn || '—';

  const loadQuestions = async () => {
    const query = new URLSearchParams();
    if (chapterId) query.set('chapterId', chapterId);
    if (topicId) query.set('topicId', topicId);
    if (search) query.set('search', search);

    try {
      const result = await api(`/questions/manage?${query}`);
      setQuestions(result.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    api('/chapters')
      .then((result) => setChapters(result.data || []))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setTopicId('');
    if (!chapterId) {
      setTopics([]);
      return;
    }

    api(`/topics?chapterId=${chapterId}`)
      .then((result) => setTopics(result.data || []))
      .catch((err) => setError(err.message));
  }, [chapterId]);

  useEffect(() => {
    loadQuestions();
  }, [chapterId, topicId, search]);

  const handleDelete = async (questionId) => {
    const confirmed = window.confirm(
      'Soft delete this question? It will be hidden from the active question bank but kept in the history.'
    );

    if (!confirmed) return;

    try {
      const result = await api(`/questions/${questionId}`, { method: 'DELETE' });
      setNotice(result?.message || 'Question archived successfully.');
      setQuestions((current) => current.filter((question) => question._id !== questionId));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-base-content/50">CONTENT LIBRARY</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Question bank</h1>
        </div>
        <Link href="/moderator/questions/create" className="btn btn-primary">
          <Plus size={17} /> Add question
        </Link>
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-4">
        <label className="input input-bordered flex items-center gap-2">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="grow"
            placeholder="Search questions"
          />
        </label>

        <select value={chapterId} onChange={(event) => setChapterId(event.target.value)} className="select select-bordered">
          <option value="">All chapters</option>
          {chapters.map((chapter) => (
            <option key={chapter._id} value={chapter._id}>
              {name(chapter)}
            </option>
          ))}
        </select>

        <select value={topicId} disabled={!chapterId} onChange={(event) => setTopicId(event.target.value)} className="select select-bordered">
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic._id} value={topic._id}>
              {name(topic)}
            </option>
          ))}
        </select>

        <span className="btn btn-outline border-base-300 pointer-events-none">
          <Filter size={16} /> Hierarchy filters
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}
      {notice && <p className="mt-3 text-sm text-success">{notice}</p>}

      <div className="mt-5 overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Chapter / Topic</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question._id}>
                <td>
                  <b className="block max-w-md text-sm">{question.question?.[language] || question.question?.bn}</b>
                </td>
                <td>
                  <small>
                    {name(question.chapterId)}
                    <br />
                    {name(question.topicId)}
                    {question.subtopicId && <> / {name(question.subtopicId)}</>}
                  </small>
                </td>
                <td>
                  <span className="badge badge-ghost">{question.difficulty}</span>
                </td>
                <td>
                  <span className="badge badge-success">{question.status}</span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <Link href={`/moderator/questions/${question._id}/edit`} className="btn btn-ghost btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(question._id)}
                      className="btn btn-ghost btn-sm text-error"
                      aria-label="Delete question"
                      title="Soft delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!questions.length && (
              <tr>
                <td colSpan="5" className="text-center text-base-content/60">
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
