'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { api } from '../../lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setError('Verification token is missing.');
      return;
    }
    api('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((result) => {
        setUser(result.data.user);
        router.replace(`/${result.data.user.role}/dashboard`);
      })
      .catch((requestError) => setError(requestError.message));
  }, [router, setUser]);

  return (
    <main className="mx-auto max-w-md p-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Verifying your email</h1>
      {error ? (
        <div className="mt-6">
          <div className="alert alert-error text-sm">{error}</div>
          <Link href="/login" className="btn btn-primary mt-5">Return to login</Link>
        </div>
      ) : (
        <span className="loading loading-spinner loading-lg mt-8 text-primary" />
      )}
    </main>
  );
}
