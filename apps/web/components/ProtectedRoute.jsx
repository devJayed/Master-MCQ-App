'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';

const text = {
  en: {
    checking: 'Checking your session…',
    title: 'Sign in to continue',
    description: 'This area contains account-specific learning data.',
    login: 'Login',
    register: 'Register',
  },
  bn: {
    checking: 'আপনার সেশন যাচাই করা হচ্ছে…',
    title: 'চালিয়ে যেতে সাইন ইন করুন',
    description: 'এই অংশে আপনার অ্যাকাউন্টভিত্তিক শেখার তথ্য রয়েছে।',
    login: 'লগইন',
    register: 'নিবন্ধন',
  },
};

export default function ProtectedRoute({ children, roles = ['student', 'teacher', 'moderator'] }) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const copy = text[language] || text.en;

  useEffect(() => {
    if (!loading && user && !roles.includes(user.role)) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [loading, user, roles, router]);

  if (loading) return <div className="p-10 text-center text-sm">{copy.checking}</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <h1 className="font-display text-3xl font-bold">{copy.title}</h1>
        <p className="mt-3 text-sm text-base-content/60">{copy.description}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(pathname)}`}>
            {copy.login}
          </Link>
          <Link className="btn btn-outline" href="/register">
            {copy.register}
          </Link>
        </div>
      </div>
    );
  }

  return roles.includes(user.role) ? children : null;
}
