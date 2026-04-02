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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.15), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.1), transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 28, color: 'var(--color-text)' }}>
              SeeWhy <span className="gradient-text">LIVE</span>
            </span>
          </Link>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 15 }}>
            Welcome back, creator
          </p>
        </div>

        {/* Form card */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 40 }}>
          <h1 style={{ fontSize: 24, marginBottom: 28, textAlign: 'center' }}>Sign In</h1>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
              color: '#f87171', fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-muted)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--color-brand-violet)', textDecoration: 'none' }}>
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
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 8, width: '100%', padding: '12px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="separator" />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" style={{ color: 'var(--color-brand-violet)', textDecoration: 'none', fontWeight: 600 }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
