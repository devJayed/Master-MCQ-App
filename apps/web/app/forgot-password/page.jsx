'use client';

import { ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../../components/LanguageProvider';
import { api } from '../../lib/api';

const text = (language, bn, en) => (language === 'bn' ? bn : en);

export default function ForgotPassword() {
  const { language } = useLanguage();
  const [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    const email = String(new FormData(event.currentTarget).get('email') || '')
      .trim()
      .toLowerCase();
    try {
      await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setMessage(
        text(
          language,
          'এই ইমেইলে কোনো অ্যাকাউন্ট থাকলে পাসওয়ার্ড রিসেটের লিংক পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।',
          'If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.'
        )
      );
    } catch (requestError) {
      setError(
        requestError.message === 'Too many requests. Please try again later.'
          ? text(
              language,
              'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
              'Too many attempts. Please try again later.'
            )
          : text(
              language,
              'রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।',
              'The reset link could not be sent. Please try again.'
            )
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-md p-5 py-12 md:py-16">
      <Link href="/login" className="btn btn-ghost btn-sm mb-4 -ml-3">
        <ArrowLeft size={16} />
        {text(language, 'সাইন ইনে ফিরুন', 'Back to sign in')}
      </Link>
      <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <header className="border-b border-base-300 bg-base-200/50 px-6 py-5">
          <p className="text-[10px] font-bold tracking-[.18em] text-primary">
            {text(language, 'অ্যাকাউন্ট পুনরুদ্ধার', 'ACCOUNT RECOVERY')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            {text(language, 'পাসওয়ার্ড রিসেট করুন', 'Reset your password')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-base-content/60">
            {text(
              language,
              'আপনার অ্যাকাউন্টের ইমেইল লিখুন। ১৫ মিনিটের জন্য কার্যকর একটি নিরাপদ রিসেট লিংক পাঠানো হবে।',
              'Enter the email for your account. We will send a secure reset link that remains valid for 15 minutes.'
            )}
          </p>
        </header>
        <form onSubmit={submit} className="grid gap-5 p-6">
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">
              {text(language, 'ইমেইল', 'Email')}
              <span className="text-error"> *</span>
            </span>
            <div className="input input-bordered flex items-center gap-2">
              <Mail size={17} className="text-base-content/40" />
              <input
                required
                type="email"
                name="email"
                maxLength="254"
                autoComplete="email"
                inputMode="email"
                className="min-w-0 grow outline-none"
                placeholder="name@example.com"
              />
            </div>
          </label>
          {message && (
            <div className="alert alert-success items-start py-3 text-sm" role="status">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error py-3 text-sm" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-xs" /> : <Send size={16} />}{' '}
            {busy
              ? text(language, 'পাঠানো হচ্ছে…', 'Sending…')
              : text(language, 'রিসেট লিংক পাঠান', 'Send reset link')}
          </button>
          <p className="text-center text-xs leading-5 text-base-content/50">
            {text(
              language,
              'নিরাপত্তার জন্য কোনো ইমেইল নিবন্ধিত কি না তা আমরা প্রকাশ করি না।',
              'For your security, we do not reveal whether an email is registered.'
            )}
          </p>
        </form>
      </section>
    </main>
  );
}
