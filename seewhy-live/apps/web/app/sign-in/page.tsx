'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      {/* Background */}
      <div className="auth-bg" />

      <div className="auth-card-wrap">
        {/* Logo */}
        <div className="text-center mb-40">
          <Link href="/" className="no-underline">
            <span className="font-space-grotesk font-black text-2xl color-text">
              SeeWhy <span className="gradient-text">LIVE</span>
            </span>
          </Link>
          <p className="color-text-muted mt-8 text-sm">
            Welcome back, creator
          </p>
        </div>

        {/* Form card */}
        <div className="glass p-40 rounded-xl">
          <h1 className="text-2xl mb-28 text-center">Sign In</h1>

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-16">
            <div>
              <label className="label-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between mb-8">
                <label className="label-text mb-0">Password</label>
                <Link href="/forgot-password" title="Forgot password?" className="text-xs color-brand-violet no-underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="sign-in-btn"
              type="submit"
              className="btn btn-primary mt-8 w-full py-12"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="separator" />

          <p className="text-center text-sm color-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="color-brand-violet no-underline font-600">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
