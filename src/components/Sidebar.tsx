'use client';

import React from 'react';
import { Session } from '@/types';
import { MessageSquare, Plus, Clock, RefreshCw, Compass } from 'lucide-react';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onResetEvaluation: () => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onResetEvaluation,
}: SidebarProps) {
  return (
    <aside className="w-72 h-screen flex flex-col border-r border-zinc-800/80 bg-[#0b0c10] text-zinc-300 flex-shrink-0 select-none">
      {/* Brand header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              minimi <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">v1.0</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">temporal search agent</p>
          </div>
        </div>

        <button
          onClick={onNewSession}
          title="New conversation"
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Evaluation Test Banners */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-2 block mb-1">
          Episodic Memory Index
        </span>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
        {sessions.map((session) => {
          const isSelected = session.id === currentSessionId;
          const dateStr = new Date(session.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition flex flex-col gap-1 ${
                isSelected
                  ? 'bg-zinc-800/80 text-white border border-zinc-700/80 shadow-sm'
                  : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                <span className="font-medium truncate flex-1">{session.title}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pl-5.5 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {dateStr}
                </span>
                {session.messageCount !== undefined && (
                  <span>{session.messageCount} turns</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / Reset Action */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2">
        <button
          onClick={onResetEvaluation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Evaluation Dataset
        </button>
        <div className="text-[10px] text-zinc-500 text-center font-mono">
          Free mode enabled • 0 API key required
        </div>
      </div>
    </aside>
  );
}
