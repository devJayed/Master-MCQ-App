'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';
export default function ChangePassword() {
  const router = useRouter(),
    [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: form.get('currentPassword'),
          newPassword: form.get('newPassword'),
        }),
      });
      router.replace('/login');
    } catch (x) {
      setError(x.message);
    }
  };
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-md p-6 pt-20">
        <form onSubmit={submit} className="card card-body border border-base-300 bg-base-100">
          <h1 className="font-display text-3xl font-bold">Change password</h1>
          <input
            required
            type="password"
            name="currentPassword"
            className="input input-bordered"
            placeholder="Current password"
          />
          <input
            required
            minLength="8"
            type="password"
            name="newPassword"
            className="input input-bordered"
            placeholder="New password (8+ characters)"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <button className="btn btn-primary">Change password</button>
        </form>
      </main>
    </ProtectedRoute>
  );
}
