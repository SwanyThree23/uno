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
  const [captions, setCaptions]       = useState<Array<{text: string, timestamp: number}>>([]);
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
      socket.on('stream:subtitle', (subtitle: { text: string; timestamp: number }) => {
        setCaptions((prev: Array<{text: string, timestamp: number}>) => {
          const newCaptions = [...prev, subtitle];
          return newCaptions.slice(-3); // keep only last 3 captions
        });
      });

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
      <div className="flex h-screen items-center justify-center">
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-56 p-24 glass border-b border-color-border-2" style={{ background: 'rgba(9,9,18,0.95)' }}>
        <div className="flex items-center gap-12">
          <span className="font-space-grotesk font-800 text-lg">
            SeeWhy <span className="gradient-text">LIVE</span>
          </span>
          {stage.status === 'LIVE' && (
            <div className="live-badge">
              <div className="live-dot" />
              LIVE
            </div>
          )}
        </div>
        <div className="flex items-center gap-16 text-xs color-text-muted">
          <span>👀 {viewerCount} watching</span>
          {metrics.bitrate && <span>📡 {metrics.bitrate}kbps</span>}
          {metrics.fps && <span>🎬 {metrics.fps}fps</span>}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Video area */}
        <div className="flex flex-1 flex-col">
          {/* VDO.Ninja viewer */}
          <div className="flex-1 bg-black relative min-h-0">
            {stage.roomId && stage.status === 'LIVE' ? (
              <iframe
                src={`${VDO_NINJA_BASE}/?room=${stage.roomId}&view&scene&cleanish`}
                className="w-full h-full border-none"
                style={{ minHeight: 480 }}
                allow="autoplay;fullscreen"
                title={stage.title}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-12 color-text-muted" style={{ height: 480 }}>
                <div className="text-5xl">
                  {stage.status === 'UPCOMING' ? '⏳' : stage.status === 'ENDED' ? '📼' : '🎥'}
                </div>
                <div className="text-base text-center">
                  {stage.status === 'UPCOMING' ? 'Stream hasn\'t started yet' :
                   stage.status === 'ENDED'    ? 'Stream has ended' : 'Waiting for stream...'}
                </div>
              </div>
            )}
            
            {/* Live Captions Layer */}
            {captions.length > 0 && (
              <div className="absolute left-0 w-full flex flex-col items-center gap-4 pointer-events-none" style={{ bottom: 40, zIndex: 10 }}>
                {captions.map((c, i) => (
                  <div key={c.timestamp} className="bg-black-75 color-white p-8 px-12 rounded-sm text-lg font-600 shadow-caption" style={{
                    opacity: 1 - ((captions.length - 1 - i) * 0.25)
                  }}>
                    {c.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage info */}
          <div className="p-24 border-t border-color-border-2">
            <h1 className="text-xl mb-8">{stage.title}</h1>
            <div className="flex items-center gap-12">
              <div className="flex items-center justify-center w-32 h-32 rounded-full bg-brand-gradient text-xs font-700 color-white">
                {stage.creator.displayName[0]}
              </div>
              <div>
                <div className="text-sm font-600">{stage.creator.displayName}</div>
                <div className="text-xs color-text-muted">@{stage.creator.username}</div>
              </div>
            </div>
            {stage.description && (
              <p className="mt-12 text-sm color-text-muted leading-relaxed">
                {stage.description}
              </p>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        <aside className="flex flex-col border-l border-color-border-2 bg-surface" style={{ width: 340, flexShrink: 0 }}>
          <div className="flex items-center justify-between p-16 border-b border-color-border-2">
            <h2 className="text-sm font-600">💬 Live Chat</h2>
            <span className="text-xs color-text-muted">{stage._count.chatMessages} messages</span>
          </div>

          <div className="flex flex-1 flex-col gap-8 p-12 overflow-auto">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`p-12 rounded-md ${
                msg.type === 'SUPERCHAT' ? 'bg-amber-10 border border-amber-30' : 'bg-surface border border-color-border-2'
              }`}>
                <div className={`text-xs font-600 mb-4 ${msg.type === 'SUPERCHAT' ? 'color-warning' : 'color-brand-violet'}`}>
                  {msg.user?.displayName || 'Anonymous'}
                  {msg.type === 'SUPERCHAT' && <span className="ml-8">💰 ${Number(msg.amount).toFixed(2)}</span>}
                  {msg.platform !== 'SEEWHY' && (
                    <span className="ml-8 text-xxs opacity-70">[{msg.platform}]</span>
                  )}
                </div>
                <div className="text-sm leading-normal">{msg.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-12 border-t border-color-border-2">
            {/* Superchat amount */}
            <div className="flex gap-8 mb-12">
              {['1', '5', '10', '25', '50'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSuperchatAmount(superchatAmount === amt ? '' : amt)}
                  className={`flex-1 py-4 text-xs font-600 rounded-sm border-none cursor-pointer transition-all ${
                    superchatAmount === amt ? 'bg-amber-20 color-warning' : 'bg-surface-2 color-text-muted'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <form onSubmit={sendChat} className="flex gap-8">
              <input
                id="watch-chat-input"
                className={`input text-sm ${superchatAmount ? 'border-warning-40' : ''}`}
                style={{
                  borderColor: superchatAmount ? 'rgba(245,158,11,0.4)' : undefined,
                }}
                placeholder={superchatAmount ? `💰 Superchat $${superchatAmount}...` : 'Send a message...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button
                id="watch-send-chat-btn"
                type="submit"
                className="btn btn-sm flex-shrink-0"
                style={{
                  background: superchatAmount ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--gradient-brand)',
                  color: 'white',
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
