'use client';

import {
    Bell,
    BookOpen,
    ChartNoAxesCombined,
    ChevronDown,
    ClipboardList,
    FilePlus2,
    FileQuestion,
    FileSpreadsheet,
    LayoutDashboard,
    LogIn,
    LogOut,
    Menu,
    MonitorSmartphone,
    PlusCircle,
    ShieldCheck,
    User,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
      ['/student/questions', 'Written Questions', BookOpen, 'লিখিত প্রশ্ন'],
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
      ['/teacher/questions/create', 'Add Question', FilePlus2],
      ['/teacher/questions/import', 'Import Questions', FileSpreadsheet],
      ['/teacher/syllabus', 'Syllabus', BookOpen],
      ['/teacher/analytics', 'Analytics', ChartNoAxesCombined],
    ],
    switchTo: ['/student/dashboard', 'student space'],
  },
};

const languageSpring = { type: 'spring', stiffness: 520, damping: 34 };

function LanguageToggle({ language, onToggle }) {
  const isEnglish = language === 'en';
  const nextLanguageLabel = isEnglish ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English';

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className="relative h-9 w-32 shrink-0 overflow-hidden rounded-full border border-base-300 bg-base-100 p-1 text-xs font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={nextLanguageLabel}
      aria-pressed={isEnglish}
      title={nextLanguageLabel}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.97 }}
      transition={languageSpring}
    >
      <motion.span
        aria-hidden="true"
        className="absolute left-1 top-1 grid size-7 place-items-center rounded-full bg-primary shadow-sm"
        animate={{ x: isEnglish ? 92 : 0 }}
        transition={languageSpring}
      >
        <span className="size-2 rounded-full bg-primary-content" />
      </motion.span>

      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={language}
          aria-hidden="true"
          className={`absolute inset-y-0 flex items-center whitespace-nowrap ${
            isEnglish ? 'left-3' : 'right-3'
          }`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {isEnglish ? 'English' : 'বাংলা'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function Navigation({ config, role, pathname, onNavigate, isGuest, language }) {
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
        {config.links.filter(([href]) => !isGuest || !['/student/history', '/student/performance'].includes(href)).map(([href, label, Icon, bnLabel]) => (
          <li key={href}>
            <Link
              onClick={onNavigate}
              className={pathname === href ? 'active font-bold' : ''}
              href={href}
            >
              <Icon size={18} />
              {language === 'bn' && bnLabel ? bnLabel : label}
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
    [avatarError, setAvatarError] = useState(false),
    config = roleConfig[role],
    { user, loading, logout } = useAuth();
  const avatarUrl = user?.profileImage || user?.avatar || user?.photo || user?.imageUrl || '';
  const displayName = user
    ? language === 'en'
      ? user.nameEnglish || user.name || user.nameBangla
      : user.nameBangla || user.nameEnglish || user.name
    : '';
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);
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
        <Navigation config={config} role={role} pathname={pathname} isGuest={!user} language={language} />
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
            language={language}
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
            <span>
              {user
                ? config.label
                : language === 'bn'
                  ? 'অতিথি অনুশীলন মোড'
                  : 'Guest practice mode'}
            </span>
          </div>
          <div className="flex flex-none items-center gap-2">
            <LanguageToggle language={language} onToggle={toggleLanguage} />
            <button className="btn btn-circle btn-ghost btn-sm hidden sm:inline-flex" aria-label={language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}>
              <Bell size={18} />
            </button>
            {loading ? (
              <span className="loading loading-spinner loading-sm text-primary" />
            ) : user ? (
              <details className="dropdown dropdown-end">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-base-300 bg-base-100 py-1 pl-1 pr-2 shadow-sm transition hover:border-primary/40 hover:bg-base-200">
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                    {avatarUrl && !avatarError ? (
                      <img src={avatarUrl} alt="" className="size-full object-cover" onError={() => setAvatarError(true)} />
                    ) : (
                      <User size={18} aria-hidden="true" />
                    )}
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{displayName}</span>
                  <ChevronDown size={14} className="text-base-content/45" />
                </summary>
                <div className="dropdown-content z-30 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
                  <div className="border-b border-base-300 px-3 py-2">
                    <p className="truncate text-sm font-bold">{displayName}</p>
                    {user.email && <p className="mt-0.5 truncate text-xs text-base-content/50">{user.email}</p>}
                  </div>
                  <Link href="/change-password" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200">
                    <User size={16} /> {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change password'}
                  </Link>
                  <Link href="/sessions" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-base-200">
                    <MonitorSmartphone size={16} /> Active sessions
                  </Link>
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10">
                    <LogOut size={16} /> {language === 'bn' ? 'লগআউট' : 'Logout'}
                  </button>
                </div>
              </details>
            ) : (
              <div className="flex items-center gap-1 rounded-full border border-base-300 bg-base-100 p-1 shadow-sm">
                <Link href="/login" className="btn btn-ghost btn-sm gap-1.5 rounded-full px-3">
                  <LogIn size={15} /> <span className="hidden sm:inline">{language === 'bn' ? 'লগইন' : 'Login'}</span>
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm gap-1.5 rounded-full px-3">
                  <UserPlus size={15} /> <span className="hidden sm:inline">{language === 'bn' ? 'নিবন্ধন' : 'Register'}</span>
                </Link>
              </div>
            )}
          </div>
        </header>
        {!loading && !user && <div className="border-b border-primary/20 bg-primary/10 px-5 py-2 text-center text-xs">{language === 'bn' ? <>অতিথি মোডে পরীক্ষা স্বাভাবিকভাবে চলবে, তবে ফলাফল সাময়িক। অগ্রগতি সংরক্ষণ করতে <Link className="font-bold text-primary" href="/register">অ্যাকাউন্ট খুলুন</Link>।</> : <>Guest mode: your tests work normally, but results are temporary. <Link className="font-bold text-primary" href="/register">Create an account</Link> to save progress.</>}</div>}
        {children}
      </main>
    </div>
  );
}
