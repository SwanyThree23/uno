'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─── Animated counter hook ─────────────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// ─── Data ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🎥',
    title: 'Multi-Guest Live Rooms',
    desc: 'Up to 20 simultaneous guests via WebRTC. Full HD video with adaptive bitrate streaming.',
    color: '#8b5cf6',
  },
  {
    icon: '💰',
    title: '90% Revenue Split',
    desc: 'Creators keep 90% of all revenue — always. Superchats, tips, subscriptions, and product sales.',
    color: '#10b981',
  },
  {
    icon: '🌍',
    title: 'Multi-Platform Streaming',
    desc: 'Simultaneously stream to YouTube, Twitch, TikTok, and Facebook from one dashboard.',
    color: '#06b6d4',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Features',
    desc: 'Real-time transcription in 28 languages, automatic highlights, and live chat moderation.',
    color: '#f59e0b',
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    desc: 'AES-256-GCM stream key encryption, RS256 JWT auth, and RBAC access controls.',
    color: '#ec4899',
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    desc: 'Live viewer counts, revenue dashboards, engagement metrics, and geographic distribution.',
    color: '#8b5cf6',
  },
];

const TIERS = [
  {
    name: 'Bronze',
    price: '$1',
    period: '/mo',
    color: '#cd7f32',
    features: ['Access to exclusive streams', 'Custom badge in chat', 'Creator shoutouts'],
  },
  {
    name: 'Silver',
    price: '$5',
    period: '/mo',
    color: '#c0c0c0',
    features: ['Everything in Bronze', 'Behind-the-scenes content', 'Priority Q&A', 'Discord access'],
    featured: true,
  },
  {
    name: 'Gold',
    price: '$15',
    period: '/mo',
    color: '#ffd700',
    features: ['Everything in Silver', '1-on-1 monthly call', 'Early product access', 'Co-host invitations'],
  },
];

// ─── Stats ─────────────────────────────────────────────────────────────────
const STATS = [
  { value: 90, suffix: '%', label: 'Creator Revenue Share' },
  { value: 20, suffix: '+', label: 'Guests Per Stream' },
  { value: 28, suffix: '', label: 'Languages Supported' },
  { value: 4, suffix: 'x', label: 'Simultaneous Platforms' },
];

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main style={{ overflowX: 'hidden' }}>
      {/* ─── NAV ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 24px',
          background: scrollY > 50 ? 'rgba(9,9,18,0.95)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid rgba(139,92,246,0.1)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--color-text)' }}>
              SeeWhy{' '}
              <span className="gradient-text">LIVE</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/sign-in" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">Start Creating</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '10%', left: '20%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
            animation: 'float1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '15%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)',
            animation: 'float2 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', left: '40%',
            width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%)',
            animation: 'float3 12s ease-in-out infinite',
          }} />
        </div>

        <style>{`
          @keyframes float1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-20px,10px)} }
          @keyframes float2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-40px,20px)} 66%{transform:translate(20px,-30px)} }
          @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,30px)} }
        `}</style>

        <div style={{ position: 'relative', maxWidth: 800 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 'var(--radius-full)', padding: '6px 16px',
            marginBottom: 24, fontSize: 13, color: 'var(--color-brand-violet)',
            fontWeight: 600,
          }}>
            <span className="live-dot" style={{ background: 'var(--color-brand-violet)' }} />
            Powered by SwanyThree EntTech
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Stream Live.{' '}
            <span className="gradient-text">Earn More.</span>
            <br />Keep 90%.
          </h1>

          <p style={{ fontSize: 18, color: 'var(--color-text-muted)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            SeeWhy LIVE is the creator-first streaming platform with multi-guest rooms,
            AI transcription, and the industry&apos;s best revenue split — you keep 90%, always.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              🚀 Start Streaming Free
            </Link>
            <Link href="#features" className="btn btn-ghost btn-lg">
              See How It Works
            </Link>
          </div>

          {/* Mini feature pills */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
            {['✅ No credit card required', '✅ 90% revenue share', '✅ Free for creators'].map(f => (
              <span key={f} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-full)', padding: '5px 14px', fontSize: 13,
                color: 'var(--color-text-muted)',
              }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: 'var(--color-border-2)' }}>
            {STATS.map(({ value, suffix, label }) => {
              const { count, ref } = useCounter(value);
              return (
                <div key={label} ref={ref} style={{ background: 'var(--color-surface)', padding: '32px', textAlign: 'center' }}>
                  <div className="stat-value gradient-text">
                    {count}{suffix}
                  </div>
                  <div className="stat-label">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="section" style={{ padding: '80px 24px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 16 }}>
              Everything you need to{' '}
              <span className="gradient-text">go live & earn</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
              Professional streaming tools that previously cost thousands — now at your fingertips.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div key={title} className="card gradient-border" style={{ cursor: 'default' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${color}20`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, marginBottom: 16,
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVENUE CTA ────────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))',
        borderTop: '1px solid rgba(139,92,246,0.1)',
        borderBottom: '1px solid rgba(139,92,246,0.1)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 16 }}>
            The industry&apos;s best{' '}
            <span className="gradient-text">revenue split</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 18, marginBottom: 40, lineHeight: 1.7 }}>
            While other platforms take 30-50%, SeeWhy LIVE only takes 10%.
            That means if you earn $10,000 a month, you keep $9,000 — not $5,000.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center', maxWidth: 500, margin: '0 auto 40px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-success)' }}>90%</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Goes to you</div>
            </div>
            <div style={{ color: 'var(--color-text-dim)', fontSize: 24 }}>vs</div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-dim)' }}>10%</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Platform fee</div>
            </div>
          </div>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start Earning Today
          </Link>
        </div>
      </section>

      {/* ─── SUBSCRIPTION TIERS ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 16 }}>
            Creator <span className="gradient-text">Subscription Tiers</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 18, marginBottom: 48 }}>
            Set up subscription tiers for your superfans. You always keep 90%.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {TIERS.map(({ name, price, period, color, features, featured }) => (
              <div key={name} className="card" style={{
                border: featured ? `1px solid ${color}50` : undefined,
                transform: featured ? 'scale(1.02)' : undefined,
                boxShadow: featured ? `0 0 40px ${color}20` : undefined,
                position: 'relative',
              }}>
                {featured && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--gradient-brand)', color: 'white', fontSize: 11,
                    fontWeight: 700, padding: '3px 14px', borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.05em',
                  }}>MOST POPULAR</div>
                )}
                <div style={{ color, fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{price}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>{name}{period}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', textAlign: 'left' }}>
                  {features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 14, color: 'var(--color-text-muted)' }}>
                      <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', marginBottom: 16 }}>
            Ready to go <span className="gradient-text">live?</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 18, marginBottom: 40 }}>
            Join thousands of creators already earning more with SeeWhy LIVE.
          </p>
          <Link href="/sign-up" className="btn btn-primary btn-lg" style={{ fontSize: 18, padding: '16px 40px' }}>
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border-2)',
        padding: '48px 24px',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
              SeeWhy <span className="gradient-text">LIVE</span>
            </div>
            <div style={{ color: 'var(--color-text-dim)', fontSize: 13 }}>
              © 2026 SwanyThree EntTech. All rights reserved.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'DMCA', 'Support'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} style={{ color: 'var(--color-text-dim)', fontSize: 13, textDecoration: 'none' }}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
