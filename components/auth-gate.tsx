'use client';

import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { getSupabaseClient, storageMode } from '@/lib/review-storage';

type Account = { id: string; label: string; signOut?: () => Promise<void> };

export function AuthGate({
  children,
}: {
  children: (account: Account) => ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(storageMode === 'Supabase');
  const [username, setUsername] = useState('test');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storageMode !== 'Supabase') return;
    try {
      const db = getSupabaseClient();
      const { data } = db.auth.onAuthStateChange((_event, session) => {
        setUser(
          session?.user && !session.user.is_anonymous ? session.user : null,
        );
        setLoading(false);
      });
      return () => data.subscription.unsubscribe();
    } catch {
      setError(
        'Supabase configuration is incomplete. Set the project URL and publishable key, then restart or redeploy.',
      );
      setLoading(false);
    }
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const identity = username.trim();
      const email =
        identity.toLowerCase() === 'test'
          ? process.env.NEXT_PUBLIC_DEMO_EMAIL
          : identity;
      if (!email)
        throw new Error(
          'The demo account is not configured. Set NEXT_PUBLIC_DEMO_EMAIL to the Supabase demo user’s email.',
        );
      if (!email.includes('@'))
        throw new Error('Enter “test” or your account email address.');
      const { error: signInError } =
        await getSupabaseClient().auth.signInWithPassword({ email, password });
      if (signInError)
        throw new Error(
          'Could not sign in. Check your credentials and connection, and make sure the account email is confirmed.',
        );
      setPassword('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not sign in. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      // A reviewer signing out here should not sign out other reviewers using the demo account.
      const { error: signOutError } = await getSupabaseClient().auth.signOut({
        scope: 'local',
      });
      if (signOutError) throw signOutError;
      setUser(null);
      setPassword('');
    } catch {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (storageMode === 'Local browser')
    return children({ id: 'local', label: 'Local reviewer' });
  if (loading)
    return (
      <main className="auth-page">
        <p role="status">Checking your session…</p>
      </main>
    );
  if (user)
    return (
      <>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {children({
          id: user.id,
          label: user.email ?? 'Reviewer',
          signOut: busy ? undefined : signOut,
        })}
      </>
    );

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          <Activity size={26} /> soundsense
        </div>
        <div className="eyebrow">REVIEWER WORKSPACE</div>
        <h1 id="login-title">Welcome back.</h1>
        <p>Sign in to access your saved reviews across browsers.</p>
        <form onSubmit={signIn}>
          <label htmlFor="username">Username or email</label>
          <input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="auth-hint">
          <ShieldCheck size={16} /> Demo username: test. Use the password
          provided by the project owner.
        </p>
        <p className="auth-hint">
          Reviewers using the same account share saved decisions. Unsaved drafts
          are cleared when you sign out.
        </p>
      </section>
    </main>
  );
}
