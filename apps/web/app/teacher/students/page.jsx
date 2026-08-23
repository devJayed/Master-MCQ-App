'use client';

import { AlertTriangle, Search, UserCheck, Users, UserX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../../components/LanguageProvider';
import { api } from '../../../lib/api';

const text = (language, bangla, english) => (language === 'bn' ? bangla : english);
const number = (value, language) =>
  Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');
const date = (value, language) =>
  value
    ? new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
        dateStyle: 'medium',
      }).format(new Date(value))
    : text(language, 'এখনও কোনো টেস্ট দেয়নি', 'No tests yet');

export default function TeacherStudents() {
  const { language } = useLanguage();
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/analytics/teacher/students');
      setStudents(result.data || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || text(language, 'শিক্ষার্থীদের তথ্য লোড করা যায়নি।', 'Student data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStatus = status === 'all' || (status === 'active' ? student.isActive : !student.isActive);
      const matchesQuery = !needle || [student.nameBangla, student.nameEnglish, student.name, student.email]
        .some((value) => value?.toLowerCase().includes(needle));
      return matchesStatus && matchesQuery;
    });
  }, [query, status, students]);

  const active = students.filter((student) => student.isActive).length;
  const displayName = (student) =>
    (language === 'bn'
      ? student.nameBangla || student.nameEnglish
      : student.nameEnglish || student.nameBangla) ||
    student.name || text(language, 'শিক্ষার্থী', 'Student');

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-10">
      <header>
        <p className="text-[10px] font-bold tracking-[.18em] text-base-content/50">
          {text(language, 'শিক্ষার্থী ব্যবস্থাপনা', 'STUDENT MANAGEMENT')}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">
          {text(language, 'শিক্ষার্থীরা', 'Students')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/60">
          {text(language, 'শিক্ষার্থীদের অংশগ্রহণ, টেস্টের অগ্রগতি ও সাম্প্রতিক কার্যক্রম এক জায়গা থেকে দেখুন।', 'Review student engagement, test progress, and recent activity in one place.')}
        </p>
      </header>

      {error && <div className="alert alert-error mt-6"><AlertTriangle size={19} /><span className="flex-1">{error}</span><button className="btn btn-sm" onClick={loadStudents}>{text(language, 'আবার চেষ্টা করুন', 'Retry')}</button></div>}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [text(language, 'মোট শিক্ষার্থী', 'Total students'), students.length, Users, 'text-primary'],
          [text(language, 'সক্রিয় অ্যাকাউন্ট', 'Active accounts'), active, UserCheck, 'text-success'],
          [text(language, 'নিষ্ক্রিয় অ্যাকাউন্ট', 'Inactive accounts'), students.length - active, UserX, 'text-error'],
        ].map(([label, value, Icon, tone]) => <article className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm" key={label}><div className="flex items-center justify-between"><p className="text-xs text-base-content/60">{label}</p><Icon className={tone} size={21} /></div><b className="mt-3 block font-display text-3xl">{number(value, language)}</b></article>)}
      </section>

      <section className="mt-6 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-base-300 p-4 sm:flex-row">
          <label className="input input-bordered flex flex-1 items-center gap-2"><Search size={17} className="text-base-content/45" /><input className="grow" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(language, 'নাম বা ইমেইল দিয়ে খুঁজুন', 'Search by name or email')} /></label>
          <select className="select select-bordered" value={status} onChange={(event) => setStatus(event.target.value)} aria-label={text(language, 'অ্যাকাউন্টের অবস্থা', 'Account status')}>
            <option value="all">{text(language, 'সব অ্যাকাউন্ট', 'All accounts')}</option>
            <option value="active">{text(language, 'সক্রিয়', 'Active')}</option>
            <option value="inactive">{text(language, 'নিষ্ক্রিয়', 'Inactive')}</option>
          </select>
        </div>
        {loading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div className="skeleton h-16" key={item} />)}</div> : filtered.length ? (
          <div className="overflow-x-auto"><table className="table"><thead><tr><th>{text(language, 'শিক্ষার্থী', 'Student')}</th><th>{text(language, 'অবস্থা', 'Status')}</th><th>{text(language, 'টেস্ট', 'Tests')}</th><th>{text(language, 'গড় স্কোর', 'Average score')}</th><th>{text(language, 'সর্বশেষ কার্যক্রম', 'Last activity')}</th></tr></thead><tbody>{filtered.map((student) => <tr key={student._id}><td><div className="font-semibold">{displayName(student)}</div><div className="text-xs text-base-content/50">{student.email}</div></td><td><span className={`badge badge-sm ${student.isActive ? 'badge-success' : 'badge-ghost'}`}>{text(language, student.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়', student.isActive ? 'Active' : 'Inactive')}</span></td><td>{number(student.attempts, language)}</td><td className="font-semibold">{number(student.averageScore, language)}%</td><td className="text-sm text-base-content/60">{date(student.lastAttemptAt, language)}</td></tr>)}</tbody></table></div>
        ) : <div className="p-12 text-center text-sm text-base-content/55">{text(language, 'কোনো শিক্ষার্থী পাওয়া যায়নি।', 'No students found.')}</div>}
      </section>
    </main>
  );
}
