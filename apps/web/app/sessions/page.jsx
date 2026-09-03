'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await api('/auth/sessions');
      setSessions(result.data);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (session) => {
    try {
      await api(`/auth/sessions/${session.id}`, { method: 'DELETE' });
      if (session.current) {
        window.location.assign('/login');
        return;
      }
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-3xl p-6 py-12">
        <h1 className="font-display text-3xl font-bold">Active sessions</h1>
        <p className="mt-2 text-sm text-base-content/60">
          Review browsers that can access your account and revoke any you do not recognize.
        </p>
        {error && <div className="alert alert-error mt-6 text-sm">{error}</div>}
        {loading ? (
          <span className="loading loading-spinner mt-8" />
        ) : (
          <div className="mt-8 grid gap-3">
            {sessions.map((session) => (
              <section key={session.id} className="rounded-box border border-base-300 bg-base-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {session.userAgent || 'Unknown browser'}{' '}
                      {session.current && <span className="badge badge-primary">Current</span>}
                    </p>
                    <p className="mt-1 text-xs text-base-content/55">
                      IP {session.ip || 'unknown'} · Last used{' '}
                      {new Date(session.lastUsedAt).toLocaleString()}
                    </p>
                  </div>
                  <button className="btn btn-error btn-outline btn-sm" onClick={() => revoke(session)}>
                    Revoke
                  </button>
                </div>
              </section>
            ))}
            {!sessions.length && (
              <p className="text-sm text-base-content/60">No refresh sessions are active.</p>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
