'use client';

import React from 'react';
import { Message, AgentStep, SearchSource, VerificationDelta } from '@/types';
import { SearchSteps } from './SearchSteps';
import { VerificationDiff } from './VerificationDiff';
import { SourceDrawer } from './SourceDrawer';
import { User, Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  activeSteps?: AgentStep[];
  activeSources?: SearchSource[];
  activeDelta?: VerificationDelta;
  isStreaming?: boolean;
}

export function MessageList({
  messages,
  activeSteps = [],
  activeSources = [],
  activeDelta,
  isStreaming = false,
}: MessageListProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24 pt-4 px-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={msg.id || index} className="animate-fade-in group">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold ${
                  isUser
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-zinc-300">
                    {isUser ? 'You' : 'minimi agent'}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono">{formattedTime}</span>
                </div>

                {/* Steps Trace if assistant */}
                {!isUser && msg.steps && msg.steps.length > 0 && (
                  <SearchSteps steps={msg.steps} />
                )}

                {/* Verification Delta Card if present */}
                {!isUser && msg.verificationDelta && (
                  <VerificationDiff delta={msg.verificationDelta} />
                )}

                {/* Message Body */}
                <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans selection:bg-blue-900/40">
                  {msg.content}
                </div>

                {/* Sources Drawer */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <SourceDrawer sources={msg.sources} />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Active Streaming In-Flight Message */}
      {isStreaming && (
        <div className="animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-zinc-300">minimi agent</span>
                <span className="text-[10px] text-zinc-500 font-mono animate-pulse">searching & verifying...</span>
              </div>

              {activeSteps.length > 0 && <SearchSteps steps={activeSteps} />}
              {activeDelta && <VerificationDiff delta={activeDelta} />}
              {activeSources.length > 0 && <SourceDrawer sources={activeSources} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
