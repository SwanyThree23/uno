'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DashboardData {
  totalStages: number;
  liveStages: number;
  totalRevenue: number;
  totalFollowers: number;
  totalCurrentViewers: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    grossAmount: number;
    creatorAmount: number;
    createdAt: string;
    fromUser?: { displayName: string; avatarUrl?: string };
    stage?: { title: string };
  }>;
  recentStages: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    _count: { guests: number; chatMessages: number };
  }>;
}

function StatCard({ icon, value, label, color = 'var(--color-brand-violet)' }: {
  icon: string; value: string | number; label: string; color?: string;
}) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}15`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<{ displayName: string; username: string; avatarUrl?: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { window.location.href = '/sign-in'; return; }

    async function load() {
      try {
        const [meRes, analyticsRes] = await Promise.all([
          fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/analytics/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (meRes.status === 401) { window.location.href = '/sign-in'; return; }

        const meData = await meRes.json();
        const analyticsData = await analyticsRes.json();

        setUser(meData);
        setData(analyticsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--color-text-muted)' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border-2)',
        padding: '24px 16px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18 }}>
              SeeWhy <span className="gradient-text">LIVE</span>
            </span>
          </Link>
        </div>

        {/* User */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-2)', marginBottom: 24,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gradient-brand)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user.displayName[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>@{user.username}</div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { href: '/dashboard', icon: '📊', label: 'Dashboard' },
            { href: '/studio', icon: '🎥', label: 'Go Live' },
            { href: '/dashboard/stages', icon: '📺', label: 'My Stages' },
            { href: '/dashboard/analytics', icon: '📈', label: 'Analytics' },
            { href: '/dashboard/earnings', icon: '💰', label: 'Earnings' },
            { href: '/marketplace', icon: '🛒', label: 'Marketplace' },
            { href: '/settings', icon: '⚙️', label: 'Settings' },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} className="nav-link">
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={() => { localStorage.clear(); window.location.href = '/sign-in'; }}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginTop: 8 }}
        >
          Sign Out
        </button>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>
              {user ? `Welcome back, ${user.displayName.split(' ')[0]}! 👋` : 'Dashboard'}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link href="/studio" className="btn btn-primary">
            🎥 Go Live
          </Link>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon="📺" value={data?.totalStages ?? 0} label="Total Stages" color="#8b5cf6" />
          <StatCard icon="🔴" value={data?.liveStages ?? 0} label="Live Now" color="#ef4444" />
          <StatCard icon="💰" value={`$${(data?.totalRevenue ?? 0).toFixed(2)}`} label="Total Earnings (90%)" color="#10b981" />
          <StatCard icon="👥" value={data?.totalFollowers ?? 0} label="Followers" color="#06b6d4" />
          <StatCard icon="👀" value={data?.totalCurrentViewers ?? 0} label="Live Viewers" color="#f59e0b" />
        </div>

        {/* Recent Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Recent Stages */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16 }}>Recent Stages</h2>
              <Link href="/dashboard/stages" style={{ fontSize: 12, color: 'var(--color-brand-violet)', textDecoration: 'none' }}>View all</Link>
            </div>
            {data?.recentStages.length ? (
              data.recentStages.map(stage => (
                <div key={stage.id} style={{
                  padding: '14px 20px', borderBottom: '1px solid var(--color-border-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{stage.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {stage._count.guests} guests · {stage._count.chatMessages} messages
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    background: stage.status === 'LIVE' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                    color: stage.status === 'LIVE' ? '#f87171' : 'var(--color-text-muted)',
                  }}>
                    {stage.status}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
                No stages yet. <Link href="/studio" style={{ color: 'var(--color-brand-violet)', textDecoration: 'none' }}>Go live!</Link>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16 }}>Recent Earnings</h2>
              <Link href="/dashboard/earnings" style={{ fontSize: 12, color: 'var(--color-brand-violet)', textDecoration: 'none' }}>View all</Link>
            </div>
            {data?.recentTransactions.length ? (
              data.recentTransactions.map(tx => (
                <div key={tx.id} style={{
                  padding: '14px 20px', borderBottom: '1px solid var(--color-border-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                      {tx.fromUser?.displayName || 'Anonymous'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {tx.type} · {tx.stage?.title || 'Direct'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                      +${Number(tx.creatorAmount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>
                      of ${Number(tx.grossAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
                No earnings yet. Start streaming to earn!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
