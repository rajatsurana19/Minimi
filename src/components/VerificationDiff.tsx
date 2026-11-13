'use client';

import React from 'react';
import { VerificationDelta } from '@/types';
import { CheckCircle2, Sparkles, ExternalLink, Calendar } from 'lucide-react';

interface VerificationDiffProps {
  delta: VerificationDelta;
}

export function VerificationDiff({ delta }: VerificationDiffProps) {
  if (!delta || !delta.items || delta.items.length === 0) return null;

  return (
    <div className="my-3 rounded-lg border border-zinc-800 bg-[#10121a]/80 p-3.5 text-xs text-zinc-300">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200">Temporal Verification Diff</span>
          {delta.historicalDate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 text-zinc-400">
              <Calendar className="w-2.5 h-2.5" />
              Base: {delta.historicalDate}
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Live Grounded</span>
      </div>

      <div className="space-y-2.5">
        {delta.items.map((item, idx) => {
          const isFeature = item.status === 'new_feature';
          const isChanged = item.status === 'changed';
          const isUnchanged = item.status === 'unchanged';

          return (
            <div
              key={idx}
              className="p-2.5 rounded-md bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700/80 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-zinc-200 text-xs">{item.entity}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                    isChanged
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : isFeature
                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {isFeature ? (
                    <Sparkles className="w-2.5 h-2.5" />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  )}
                  {isChanged ? 'Price Updated' : isFeature ? 'Product Shipped' : 'Pricing Stable'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono mb-0.5">Historical Claim</span>
                  <p className="line-clamp-2 text-zinc-300">{item.historicalClaim}</p>
                </div>
                <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900">
                  <span className="text-[10px] text-blue-400/80 block uppercase font-mono mb-0.5">Verified Finding</span>
                  <p className="line-clamp-2 text-zinc-200">{item.currentFinding}</p>
                </div>
              </div>

              {item.sources && item.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-zinc-800/40">
                  {item.sources.map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-blue-400 transition underline underline-offset-2"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {src.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
