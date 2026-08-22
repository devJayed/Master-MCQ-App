'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthProvider';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form)),
      });
      setUser(result.data.user);
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next || `/${result.data.user.role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6 pt-20">
      <section className="card border border-base-300 bg-base-100">
        <form onSubmit={submit} className="card-body">
          <h1 className="font-display text-3xl font-bold">{register ? 'Create your account' : 'Welcome back'}</h1>
          <p className="text-sm text-base-content/60">
            {register ? 'Save your progress and access your learning history.' : 'Sign in to access your account.'}
          </p>
          {register && (
            <>
              <label className="form-control">
                <span className="label-text">English name</span>
                <input required minLength="2" name="nameEnglish" className="input input-bordered" />
              </label>
              <label className="form-control">
                <span className="label-text">Bangla name</span>
                <input required minLength="2" name="nameBangla" className="input input-bordered" />
              </label>
            </>
          )}
          <label className="form-control">
            <span className="label-text">Email</span>
            <input required type="email" name="email" className="input input-bordered" />
          </label>
          <label className="form-control">
            <span className="label-text">Password</span>
            <input required minLength="8" type="password" name="password" className="input input-bordered" />
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
          <button disabled={busy} className="btn btn-primary mt-2">
            {busy ? 'Please wait…' : register ? 'Register' : 'Login'}
          </button>
          {!register && <Link className="text-center text-sm text-primary" href="/forgot-password">Forgot password?</Link>}
          <p className="text-center text-sm">
            {register ? 'Already registered?' : 'New here?'}{' '}
            <Link className="text-primary" href={register ? '/login' : '/register'}>{register ? 'Login' : 'Register'}</Link>
          </p>
          <Link className="text-center text-xs text-base-content/60" href="/student/dashboard">Continue as guest</Link>
        </form>
      </section>
    </main>
  );
}
