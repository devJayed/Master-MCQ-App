'use client';

import { Eye, EyeOff, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '../../components/LanguageProvider';
import { api } from '../../lib/api';

const text = (language, bn, en) => (language === 'bn' ? bn : en);
function PasswordInput({ name, label, language }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="form-control">
      <span className="label-text mb-2 font-semibold">
        {label}
        <span className="text-error"> *</span>
      </span>
      <div className="input input-bordered flex items-center gap-2">
        <KeyRound size={17} className="text-base-content/40" />
        <input
          required
          minLength="8"
          maxLength="128"
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete="new-password"
          className="min-w-0 grow outline-none"
        />
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-xs"
          onClick={() => setVisible((value) => !value)}
          aria-label={
            visible
              ? text(language, 'পাসওয়ার্ড লুকান', 'Hide password')
              : text(language, 'পাসওয়ার্ড দেখুন', 'Show password')
          }
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export default function ResetPassword() {
  const router = useRouter(),
    { language } = useLanguage();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))
      return setError(
        text(
          language,
          'পাসওয়ার্ডে অন্তত একটি অক্ষর ও একটি সংখ্যা থাকতে হবে।',
          'Password must contain at least one letter and one number.'
        )
      );
    if (values.password !== values.confirmPassword)
      return setError(text(language, 'পাসওয়ার্ড দুটি মিলছে না।', 'The passwords do not match.'));
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token)
      return setError(
        text(
          language,
          'রিসেট লিংকটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।',
          'The reset link is invalid or has expired.'
        )
      );
    setBusy(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, ...values }),
      });
      router.replace('/login?passwordReset=success');
    } catch (requestError) {
      setError(
        requestError.message === 'Password confirmation does not match.'
          ? text(language, 'পাসওয়ার্ড দুটি মিলছে না।', 'The passwords do not match.')
          : text(
              language,
              'রিসেট লিংকটি সঠিক নয় বা মেয়াদ শেষ হয়েছে। নতুন লিংকের জন্য আবার অনুরোধ করুন।',
              'The reset link is invalid or expired. Request a new link and try again.'
            )
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-md p-5 py-12 md:py-16">
      <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <header className="border-b border-base-300 bg-base-200/50 px-6 py-5">
          <p className="text-[10px] font-bold tracking-[.18em] text-primary">
            {text(language, 'নিরাপদ পাসওয়ার্ড রিসেট', 'SECURE PASSWORD RESET')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            {text(language, 'নতুন পাসওয়ার্ড বেছে নিন', 'Choose a new password')}
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            {text(
              language,
              'এমন একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন যা অন্য কোথাও ব্যবহার করেননি।',
              'Use a strong password that you do not use anywhere else.'
            )}
          </p>
        </header>
        <form onSubmit={submit} className="grid gap-5 p-6">
          <PasswordInput
            name="password"
            label={text(language, 'নতুন পাসওয়ার্ড', 'New password')}
            language={language}
          />
          <PasswordInput
            name="confirmPassword"
            label={text(language, 'নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm new password')}
            language={language}
          />
          <p className="-mt-2 text-xs text-base-content/50">
            {text(
              language,
              'কমপক্ষে ৮ অক্ষর এবং অন্তত একটি অক্ষর ও একটি সংখ্যা ব্যবহার করুন।',
              'Use at least 8 characters with at least one letter and one number.'
            )}
          </p>
          {error && (
            <div className="alert alert-error py-3 text-sm" role="alert">
              {error}
            </div>
          )}
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy && <span className="loading loading-spinner loading-xs" />}
            {busy
              ? text(language, 'রিসেট হচ্ছে…', 'Resetting…')
              : text(language, 'পাসওয়ার্ড রিসেট করুন', 'Reset password')}
          </button>
          <Link href="/forgot-password" className="text-center text-sm font-medium text-primary">
            {text(language, 'নতুন রিসেট লিংক নিন', 'Request a new reset link')}
          </Link>
        </form>
      </section>
    </main>
  );
}
