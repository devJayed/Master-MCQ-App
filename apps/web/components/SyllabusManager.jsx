'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from './LanguageProvider';

const nameFor = (item, language) => item.name?.[language] || item.name?.bn || '';

export default function SyllabusManager() {
  const { language } = useLanguage();
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ type: 'chapter', chapterId: '', topicId: '', bn: '', en: '' });
  const [message, setMessage] = useState('');
  const load = () => api('/syllabus/tree').then((result) => setTree(result.data)).catch((error) => setMessage(error.message));
  useEffect(() => { load(); }, []);
  const toggle = (id) => setExpanded((current) => ({ ...current, [id]: !current[id] }));
  const create = async (event) => {
    event.preventDefault(); setMessage('');
    const siblings = form.type === 'chapter' ? tree : form.type === 'topic' ? tree.find((chapter) => chapter._id === form.chapterId)?.topics || [] : tree.flatMap((chapter) => chapter.topics).find((topic) => topic._id === form.topicId)?.subtopics || [];
    const body = { name: { bn: form.bn, en: form.en }, order: siblings.length + 1 };
    if (form.type !== 'chapter') body.chapterId = form.chapterId;
    if (form.type === 'subtopic') body.topicId = form.topicId;
    try { await api(`/${form.type}s`, { method: 'POST', body: JSON.stringify(body) }); setForm((current) => ({ ...current, bn: '', en: '' })); load(); } catch (error) { setMessage(error.message); }
  };
  const edit = async (type, item) => {
    const bn = window.prompt('Bangla name', item.name.bn); if (bn === null) return;
    const en = window.prompt('English name', item.name.en); if (en === null) return;
    try { await api(`/${type}s/${item._id}`, { method: 'PATCH', body: JSON.stringify({ name: { bn, en } }) }); load(); } catch (error) { setMessage(error.message); }
  };
  const remove = async (type, item) => {
    if (!window.confirm(`Remove ${nameFor(item, language)}? Referenced items will be archived instead.`)) return;
    try { const result = await api(`/${type}s/${item._id}`, { method: 'DELETE' }); setMessage(result?.message || 'Syllabus item removed.'); load(); } catch (error) { setMessage(error.message); }
  };
  const reorder = async (type, siblings, index, direction) => {
    const next = [...siblings]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try { await api(`/${type}s/reorder`, { method: 'PATCH', body: JSON.stringify({ items: next.map((item, order) => ({ id: item._id, order: order + 1 })) }) }); load(); } catch (error) { setMessage(error.message); }
  };
  const Controls = ({ type, item, siblings, index }) => <span className="flex gap-1"><button onClick={() => reorder(type, siblings, index, -1)} className="btn btn-ghost btn-xs" title="Move up">↑</button><button onClick={() => reorder(type, siblings, index, 1)} className="btn btn-ghost btn-xs" title="Move down">↓</button><button onClick={() => edit(type, item)} className="btn btn-ghost btn-xs" aria-label="Edit"><Pencil size={13} /></button><button onClick={() => remove(type, item)} className="btn btn-ghost btn-xs text-error" aria-label="Archive or delete"><Trash2 size={13} /></button></span>;
  const topics = tree.find((chapter) => chapter._id === form.chapterId)?.topics || [];
  return <div className="mx-auto max-w-5xl p-5 md:p-10"><p className="text-[10px] font-bold tracking-widest text-base-content/50">CONTENT STRUCTURE</p><h1 className="mt-2 font-display text-4xl font-bold">Syllabus management</h1><p className="mt-2 text-sm text-base-content/60">Manage the Chapter → Topic → Subtopic structure. Referenced items are archived to preserve question history.</p>
    <form onSubmit={create} className="mt-6 grid gap-3 rounded-box border border-base-300 bg-base-100 p-4 md:grid-cols-5"><select value={form.type} onChange={(event) => setForm({ type: event.target.value, chapterId: '', topicId: '', bn: '', en: '' })} className="select select-bordered select-sm"><option value="chapter">Chapter</option><option value="topic">Topic</option><option value="subtopic">Subtopic</option></select>{form.type !== 'chapter' && <select required value={form.chapterId} onChange={(event) => setForm((current) => ({ ...current, chapterId: event.target.value, topicId: '' }))} className="select select-bordered select-sm"><option value="">Select chapter</option>{tree.map((chapter) => <option key={chapter._id} value={chapter._id}>{nameFor(chapter, language)}</option>)}</select>}{form.type === 'subtopic' && <select required value={form.topicId} onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))} className="select select-bordered select-sm"><option value="">Select topic</option>{topics.map((topic) => <option key={topic._id} value={topic._id}>{nameFor(topic, language)}</option>)}</select>}<input required value={form.bn} onChange={(event) => setForm((current) => ({ ...current, bn: event.target.value }))} placeholder="Bangla name" className="input input-bordered input-sm" /><input required value={form.en} onChange={(event) => setForm((current) => ({ ...current, en: event.target.value }))} placeholder="English name" className="input input-bordered input-sm" /><button className="btn btn-primary btn-sm"><Plus size={15} /> Add</button></form>{message && <p className="mt-3 text-sm text-error">{message}</p>}
    <section className="mt-6 rounded-box border border-base-300 bg-base-100 p-3">{tree.map((chapter, chapterIndex) => <div key={chapter._id} className="border-b border-base-300 last:border-0"><div className="flex items-center gap-2 rounded-btn p-3 hover:bg-base-200"><button onClick={() => toggle(chapter._id)} className="btn btn-ghost btn-xs">{expanded[chapter._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button><b className="flex-1">{chapterIndex + 1}. {nameFor(chapter, language)}</b><Controls type="chapter" item={chapter} siblings={tree} index={chapterIndex} /></div>{expanded[chapter._id] && <div className="ml-7 border-l border-primary/30 pl-3">{chapter.topics.map((topic, topicIndex) => <div key={topic._id}><div className="flex items-center gap-2 p-2"><button onClick={() => toggle(topic._id)} className="btn btn-ghost btn-xs">{expanded[topic._id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button><span className="flex-1 font-medium">{chapterIndex + 1}.{topicIndex + 1} {nameFor(topic, language)}</span><Controls type="topic" item={topic} siblings={chapter.topics} index={topicIndex} /></div>{expanded[topic._id] && <div className="ml-7 mb-2 border-l border-base-300 pl-3">{topic.subtopics.map((subtopic, subtopicIndex) => <div className="flex items-center gap-2 p-2 text-sm" key={subtopic._id}><span className="flex-1">{chapterIndex + 1}.{topicIndex + 1}.{subtopicIndex + 1} {nameFor(subtopic, language)}</span><Controls type="subtopic" item={subtopic} siblings={topic.subtopics} index={subtopicIndex} /></div>)}</div>}</div>)}</div>}</div>)}</section>
  </div>;
}
