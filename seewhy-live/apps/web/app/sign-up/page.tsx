'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card-wrap" style={{ maxWidth: 460 }}>
        <div className="text-center mb-40">
          <Link href="/" className="no-underline">
            <span className="font-space-grotesk font-black text-2xl">
              SeeWhy <span className="gradient-text">LIVE</span>
            </span>
          </Link>
          <p className="color-text-muted mt-8 text-sm">
            Create your free creator account
          </p>
        </div>

        <div className="glass p-40 rounded-xl">
          {/* Revenue badge */}
          <div className="flex items-center gap-8 mb-24 p-16 rounded-md bg-success-light border-success-light color-success text-xs">
            <span className="text-base">💰</span>
            <span>You&apos;ll keep <strong>90%</strong> of all revenue you earn — always</span>
          </div>

          <h1 className="text-xl mb-24 text-center">Create Account</h1>

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-16">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <label className="label-text">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  className="input"
                  placeholder="Your Name"
                  value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                  required minLength={2} maxLength={50}
                />
              </div>
              <div>
                <label className="label-text">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="input"
                  placeholder="creator_handle"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  required minLength={3} maxLength={30}
                />
              </div>
            </div>

            <div>
              <label className="label-text">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required autoComplete="email"
              />
            </div>

            <div>
              <label className="label-text">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required minLength={8} autoComplete="new-password"
              />
            </div>

            <p className="text-xs color-text-dim leading-normal">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="color-brand-violet no-underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="color-brand-violet no-underline">Privacy Policy</Link>.
            </p>

            <button
              id="sign-up-btn"
              type="submit"
              className="btn btn-primary w-full py-12"
              disabled={loading}
            >
              {loading ? 'Creating account...' : '🚀 Create Free Account'}
            </button>
          </form>

          <div className="separator" />

          <p className="text-center text-sm color-text-muted">
            Already have an account?{' '}
            <Link href="/sign-in" className="color-brand-violet no-underline font-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
