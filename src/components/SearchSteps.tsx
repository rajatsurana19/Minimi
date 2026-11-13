'use client';

import React, { useState } from 'react';
import { AgentStep } from '@/types';
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, Sparkles, Clock, Globe, GitCompare, Layers } from 'lucide-react';

interface SearchStepsProps {
  steps: AgentStep[];
}

export function SearchSteps({ steps }: SearchStepsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  const activeStep = steps.find((s) => s.status === 'running') || steps[steps.length - 1];
  const isRunning = steps.some((s) => s.status === 'running');

  const getStepIcon = (type: string, status: string) => {
    if (status === 'running') {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />;
    }
    switch (type) {
      case 'temporal':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'memory_recall':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'query_decomposition':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'web_search':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'fact_verification':
        return <GitCompare className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="my-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-300 overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/60 hover:bg-zinc-900/90 transition text-left"
      >
        <div className="flex items-center gap-2 truncate">
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          )}
          <span className="font-medium text-zinc-200 truncate">
            {isRunning ? activeStep?.title || 'Processing agent reasoning...' : `Thought trace (${steps.length} steps completed)`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 flex-shrink-0">
          <span className="text-[11px] text-zinc-500">{steps.length} ops</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-zinc-800/60 space-y-2 bg-zinc-950/40">
          {steps.map((st) => (
            <div key={st.id} className="flex items-start gap-2.5 group">
              <div className="mt-0.5 flex-shrink-0">{getStepIcon(st.type, st.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-zinc-200 truncate">{st.title}</span>
                  <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">
                    {new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                {st.description && (
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed break-words font-sans">
                    {st.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
