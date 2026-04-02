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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'radial-gradient(ellipse at 70% 20%, rgba(6,182,212,0.15), transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(139,92,246,0.1), transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 28 }}>
              SeeWhy <span className="gradient-text">LIVE</span>
            </span>
          </Link>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 15 }}>
            Create your free creator account
          </p>
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 40 }}>
          {/* Revenue badge */}
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#10b981',
          }}>
            <span style={{ fontSize: 16 }}>💰</span>
            <span>You&apos;ll keep <strong>90%</strong> of all revenue you earn — always</span>
          </div>

          <h1 style={{ fontSize: 22, marginBottom: 24, textAlign: 'center' }}>Create Account</h1>

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-muted)' }}>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-muted)' }}>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-muted)' }}>Email</label>
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-muted)' }}>Password</label>
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

            <p style={{ fontSize: 12, color: 'var(--color-text-dim)', lineHeight: 1.5 }}>
              By signing up, you agree to our{' '}
              <Link href="/terms" style={{ color: 'var(--color-brand-violet)', textDecoration: 'none' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: 'var(--color-brand-violet)', textDecoration: 'none' }}>Privacy Policy</Link>.
            </p>

            <button
              id="sign-up-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px' }}
            >
              {loading ? 'Creating account...' : '🚀 Create Free Account'}
            </button>
          </form>

          <div className="separator" />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link href="/sign-in" style={{ color: 'var(--color-brand-violet)', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
