'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stage {
  id: string;
  title: string;
  status: string;
  roomId?: string;
  guestLimit: number;
  useMeshcast: boolean;
}

interface StreamMetrics {
  bitrate?: number;
  fps?: number;
  latency?: number;
  dropped?: number;
}

interface ChatMessage {
  id: string;
  message: string;
  type: string;
  amount?: number;
  user?: { displayName: string; avatarUrl?: string };
  createdAt: string;
}

export default function StudioPage() {
  const [stage, setStage]             = useState<Stage | null>(null);
  const [stages, setStages]           = useState<Stage[]>([]);
  const [isLive, setIsLive]           = useState(false);
  const [metrics, setMetrics]         = useState<StreamMetrics>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]     = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [newTitle, setNewTitle]       = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef  = useRef<unknown>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { window.location.href = '/sign-in'; return; }

    async function loadStages() {
      try {
        const res = await fetch(`${API}/api/stages`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setStages(data.stages || []);
      } finally {
        setLoading(false);
      }
    }
    loadStages();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function goLive() {
    if (!stage) return;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${API}/api/stages/${stage.id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const updated = await res.json();
      setStage(updated);
      setIsLive(true);
      connectSocket(stage.id);
    }
  }

  async function endStream() {
    if (!stage) return;
    const token = localStorage.getItem('accessToken');
    await fetch(`${API}/api/stages/${stage.id}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setIsLive(false);
    if (socketRef.current) (socketRef.current as { disconnect?: () => void }).disconnect?.();
  }

  async function createStage() {
    if (!newTitle.trim()) return;
    setCreating(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API}/api/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, isPublic: true, guestLimit: 20, streamType: 'webrtc' }),
      });
      if (res.ok) {
        const newStage = await res.json();
        setStages(prev => [newStage, ...prev]);
        setStage(newStage);
        setNewTitle('');
      }
    } finally {
      setCreating(false);
    }
  }

  function connectSocket(stageId: string) {
    const token = localStorage.getItem('accessToken');
    // Dynamic import to avoid SSR issues
    import('socket.io-client').then(({ io }) => {
      const socket = io(API.replace('/api', ''), {
        auth: { token },
        query: { stageId },
      });

      socket.on('chat:message', (msg: ChatMessage) => {
        setChatMessages(prev => [...prev, msg]);
      });

      socket.on('presence:count', ({ count }: { count: number }) => {
        setViewerCount(count);
      });

      socket.on('stream:metrics', (m: StreamMetrics) => {
        setMetrics(m);
      });

      socket.emit('chat:history');
      socketRef.current = socket;
    });
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    (socketRef.current as { emit?: (event: string, data: unknown) => void }).emit?.('chat:send', { message: chatInput });
    setChatInput('');
  }

  const VDO_NINJA_BASE = process.env.NEXT_PUBLIC_VDO_NINJA_URL || 'https://vdo.ninja';
  const roomId = stage?.roomId || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* ─── TOP BAR ─────────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border-2)',
        padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--color-border-2)' }}>|</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>
            🎥 Stream Studio
          </span>
          {isLive && (
            <div className="live-badge">
              <div className="live-dot" />
              LIVE
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLive && (
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <span title="Viewers">👀 {viewerCount}</span>
              {metrics.bitrate && <span title="Bitrate">📡 {metrics.bitrate}kbps</span>}
              {metrics.fps && <span title="FPS">🎬 {metrics.fps}fps</span>}
            </div>
          )}
          {stage && !isLive && (
            <button id="go-live-btn" className="btn btn-primary" onClick={goLive}>
              🔴 Go Live
            </button>
          )}
          {isLive && (
            <button id="end-stream-btn" className="btn btn-danger" onClick={endStream}>
              ⏹ End Stream
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ─── SIDEBAR — Stage select ──────────────────────────────── */}
        <aside style={{
          width: 260, flexShrink: 0, background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border-2)', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto',
        }}>
          <div>
            <h2 style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Stages
            </h2>

            {/* Create new */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                id="new-stage-title"
                className="input"
                style={{ fontSize: 13 }}
                placeholder="New stage title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createStage()}
              />
              <button id="create-stage-btn" className="btn btn-primary btn-sm" onClick={createStage} disabled={creating} style={{ flexShrink: 0 }}>
                +
              </button>
            </div>

            {stages.map(s => (
              <button
                key={s.id}
                onClick={() => setStage(s)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                  background: stage?.id === s.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: stage?.id === s.id ? 'var(--color-brand-violet)' : 'var(--color-text)',
                  fontSize: 13, marginBottom: 2,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {s.status} · {s.guestLimit} guests max
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ─── CENTER — Video panels ─────────────────────────────── */}
        <main style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stage ? (
            <>
              {/* VDO.Ninja iframe embed */}
              <div style={{
                flex: 1, background: '#000', borderRadius: 'var(--radius-lg)',
                overflow: 'hidden', minHeight: 400, position: 'relative',
              }}>
                {roomId ? (
                  <iframe
                    src={`${VDO_NINJA_BASE}/?room=${roomId}&push&label=${encodeURIComponent('Creator')}&bitrate=2500&effects&cleanish`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="camera;microphone;fullscreen;display-capture"
                    title="Stream Studio"
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>Select a stage and go live</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>
                      Your camera will activate when you click &ldquo;Go Live&rdquo;
                    </div>
                  </div>
                )}
              </div>

              {/* Stream info bar */}
              <div style={{
                background: 'var(--color-surface)', padding: '12px 16px',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-2)',
                display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginBottom: 2 }}>STAGE</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{stage.title}</div>
                </div>
                {roomId && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginBottom: 2 }}>GUEST LINK</div>
                    <div style={{ fontSize: 12, color: 'var(--color-brand-cyan)', fontFamily: 'monospace' }}>
                      {VDO_NINJA_BASE}/?room={roomId}&view
                    </div>
                  </div>
                )}
                {roomId && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginBottom: 2 }}>WATCH PAGE</div>
                    <Link href={`/watch/${stage.id}`} target="_blank" style={{ fontSize: 12, color: 'var(--color-brand-violet)', textDecoration: 'none' }}>
                      /watch/{stage.id} ↗
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontSize: 48 }}>📺</div>
              <div>Select a stage from the left to start streaming</div>
            </div>
          )}
        </main>

        {/* ─── CHAT PANEL ──────────────────────────────────────────── */}
        <aside style={{
          width: 300, flexShrink: 0, borderLeft: '1px solid var(--color-border-2)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-2)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>
              💬 Live Chat
              {isLive && <span style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>{viewerCount} watching</span>}
            </h2>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chatMessages.map(msg => (
              <div key={msg.id} style={{
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: msg.type === 'SUPERCHAT' ? 'rgba(245,158,11,0.1)' : 'var(--color-surface)',
                border: msg.type === 'SUPERCHAT' ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border-2)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: msg.type === 'SUPERCHAT' ? '#f59e0b' : 'var(--color-brand-violet)', marginBottom: 2 }}>
                  {msg.user?.displayName || 'Anonymous'}
                  {msg.type === 'SUPERCHAT' && <span style={{ marginLeft: 6 }}>💰 ${Number(msg.amount).toFixed(2)}</span>}
                </div>
                <div style={{ fontSize: 13 }}>{msg.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendChat} style={{ padding: 12, borderTop: '1px solid var(--color-border-2)', display: 'flex', gap: 8 }}>
            <input
              id="chat-input"
              className="input"
              style={{ fontSize: 13 }}
              placeholder="Send a message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={!isLive}
            />
            <button id="send-chat-btn" type="submit" className="btn btn-primary btn-sm" disabled={!isLive}>
              →
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
