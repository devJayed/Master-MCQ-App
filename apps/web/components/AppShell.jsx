'use client';

import {
    BookOpen,
    ChartNoAxesCombined,
    ClipboardList,
    FilePlus2,
    FileQuestion,
    FileSpreadsheet,
    Languages,
    LayoutDashboard,
    Menu,
    PlusCircle,
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';

const roleConfig = {
  student: {
    label: 'Student learning space',
    name: 'Rahim Ahmed',
    initials: 'RA',
    footer: 'LEARNING WITH',
    footerName: 'Jayed Hossain',
    links: [
      ['/student/dashboard', 'Dashboard', LayoutDashboard],
      ['/student/practice', 'Practice', BookOpen],
      ['/student/syllabus', 'Syllabus', BookOpen],
      ['/student/create-test', 'Create Test', PlusCircle],
      ['/student/history', 'Exam History', ClipboardList],
      ['/student/performance', 'Performance', ChartNoAxesCombined],
    ],
    switchTo: ['/moderator/dashboard', 'moderator space'],
  },
  moderator: {
    label: 'Moderator workspace',
    name: 'Nusrat Sultana',
    initials: 'NS',
    footer: 'CONTENT TEAM',
    footerName: 'HSC ICT Question Bank',
    links: [
      ['/moderator/dashboard', 'Dashboard', LayoutDashboard],
      ['/moderator/questions', 'Question Bank', FileQuestion],
      ['/moderator/questions/create', 'Add Question', FilePlus2],
      ['/moderator/questions/import', 'Import Questions', FileSpreadsheet],
      ['/moderator/syllabus', 'Syllabus Config', BookOpen],
      ['/moderator/reports', 'Question Reports', ShieldCheck],
    ],
    switchTo: ['/student/dashboard', 'student space'],
  },
  teacher: {
    label: 'Teacher workspace',
    name: 'Jayed Hossain',
    initials: 'JH',
    footer: 'HSC ICT PORTAL',
    footerName: 'Teacher control center',
    links: [
      ['/teacher/dashboard', 'Dashboard', LayoutDashboard],
      ['/teacher/students', 'Students', Users],
      ['/teacher/questions', 'Question Bank', FileQuestion],
      ['/teacher/syllabus', 'Syllabus', BookOpen],
      ['/teacher/analytics', 'Analytics', ChartNoAxesCombined],
    ],
    switchTo: ['/student/dashboard', 'student space'],
  },
};

function Navigation({ config, role, pathname, onNavigate, isGuest }) {
  return (
    <>
      <Link
        onClick={onNavigate}
        className="mb-10 flex items-center gap-3 px-2"
        href={`/${role}/dashboard`}
      >
        <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-2xl text-white">
          J
        </span>
        <span>
          <b className="block">Jayed&apos;s</b>
          <small className="text-[10px] font-bold tracking-widest text-base-content/50">
            HSC ICT MCQ
          </small>
        </span>
      </Link>
      <ul className="menu gap-1 p-0">
        {config.links.filter(([href]) => !isGuest || !['/student/history', '/student/performance'].includes(href)).map(([href, label, Icon]) => (
          <li key={href}>
            <Link
              onClick={onNavigate}
              className={pathname === href ? 'active font-bold' : ''}
              href={href}
            >
              <Icon size={18} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-box bg-secondary p-4">
        <p className="text-[10px] font-bold tracking-widest text-base-content/50">
          {config.footer}
        </p>
        <b className="text-sm">{config.footerName}</b>
        <Link
          onClick={onNavigate}
          className="mt-3 block text-xs font-bold text-primary"
          href={config.switchTo[0]}
        >
          View {config.switchTo[1]} →
        </Link>
      </div>
    </>
  );
}

export default function AppShell({ children, role = 'student' }) {
  const pathname = usePathname(),
    { language, toggleLanguage } = useLanguage(),
    [drawerOpen, setDrawerOpen] = useState(false),
    config = roleConfig[role],
    { user, loading, logout } = useAuth();
  const displayName = user
    ? language === 'en'
      ? user.nameEnglish || user.name || user.nameBangla
      : user.nameBangla || user.nameEnglish || user.name
    : '';
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-base-300 bg-base-100 p-5 lg:flex lg:flex-col">
        <Navigation config={config} role={role} pathname={pathname} isGuest={!user} />
      </aside>
      <div
        aria-hidden={!drawerOpen}
        className={`fixed inset-0 z-40 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}
      >
        <button
          aria-label="Close navigation menu"
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-neutral/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          aria-label="Mobile navigation"
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-base-100 p-5 shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="btn btn-circle btn-ghost btn-sm absolute right-4 top-5"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          <Navigation
            config={config}
            role={role}
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
            isGuest={!user}
          />
        </aside>
      </div>
      <main className="min-w-0 flex-1">
        <header className="navbar h-18 border-b border-base-300 bg-base-200/70 px-5 lg:px-10">
          <div className="flex flex-1 items-center gap-2 text-sm text-base-content/55">
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn btn-circle btn-ghost btn-sm lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={21} />
            </button>
            <span>{user ? config.label : 'Guest practice mode'}</span>
          </div>
          <div className="flex-none gap-3">
            <button
              onClick={toggleLanguage}
              className="btn btn-ghost btn-sm gap-1 text-xs"
              aria-label="Change language"
            >
              <Languages size={16} />
              {language === 'bn' ? 'EN' : 'বাংলা'}
            </button>
            <button className="btn btn-circle btn-ghost btn-sm" aria-label="Notifications">
              ♧
            </button>
            <div className="avatar placeholder">
              <div className="w-9 rounded-full bg-primary text-xs text-primary-content">
                {user ? displayName.slice(0, 2).toUpperCase() : 'G'}
              </div>
            </div>
            {loading ? null : user ? <><span className="hidden text-sm font-semibold sm:inline">{displayName}</span><button onClick={logout} className="btn btn-ghost btn-sm">Logout</button></> : <div className="flex gap-1"><Link href="/login" className="btn btn-ghost btn-sm">Login</Link><Link href="/register" className="btn btn-primary btn-sm">Register</Link></div>}
          </div>
        </header>
        {!loading && !user && <div className="border-b border-primary/20 bg-primary/10 px-5 py-2 text-center text-xs">Guest mode: your tests work normally, but results are temporary. <Link className="font-bold text-primary" href="/register">Create an account</Link> to save progress.</div>}
        {children}
      </main>
    </div>
  );
}
