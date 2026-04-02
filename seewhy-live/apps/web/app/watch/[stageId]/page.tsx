'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stage {
  id: string;
  title: string;
  description?: string;
  status: string;
  roomId?: string;
  creator: { id: string; displayName: string; username: string; avatarUrl?: string };
  _count: { chatMessages: number };
}

interface ChatMessage {
  id: string;
  message: string;
  type: string;
  amount?: number;
  user?: { displayName: string };
  createdAt: string;
  platform: string;
}

export default function WatchPage() {
  const params = useParams();
  const stageId = params.stageId as string;
  const [stage, setStage]             = useState<Stage | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatInput, setChatInput]     = useState('');
  const [metrics, setMetrics]         = useState<{ bitrate?: number; fps?: number }>({});
  const [superchatAmount, setSuperchatAmount] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef  = useRef<unknown>(null);

  useEffect(() => {
    fetch(`${API}/api/stages/${stageId}`)
      .then(r => r.json())
      .then(setStage)
      .catch(console.error);
  }, [stageId]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    import('socket.io-client').then(({ io }) => {
      const socket = io(API.replace('/api', ''), {
        auth: { token: token || '' },
        query: { stageId },
      });

      socket.on('chat:message',  (msg: ChatMessage) => setChatMessages(p => [...p, msg]));
      socket.on('chat:history',  (msgs: ChatMessage[]) => setChatMessages(msgs));
      socket.on('presence:count', ({ count }: { count: number }) => setViewerCount(count));
      socket.on('stream:metrics', setMetrics);

      socket.emit('chat:history');
      socket.emit('presence:count');

      socketRef.current = socket;
      return () => socket.disconnect();
    });
  }, [stageId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    const type    = superchatAmount ? 'SUPERCHAT' : 'CHAT';
    const amount  = superchatAmount ? parseFloat(superchatAmount) : undefined;
    (socketRef.current as { emit?: (e: string, d: unknown) => void }).emit?.('chat:send', { message: chatInput, type, amount });
    setChatInput('');
    setSuperchatAmount('');
  }

  const VDO_NINJA_BASE = process.env.NEXT_PUBLIC_VDO_NINJA_URL || 'https://vdo.ninja';

  if (!stage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(9,9,18,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border-2)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18 }}>
            SeeWhy <span className="gradient-text">LIVE</span>
          </span>
          {stage.status === 'LIVE' && (
            <div className="live-badge">
              <div className="live-dot" />
              LIVE
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <span>👀 {viewerCount} watching</span>
          {metrics.bitrate && <span>📡 {metrics.bitrate}kbps</span>}
          {metrics.fps && <span>🎬 {metrics.fps}fps</span>}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* VDO.Ninja viewer */}
          <div style={{ flex: 1, background: '#000', minHeight: 0 }}>
            {stage.roomId && stage.status === 'LIVE' ? (
              <iframe
                src={`${VDO_NINJA_BASE}/?room=${stage.roomId}&view&scene&cleanish`}
                style={{ width: '100%', height: '100%', border: 'none', minHeight: 480 }}
                allow="autoplay;fullscreen"
                title={stage.title}
              />
            ) : (
              <div style={{
                height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12, color: 'var(--color-text-muted)',
              }}>
                <div style={{ fontSize: 48 }}>
                  {stage.status === 'UPCOMING' ? '⏳' : stage.status === 'ENDED' ? '📼' : '🎥'}
                </div>
                <div style={{ fontSize: 16 }}>
                  {stage.status === 'UPCOMING' ? 'Stream hasn\'t started yet' :
                   stage.status === 'ENDED'    ? 'Stream has ended' : 'Waiting for stream...'}
                </div>
              </div>
            )}
          </div>

          {/* Stage info */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-2)' }}>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>{stage.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--gradient-brand)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white',
              }}>
                {stage.creator.displayName[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{stage.creator.displayName}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>@{stage.creator.username}</div>
              </div>
            </div>
            {stage.description && (
              <p style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {stage.description}
              </p>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        <aside style={{
          width: 340, flexShrink: 0, borderLeft: '1px solid var(--color-border-2)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>💬 Live Chat</h2>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stage._count.chatMessages} messages</span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chatMessages.map(msg => (
              <div key={msg.id} style={{
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: msg.type === 'SUPERCHAT' ? 'rgba(245,158,11,0.1)' : 'var(--color-surface)',
                border: msg.type === 'SUPERCHAT' ? '1px solid rgba(245,158,11,0.3)' : 'none',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: msg.type === 'SUPERCHAT' ? '#f59e0b' : 'var(--color-brand-violet)', marginBottom: 2 }}>
                  {msg.user?.displayName || 'Anonymous'}
                  {msg.type === 'SUPERCHAT' && <span style={{ marginLeft: 6 }}>💰 ${Number(msg.amount).toFixed(2)}</span>}
                  {msg.platform !== 'SEEWHY' && (
                    <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>[{msg.platform}]</span>
                  )}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{msg.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--color-border-2)' }}>
            {/* Superchat amount */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['1', '5', '10', '25', '50'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSuperchatAmount(superchatAmount === amt ? '' : amt)}
                  style={{
                    flex: 1, padding: '5px 2px', fontSize: 11, fontWeight: 600,
                    borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                    background: superchatAmount === amt ? 'rgba(245,158,11,0.2)' : 'var(--color-surface-2)',
                    color: superchatAmount === amt ? '#f59e0b' : 'var(--color-text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <form onSubmit={sendChat} style={{ display: 'flex', gap: 8 }}>
              <input
                id="watch-chat-input"
                className="input"
                style={{
                  fontSize: 13,
                  borderColor: superchatAmount ? 'rgba(245,158,11,0.4)' : undefined,
                }}
                placeholder={superchatAmount ? `💰 Superchat $${superchatAmount}...` : 'Send a message...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button
                id="watch-send-chat-btn"
                type="submit"
                className="btn btn-sm"
                style={{
                  background: superchatAmount ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--gradient-brand)',
                  color: 'white', flexShrink: 0,
                }}
              >
                {superchatAmount ? '💰' : '→'}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
