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
    <div className="flex h-screen flex-col">
      {/* ─── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between p-24 h-60 glass-light border-b border-color-border-2">
        <div className="flex items-center gap-16">
          <Link href="/dashboard" className="no-underline text-sm color-text-muted">
            ← Dashboard
          </Link>
          <span className="color-border-2">|</span>
          <span className="font-space-grotesk font-700 text-base">
            🎥 Stream Studio
          </span>
          {isLive && (
            <div className="live-badge">
              <div className="live-dot" />
              LIVE
            </div>
          )}
        </div>

        <div className="flex items-center gap-12">
          {isLive && (
            <div className="flex gap-16 text-xs color-text-muted">
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

      <div className="flex flex-1 overflow-hidden">
        {/* ─── SIDEBAR — Stage select ──────────────────────────────── */}
        <aside className="flex flex-col gap-12 p-16 overflow-auto bg-surface border-r border-color-border-2" style={{ width: 260, flexShrink: 0 }}>
          <div>
            <h2 className="label-text uppercase tracking-wider mb-8">
              My Stages
            </h2>

            {/* Create new */}
            <div className="flex gap-8 mb-16">
              <input
                id="new-stage-title"
                className="input text-xs"
                placeholder="New stage title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createStage()}
              />
              <button id="create-stage-btn" className="btn btn-primary btn-sm flex-shrink-0" onClick={createStage} disabled={creating}>
                +
              </button>
            </div>

            {stages.map(s => (
              <button
                key={s.id}
                onClick={() => setStage(s)}
                className={`w-full text-left p-12 rounded-md border-none cursor-pointer mb-4 transition-all ${
                  stage?.id === s.id ? 'bg-brand-violet-15 color-brand-violet' : 'bg-transparent color-text'
                }`}
                style={{
                  background: stage?.id === s.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: stage?.id === s.id ? 'var(--color-brand-violet)' : 'var(--color-text)',
                  fontSize: 13,
                }}
              >
                <div className="font-600 mb-4">{s.title}</div>
                <div className="text-xs color-text-muted">
                  {s.status} · {s.guestLimit} guests max
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ─── CENTER — Video panels ─────────────────────────────── */}
        <main className="flex flex-1 flex-col gap-12 p-16">
          {stage ? (
            <>
              {/* VDO.Ninja iframe embed */}
              <div className="flex-1 bg-black rounded-lg overflow-hidden relative" style={{ minHeight: 400 }}>
                {roomId ? (
                  <iframe
                    src={`${VDO_NINJA_BASE}/?room=${roomId}&push&label=${encodeURIComponent('Creator')}&bitrate=2500&effects&cleanish`}
                    className="w-full h-full border-none"
                    allow="camera;microphone;fullscreen;display-capture"
                    title="Stream Studio"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center color-text-muted">
                    <div className="text-5xl mb-16">🎥</div>
                    <div className="text-base mb-8">Select a stage and go live</div>
                    <div className="text-xs color-text-dim text-center">
                      Your camera will activate when you click &ldquo;Go Live&rdquo;
                    </div>
                  </div>
                )}
              </div>

              {/* Stream info bar */}
              <div className="flex items-center flex-wrap gap-24 p-16 bg-surface rounded-md border border-color-border-2">
                <div>
                  <div className="text-xs color-text-dim mb-4 tracking-tighter uppercase font-600">STAGE</div>
                  <div className="text-sm font-600">{stage.title}</div>
                </div>
                {roomId && (
                  <div>
                    <div className="text-xs color-text-dim mb-4 tracking-tighter uppercase font-600">GUEST LINK</div>
                    <div className="text-xs color-brand-cyan font-mono">
                      {VDO_NINJA_BASE}/?room={roomId}&view
                    </div>
                  </div>
                )}
                {roomId && (
                  <div>
                    <div className="text-xs color-text-dim mb-4 tracking-tighter uppercase font-600">WATCH PAGE</div>
                    <Link href={`/watch/${stage.id}`} target="_blank" className="text-xs color-brand-violet no-underline">
                      /watch/{stage.id} ↗
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-12 color-text-muted">
              <div className="text-5xl">📺</div>
              <div className="text-center">Select a stage from the left to start streaming</div>
            </div>
          )}
        </main>

        {/* ─── CHAT PANEL ──────────────────────────────────────────── */}
        <aside className="flex flex-col border-l border-color-border-2" style={{ width: 300, flexShrink: 0 }}>
          <div className="p-12 border-b border-color-border-2">
            <h2 className="text-sm font-600">
              💬 Live Chat
              {isLive && <span className="color-text-muted text-xs font-400 ml-8">{viewerCount} watching</span>}
            </h2>
          </div>

          <div className="flex flex-1 flex-col gap-8 p-12 overflow-auto">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`p-12 rounded-md border ${
                msg.type === 'SUPERCHAT' ? 'bg-amber-10 border-amber-30' : 'bg-surface border-color-border-2'
              }`} style={{
                background: msg.type === 'SUPERCHAT' ? 'rgba(245,158,11,0.1)' : 'var(--color-surface)',
                border: msg.type === 'SUPERCHAT' ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border-2)',
              }}>
                <div className={`text-xs font-600 mb-4 ${msg.type === 'SUPERCHAT' ? 'color-warning' : 'color-brand-violet'}`}>
                  {msg.user?.displayName || 'Anonymous'}
                  {msg.type === 'SUPERCHAT' && <span className="ml-8">💰 ${Number(msg.amount).toFixed(2)}</span>}
                </div>
                <div className="text-sm">{msg.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendChat} className="flex gap-8 p-12 border-t border-color-border-2">
            <input
              id="chat-input"
              className="input text-xs"
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
