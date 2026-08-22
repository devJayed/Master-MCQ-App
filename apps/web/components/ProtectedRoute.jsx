'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
export default function ProtectedRoute({ children, roles = ['student', 'teacher', 'moderator'] }) {
  const { user, loading } = useAuth(), router = useRouter(), pathname = usePathname();
  useEffect(() => { if (!loading && user && !roles.includes(user.role)) router.replace(`/${user.role}/dashboard`); }, [loading, user, roles, router]);
  if (loading) return <div className="p-10 text-center text-sm">Checking your session…</div>;
  if (!user) return <div className="mx-auto max-w-lg p-10 text-center"><h1 className="font-display text-3xl font-bold">Sign in to continue</h1><p className="mt-3 text-sm text-base-content/60">This area contains account-specific learning data.</p><div className="mt-6 flex justify-center gap-3"><Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(pathname)}`}>Login</Link><Link className="btn btn-outline" href="/register">Register</Link></div></div>;
  return roles.includes(user.role) ? children : null;
}
