'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, AgentStep, SearchSource, VerificationDelta } from '@/types';
import { ArrowUp, Sparkles, CornerDownLeft } from 'lucide-react';

interface ChatInterfaceProps {
  sessionId: string;
  onSendMessage: (query: string) => Promise<void>;
  isStreaming: boolean;
}

const EVALUATION_PROMPTS = [
  {
    title: 'CRM Shortlist Changes',
    query: 'On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?',
  },
  {
    title: '3 November Check',
    query: 'What did I ask you on 3 November? Is your answer still correct today?',
  },
  {
    title: 'Postgres Hosting Pricing',
    query: 'Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?',
  },
];

export function ChatInterface({
  sessionId,
  onSendMessage,
  isStreaming,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const q = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-72 right-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/90 to-transparent pt-6 pb-5 px-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto space-y-3">
        {/* Quick evaluation pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 flex-shrink-0 pr-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Eval Prompts:
          </span>
          {EVALUATION_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(p.query)}
              disabled={isStreaming}
              className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 whitespace-nowrap transition flex-shrink-0 flex items-center gap-1.5 group"
            >
              <span>{p.title}</span>
              <span className="text-[9px] text-zinc-500 group-hover:text-blue-400 font-mono">→</span>
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="relative rounded-xl border border-zinc-800/90 bg-[#12131a] shadow-2xl focus-within:border-zinc-700 transition">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask anything or verify past decisions with web search..."
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:opacity-50 pr-20"
          />

          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isStreaming}
              className={`p-1.5 rounded-lg text-white transition flex items-center justify-center ${
                input.trim() && !isStreaming
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 font-mono">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Zero-key autonomous verification engine</span>
        </div>
      </div>
    </div>
  );
}
