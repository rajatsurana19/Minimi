'use client';

import React from 'react';
import { SearchSource } from '@/types';
import { Globe, ExternalLink } from 'lucide-react';

interface SourceDrawerProps {
  sources: SearchSource[];
}

export function SourceDrawer({ sources }: SourceDrawerProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="my-2 flex flex-wrap gap-1.5 items-center">
      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mr-1 flex items-center gap-1">
        <Globe className="w-3 h-3 text-zinc-400" />
        Sources:
      </span>
      {sources.map((src, idx) => (
        <a
          key={src.id || idx}
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          title={src.snippet}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition group"
        >
          <span className="text-zinc-500 text-[10px] font-mono group-hover:text-blue-400">[{idx + 1}]</span>
          <span className="truncate max-w-[140px]">{src.title || src.domain}</span>
          <ExternalLink className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300" />
        </a>
      ))}
    </div>
  );
}
