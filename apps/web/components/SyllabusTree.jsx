'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from './LanguageProvider';

export default function SyllabusTree() {
  const { language } = useLanguage();
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  useEffect(() => { api('/syllabus/tree').then((result) => setTree(result.data)).catch(() => setTree([])); }, []);
  const toggle = (id) => setExpanded((current) => ({ ...current, [id]: !current[id] }));
  const label = (item) => item.name?.[language] || item.name?.bn || '';
  return <div className="mx-auto max-w-4xl p-5 md:p-10"><p className="text-[10px] font-bold tracking-widest text-base-content/50">HSC ICT</p><h1 className="mt-2 font-display text-4xl font-bold">Syllabus</h1><p className="mt-2 text-sm text-base-content/60">Explore each chapter, topic, and subtopic.</p><section className="mt-6 rounded-box border border-base-300 bg-base-100 p-3">{tree.map((chapter, chapterIndex) => <div key={chapter._id} className="border-b border-base-300 last:border-0"><button onClick={() => toggle(chapter._id)} className="flex w-full items-center gap-2 rounded-btn p-3 text-left hover:bg-base-200">{expanded[chapter._id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<b>{chapterIndex + 1}. {label(chapter)}</b></button>{expanded[chapter._id] && <div className="ml-7 border-l border-primary/30 pl-3 pb-2">{chapter.topics.map((topic, topicIndex) => <div key={topic._id}><button onClick={() => toggle(topic._id)} className="flex w-full items-center gap-2 rounded-btn p-2 text-left hover:bg-base-200">{expanded[topic._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<span className="font-medium">{chapterIndex + 1}.{topicIndex + 1} {label(topic)}</span></button>{expanded[topic._id] && <ul className="ml-7 mb-2 border-l border-base-300 pl-4 text-sm">{topic.subtopics.map((subtopic, subtopicIndex) => <li className="py-1" key={subtopic._id}>{chapterIndex + 1}.{topicIndex + 1}.{subtopicIndex + 1} {label(subtopic)}</li>)}</ul>}</div>)}</div>}</div>)}</section></div>;
}
