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
      <div className="flex justify-between items-start">
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div 
          className="flex items-center justify-center w-44 h-44 rounded-xl text-xl"
          style={{ background: `${color}15` }}
        >
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
    <div className="flex min-h-screen">
      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="flex flex-col w-240 flex-shrink-0 p-24 bg-surface border-r border-color-border-2">
        <div className="mb-32">
          <Link href="/" className="no-underline">
            <span className="font-space-grotesk font-800 text-lg">
              SeeWhy <span className="gradient-text">LIVE</span>
            </span>
          </Link>
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-12 p-12 rounded-md bg-surface-2 mb-24 transition-all">
            <div className="flex items-center justify-center w-40 h-40 rounded-full bg-brand-gradient text-sm font-700 color-white flex-shrink-0">
              {user.displayName[0]}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-600 truncate">
                {user.displayName}
              </div>
              <div className="text-xs color-text-muted">@{user.username}</div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-4">
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
          className="btn btn-ghost btn-sm mt-8 w-full"
        >
          Sign Out
        </button>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className="flex-1 p-32 overflow-auto bg-background">
        <div className="flex items-center justify-between mb-32">
          <div>
            <h1 className="text-2xl mb-8">
              {user ? `Welcome back, ${user.displayName.split(' ')[0]}! 👋` : 'Dashboard'}
            </h1>
            <p className="text-sm color-text-muted">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link href="/studio" className="btn btn-primary px-24 py-12">
            🎥 Go Live
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-16 mb-32">
          <StatCard icon="📺" value={data?.totalStages ?? 0} label="Total Stages" color="#8b5cf6" />
          <StatCard icon="🔴" value={data?.liveStages ?? 0} label="Live Now" color="#ef4444" />
          <StatCard icon="💰" value={`$${(data?.totalRevenue ?? 0).toFixed(2)}`} label="Total Earnings (90%)" color="#10b981" />
          <StatCard icon="👥" value={data?.totalFollowers ?? 0} label="Followers" color="#06b6d4" />
          <StatCard icon="👀" value={data?.totalCurrentViewers ?? 0} label="Live Viewers" color="#f59e0b" />
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Recent Stages */}
          <div className="card p-0 overflow-hidden glass-card">
            <div className="flex items-center justify-between p-20 border-b border-color-border-2">
              <h2 className="text-lg font-600">Recent Stages</h2>
              <Link href="/dashboard/stages" className="text-xs color-brand-violet no-underline font-600">View all</Link>
            </div>
            {data?.recentStages.length ? (
              data.recentStages.map(stage => (
                <div key={stage.id} className="flex items-center justify-between p-20 border-b border-color-border-2 hover:bg-surface-2 transition-colors">
                  <div>
                    <div className="text-sm font-600 mb-4">{stage.title}</div>
                    <div className="text-xs color-text-muted">
                      {stage._count.guests} guests · {stage._count.chatMessages} messages
                    </div>
                  </div>
                  <span className={`text-xs font-700 px-12 py-4 rounded-full ${
                    stage.status === 'LIVE' ? 'bg-danger-10 color-danger' : 'bg-surface-2 color-text-muted'
                  }`}>
                    {stage.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-40 text-center color-text-muted text-sm">
                No stages yet. <Link href="/studio" className="color-brand-violet no-underline font-600">Go live!</Link>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card p-0 overflow-hidden glass-card">
            <div className="flex items-center justify-between p-20 border-b border-color-border-2">
              <h2 className="text-lg font-600">Recent Earnings</h2>
              <Link href="/dashboard/earnings" className="text-xs color-brand-violet no-underline font-600">View all</Link>
            </div>
            {data?.recentTransactions.length ? (
              data.recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-20 border-b border-color-border-2 hover:bg-surface-2 transition-colors">
                  <div>
                    <div className="text-sm font-600 mb-4">
                      {tx.fromUser?.displayName || 'Anonymous'}
                    </div>
                    <div className="text-xs color-text-muted">
                      {tx.type} · {tx.stage?.title || 'Direct'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-700 color-success">
                      +${Number(tx.creatorAmount).toFixed(2)}
                    </div>
                    <div className="text-xs color-text-dim">
                      of ${Number(tx.grossAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-40 text-center color-text-muted text-sm">
                No earnings yet. Start streaming to earn!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
