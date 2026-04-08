// frontend/src/components/ChatPanel.tsx
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../hooks/usePeerConnection';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  cryptoReady: boolean; // pass true once the session is established
}

export function ChatPanel({ messages, onSend, cryptoReady }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !cryptoReady) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="px-4 py-2 border-b flex items-center gap-2 text-sm font-medium">
        <span
          className={`w-2 h-2 rounded-full ${
            cryptoReady ? 'bg-green-500' : 'bg-yellow-400'
          }`}
        />
        {cryptoReady ? 'E2E Encrypted Chat' : 'Establishing secure channel…'}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                msg.from === 'me'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-3 py-2 flex gap-2">
        <input
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-zinc-400"
          placeholder={cryptoReady ? 'Type a message…' : 'Waiting for peer…'}
          value={input}
          disabled={!cryptoReady}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!cryptoReady || !input.trim()}
          className="text-blue-600 disabled:opacity-30 font-medium text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}