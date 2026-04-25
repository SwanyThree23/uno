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
    <main className="overflow-x-hidden">
      {/* ─── NAV ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-100 px-24 transition-all duration-300 ${scrollY > 50 ? 'nav-scrolled' : 'bg-transparent'}`}>
        <div className="container flex items-center justify-between h-64">
          <Link href="/" className="no-underline">
            <span className="font-space-grotesk font-black text-2xl color-text">
              SeeWhy{' '}
              <span className="gradient-text">LIVE</span>
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/sign-in" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">Start Creating</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="h-screen flex items-center justify-center text-center px-24 relative overflow-hidden py-120">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute" style={{ top: '10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
          <div className="absolute" style={{ top: '40%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
          <div className="absolute" style={{ bottom: '10%', left: '40%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%)', animation: 'float3 12s ease-in-out infinite' }} />
        </div>

        <style>{`
          @keyframes float1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-20px,10px)} }
          @keyframes float2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-40px,20px)} 66%{transform:translate(20px,-30px)} }
          @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,30px)} }
        `}</style>

        <div className="relative max-w-800 mx-auto">
          <div className="inline-flex items-center gap-8 bg-brand-light border-brand-light rounded-full px-16 mb-24 text-xs color-brand-violet font-semibold py-8">
            <span className="live-dot" style={{ background: 'var(--color-brand-violet)' }} />
            Powered by SwanyThree EntTech
          </div>

          <h1 className="font-black leading-tight mb-24 text-8xl">
            Stream Live.{' '}
            <span className="gradient-text">Earn More.</span>
            <br />Keep 90%.
          </h1>

          <p className="text-lg color-text-muted max-w-600 mx-auto mb-40 leading-relaxed">
            SeeWhy LIVE is the creator-first streaming platform with multi-guest rooms,
            AI transcription, and the industry&apos;s best revenue split — you keep 90%, always.
          </p>

          <div className="flex gap-12 justify-center flex-wrap">
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              🚀 Start Streaming Free
            </Link>
            <Link href="#features" className="btn btn-ghost btn-lg">
              See How It Works
            </Link>
          </div>

          {/* Mini feature pills */}
          <div className="flex gap-8 justify-center flex-wrap mt-40">
            {['✅ No credit card required', '✅ 90% revenue share', '✅ Free for creators'].map(f => (
              <span key={f} className="bg-transparent border-brand-light rounded-full px-14 py-4 text-xs color-text-muted">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section className="py-60 px-24 bg-surface">
        <div className="container">
          <div className="grid grid-cols-4 gap-4 bg-border-light">
            {STATS.map(({ value, suffix, label }) => {
              const { count, ref } = useCounter(value);
              return (
                <div key={label} ref={ref} className="bg-surface p-32 text-center">
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
      <section id="features" className="py-80 px-24">
        <div className="container">
          <div className="text-center mb-64">
            <h2 className="text-5xl mb-16">
              Everything you need to{' '}
              <span className="gradient-text">go live & earn</span>
            </h2>
            <p className="color-text-muted text-lg max-w-600 mx-auto">
              Professional streaming tools that previously cost thousands — now at your fingertips.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-24">
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div key={title} className="card gradient-border cursor-default">
                <div 
                  className="flex items-center justify-center text-2xl mb-16"
                  style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20` }}
                >
                  {icon}
                </div>
                <h3 className="text-lg mb-8">{title}</h3>
                <p className="color-text-muted text-sm leading-normal">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVENUE CTA ────────────────────────────────────────────────── */}
      <section className="py-80 px-24 bg-brand-light border-t-brand-light border-b-brand-light">
        <div className="container text-center max-w-700 mx-auto">
          <div className="text-6xl mb-16">💰</div>
          <h2 className="text-5xl mb-16">
            The industry&apos;s best{' '}
            <span className="gradient-text">revenue split</span>
          </h2>
          <p className="color-text-muted text-lg mb-40 leading-relaxed">
            While other platforms take 30-50%, SeeWhy LIVE only takes 10%.
            That means if you earn $10,000 a month, you keep $9,000 — not $5,000.
          </p>
          <div className="grid grid-cols-3 gap-24 items-center max-w-500 mx-auto mb-40">
            <div className="card text-center">
              <div className="text-3xl font-extrabold color-success">90%</div>
              <div className="color-text-muted text-xs">Goes to you</div>
            </div>
            <div className="color-text-dim text-2xl">vs</div>
            <div className="card text-center">
              <div className="text-3xl font-extrabold color-text-dim">10%</div>
              <div className="color-text-muted text-xs">Platform fee</div>
            </div>
          </div>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start Earning Today
          </Link>
        </div>
      </section>

      {/* ─── SUBSCRIPTION TIERS ─────────────────────────────────────────── */}
      <section className="py-80 px-24">
        <div className="container text-center">
          <h2 className="text-5xl mb-16">
            Creator <span className="gradient-text">Subscription Tiers</span>
          </h2>
          <p className="color-text-muted text-lg mb-48">
            Set up subscription tiers for your superfans. You always keep 90%.
          </p>

          <div className="grid grid-cols-3 gap-24 max-w-900 mx-auto">
            {TIERS.map(({ name, price, period, color, features, featured }) => (
              <div key={name} className="card relative" style={{
                border: featured ? `1px solid ${color}50` : undefined,
                transform: featured ? 'scale(1.02)' : undefined,
                boxShadow: featured ? `0 0 40px ${color}20` : undefined,
              }}>
                {featured && (
                  <div className="absolute top-minus-12 left-half transform-minus-x-half bg-brand-linear color-white text-xs font-bold px-14 py-4 rounded-full tracking-wide">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-3xl font-black mb-4" style={{ color }}>{price}</div>
                <div className="color-text-muted text-xs mb-16">{name}{period}</div>
                <ul className="list-none p-0 my-0 mb-24 text-left">
                  {features.map(f => (
                    <li key={f} className="flex gap-8 items-start mb-8 text-sm color-text-muted">
                      <span className="color-success flex-shrink-0">✓</span>
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
      <section className="py-80 px-24 text-center">
        <div className="container max-w-600 mx-auto">
          <h2 className="text-6xl mb-16">
            Ready to go <span className="gradient-text">live?</span>
          </h2>
          <p className="color-text-muted text-lg mb-40">
            Join thousands of creators already earning more with SeeWhy LIVE.
          </p>
          <Link href="/sign-up" className="btn btn-primary btn-lg text-lg px-40 py-16">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-surface border-t-brand-light py-48 px-24">
        <div className="container flex justify-between items-center flex-wrap gap-16">
          <div>
            <div className="font-space-grotesk font-extrabold text-lg mb-4">
              SeeWhy <span className="gradient-text">LIVE</span>
            </div>
            <div className="color-text-dim text-xs">
              © 2026 SwanyThree EntTech. All rights reserved.
            </div>
          </div>
          <div className="flex gap-24">
            {['Privacy', 'Terms', 'DMCA', 'Support'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="color-text-dim text-xs no-underline">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
