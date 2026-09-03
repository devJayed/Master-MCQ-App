'use client';

import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';

const text = (language, bn, en) => (language === 'bn' ? bn : en);
const API_ERRORS = {
  'Email already registered': [
    'এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে।',
    'An account already exists with this email.',
  ],
  'Mobile number already registered': [
    'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে।',
    'An account already exists with this mobile number.',
  ],
  'Password confirmation does not match.': [
    'পাসওয়ার্ড দুটি মিলছে না।',
    'The passwords do not match.',
  ],
  'Too many requests. Please try again later.': [
    'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'Too many attempts. Please try again later.',
  ],
  'Incorrect email or password': ['ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।', 'Incorrect email or password.'],
  'Please select a valid gender.': [
    'অনুগ্রহ করে একটি বৈধ লিঙ্গ নির্বাচন করুন।',
    'Please select a valid gender.',
  ],
};

const GENDER_OPTIONS = [
  { value: 'male', bn: 'পুরুষ', en: 'Male' },
  { value: 'female', bn: 'নারী', en: 'Female' },
  { value: 'other', bn: 'অন্যান্য', en: 'Other' },
];

function PasswordField({ name, label, autoComplete, language, confirm = false }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="form-control">
      <span className="label-text mb-2 font-semibold">
        {label}
        <span className="text-error" aria-hidden="true">
          {' '}
          *
        </span>
      </span>
      <div className="input input-bordered flex items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-primary">
        <LockKeyhole size={17} className="shrink-0 text-base-content/40" />
        <input
          required
          minLength="8"
          maxLength="128"
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          className="min-w-0 grow outline-none"
          aria-describedby={!confirm ? 'password-help' : undefined}
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

export default function AuthForm({ mode }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const { language } = useLanguage();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState('');
  const register = mode === 'register';

  useEffect(() => {
    if (!register && new URLSearchParams(window.location.search).get('passwordReset') === 'success')
      setNotice(
        text(
          language,
          'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।',
          'Your password was reset successfully. Sign in with your new password.'
        )
      );
  }, [language, register]);

  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError('');
    const form = new FormData(formElement);
    const values = Object.fromEntries(form);
    if (mfaChallenge) {
      setBusy(true);
      try {
        const result = await api('/auth/login/mfa', {
          method: 'POST',
          body: JSON.stringify({ challenge: mfaChallenge, code: values.mfaCode }),
        });
        setUser(result.data.user);
        router.replace(`/${result.data.user.role}/dashboard`);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (register) {
      if (!/[A-Za-z]/.test(values.nameEnglish || ''))
        return setError(
          text(
            language,
            'ইংরেজি নামে অন্তত একটি ইংরেজি অক্ষর লিখুন।',
            'Enter at least one English letter in the English name.'
          )
        );
      if (!/[\u0980-\u09FF]/.test(values.nameBangla || ''))
        return setError(
          text(
            language,
            'বাংলা নামে বাংলা অক্ষর ব্যবহার করুন।',
            'Use Bangla characters in the Bangla name.'
          )
        );
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(String(values.mobileNumber).replace(/[\s()-]/g, '')))
        return setError(
          text(
            language,
            'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।',
            'Enter a valid Bangladesh mobile number.'
          )
        );
      if (!GENDER_OPTIONS.some(({ value }) => value === values.gender))
        return setError(
          text(
            language,
            'অনুগ্রহ করে আপনার লিঙ্গ নির্বাচন করুন।',
            'Please select your gender.'
          )
        );
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
    }
    setBusy(true);
    try {
      const result = await api(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      if (result.data.verificationRequired) {
        formElement.reset();
        setNotice('Check your email and use the verification link before signing in.');
        return;
      }
      if (result.data.mfaRequired) {
        setMfaChallenge(result.data.challenge);
        setNotice('A sign-in code was sent to your email.');
        return;
      }
      setUser(result.data.user);
      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null;
      router.replace(safeNext || `/${result.data.user.role}/dashboard`);
    } catch (requestError) {
      const localized = API_ERRORS[requestError.message];
      setError(
        localized
          ? text(language, ...localized)
          : requestError.message ||
              text(language, 'অনুরোধটি সম্পন্ন করা যায়নি।', 'The request could not be completed.')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={`mx-auto p-5 py-12 md:py-16 ${register ? 'max-w-2xl' : 'max-w-md'}`}>
      <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 bg-base-200/50 px-6 py-5 md:px-8">
          <p className="text-[10px] font-bold tracking-[.18em] text-primary">
            {text(
              language,
              register ? 'শেখার যাত্রা শুরু করুন' : 'আবার স্বাগতম',
              register ? 'START YOUR LEARNING JOURNEY' : 'WELCOME BACK'
            )}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            {text(
              language,
              register ? 'আপনার অ্যাকাউন্ট তৈরি করুন' : 'আপনার অ্যাকাউন্টে প্রবেশ করুন',
              register ? 'Create your account' : 'Sign in to your account'
            )}
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            {text(
              language,
              register
                ? 'অগ্রগতি, পরীক্ষার ইতিহাস ও ব্যক্তিগত বিশ্লেষণ নিরাপদে সংরক্ষণ করুন।'
                : 'আপনার সংরক্ষিত শেখার তথ্য দেখতে সাইন ইন করুন।',
              register
                ? 'Save your progress, test history, and personalized analytics securely.'
                : 'Sign in to access your saved learning data.'
            )}
          </p>
        </div>
        <form onSubmit={submit} className="grid gap-5 p-6 md:p-8">
          {register && (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  {text(language, 'পূর্ণ নাম (ইংরেজি)', 'Full name (English)')}
                  <span className="text-error"> *</span>
                </span>
                <div className="input input-bordered flex items-center gap-2">
                  <UserRound size={17} className="text-base-content/40" />
                  <input
                    required
                    minLength="2"
                    maxLength="80"
                    name="nameEnglish"
                    autoComplete="name"
                    className="min-w-0 grow outline-none"
                    placeholder="Jayed Hossain"
                  />
                </div>
              </label>
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  {text(language, 'পূর্ণ নাম (বাংলা)', 'Full name (Bangla)')}
                  <span className="text-error"> *</span>
                </span>
                <div className="input input-bordered flex items-center gap-2">
                  <UserRound size={17} className="text-base-content/40" />
                  <input
                    required
                    minLength="2"
                    maxLength="80"
                    name="nameBangla"
                    autoComplete="name"
                    className="min-w-0 grow outline-none"
                    placeholder="জায়েদ হোসাইন"
                  />
                </div>
              </label>
            </div>
          )}
          {register && (
            <fieldset className="form-control">
              <legend className="label-text mb-2 font-semibold">
                {text(language, 'লিঙ্গ', 'Gender')}
                <span className="text-error" aria-hidden="true">
                  {' '}
                  *
                </span>
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {GENDER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 transition hover:border-primary/50 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
                  >
                    <input
                      required
                      type="radio"
                      name="gender"
                      value={option.value}
                      className="radio radio-primary radio-sm"
                    />
                    <span className="font-medium">{text(language, option.bn, option.en)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className={`grid gap-5 ${register ? 'md:grid-cols-2' : ''}`}>
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
                  maxLength="254"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  className="min-w-0 grow outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </label>
            {register && (
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  {text(language, 'মোবাইল নম্বর', 'Mobile number')}
                  <span className="text-error"> *</span>
                </span>
                <div className="input input-bordered flex items-center gap-2">
                  <Phone size={17} className="text-base-content/40" />
                  <input
                    required
                    type="tel"
                    name="mobileNumber"
                    autoComplete="tel"
                    inputMode="tel"
                    className="min-w-0 grow outline-none"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <span className="mt-1 text-xs text-base-content/50">
                  {text(language, 'বাংলাদেশি নম্বর: 01XXXXXXXXX', 'Bangladesh format: 01XXXXXXXXX')}
                </span>
              </label>
            )}
          </div>
          <div className={`grid gap-5 ${register ? 'md:grid-cols-2' : ''}`}>
            <PasswordField
              name="password"
              label={text(language, 'পাসওয়ার্ড', 'Password')}
              autoComplete={register ? 'new-password' : 'current-password'}
              language={language}
            />
            {register && (
              <PasswordField
                name="confirmPassword"
                label={text(language, 'পাসওয়ার্ড নিশ্চিত করুন', 'Confirm password')}
                autoComplete="new-password"
                language={language}
                confirm
              />
            )}
          </div>
          {register && (
            <p id="password-help" className="-mt-2 text-xs text-base-content/50">
              {text(
                language,
                'কমপক্ষে ৮ অক্ষর এবং অন্তত একটি অক্ষর ও একটি সংখ্যা ব্যবহার করুন।',
                'Use at least 8 characters with at least one letter and one number.'
              )}
            </p>
          )}
          {error && (
            <div className="alert alert-error py-3 text-sm" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="alert alert-success py-3 text-sm" role="status">
              {notice}
            </div>
          )}
          {mfaChallenge && (
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Sign-in code</span>
              <input
                required
                name="mfaCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength="6"
                className="input input-bordered"
                placeholder="6-digit code"
              />
            </label>
          )}
          <button disabled={busy} className="btn btn-primary mt-1" type="submit">
            {busy && <span className="loading loading-spinner loading-xs" />}
            {busy
              ? text(language, 'অনুগ্রহ করে অপেক্ষা করুন…', 'Please wait…')
              : text(
                  language,
                  register ? 'অ্যাকাউন্ট তৈরি করুন' : 'সাইন ইন করুন',
                  register ? 'Create account' : 'Sign in'
                )}
          </button>
          {!register && (
            <Link className="text-center text-sm font-medium text-primary" href="/forgot-password">
              {text(language, 'পাসওয়ার্ড ভুলে গেছেন?', 'Forgot password?')}
            </Link>
          )}
          <p className="text-center text-sm">
            {text(
              language,
              register ? 'আগেই অ্যাকাউন্ট আছে?' : 'নতুন ব্যবহারকারী?',
              register ? 'Already have an account?' : 'New here?'
            )}{' '}
            <Link className="font-semibold text-primary" href={register ? '/login' : '/register'}>
              {text(
                language,
                register ? 'সাইন ইন করুন' : 'নিবন্ধন করুন',
                register ? 'Sign in' : 'Register'
              )}
            </Link>
          </p>
          <Link className="text-center text-xs text-base-content/60" href="/student/dashboard">
            {text(language, 'অতিথি হিসেবে চালিয়ে যান', 'Continue as guest')}
          </Link>
        </form>
      </section>
    </main>
  );
}
