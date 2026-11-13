'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, Session, AgentStep, SearchSource, VerificationDelta } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/MessageList';
import { ChatInterface } from '@/components/ChatInterface';
import { Compass, Sparkles, Clock, Globe } from 'lucide-react';

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // In-flight streaming states
  const [activeSteps, setActiveSteps] = useState<AgentStep[]>([]);
  const [activeSources, setActiveSources] = useState<SearchSource[]>([]);
  const [activeDelta, setActiveDelta] = useState<VerificationDelta | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial sessions
  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        if (!currentSessionId) {
          setCurrentSessionId(data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  };

  // Load messages for session
  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSteps, isStreaming]);

  const handleNewSession = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev]);
        setCurrentSessionId(data.session.id);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to create session', e);
    }
  };

  const handleResetEvaluation = async () => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      await loadSessions();
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
    } catch (e) {
      console.error('Failed to reset evaluation', e);
    }
  };

  const handleSendMessage = async (query: string) => {
    if (isStreaming || !query.trim()) return;

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      targetSessionId = 'session-default';
      setCurrentSessionId(targetSessionId);
    }

    const optimisticUserMsg: Message = {
      id: `temp-${Date.now()}`,
      sessionId: targetSessionId,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsStreaming(true);
    setActiveSteps([]);
    setActiveSources([]);
    setActiveDelta(undefined);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, sessionId: targetSessionId }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to initiate SSE stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const events = streamBuffer.split('\n\n');
        streamBuffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventType = '';
          let eventDataRaw = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.replace('event: ', '').trim();
            if (line.startsWith('data: ')) eventDataRaw = line.replace('data: ', '').trim();
          }

          if (!eventType || !eventDataRaw) continue;

          try {
            const data = JSON.parse(eventDataRaw);

            if (eventType === 'step_start' || eventType === 'step_update') {
              setActiveSteps((prev) => {
                const idx = prev.findIndex((s) => s.id === data.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = data;
                  return updated;
                }
                return [...prev, data];
              });
            } else if (eventType === 'sources') {
              setActiveSources(data);
            } else if (eventType === 'delta') {
              setActiveDelta(data);
            } else if (eventType === 'token') {
              accumulatedContent += data;
            } else if (eventType === 'done') {
              setMessages((prev) => [...prev, data]);
              setActiveSteps([]);
              setActiveSources([]);
              setActiveDelta(undefined);
              setIsStreaming(false);
              loadSessions();
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } catch (err) {
      console.error('Streaming error', err);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#090a0f] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewSession={handleNewSession}
        onResetEvaluation={handleResetEvaluation}
      />

      {/* Main chat viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-12 border-b border-zinc-800/80 bg-[#090a0f]/80 backdrop-blur px-6 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">
              {sessions.find((s) => s.id === currentSessionId)?.title || 'Evaluation Sandbox'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Temporal Verification Mode
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
              <Globe className="w-3 h-3 text-emerald-400" />
              Live Search Connected
            </span>
          </div>
        </header>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto relative">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 -mt-10">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-white tracking-tight mb-1">
                Precision Chat Agent with Temporal Search
              </h2>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed mb-6 font-sans">
                Engineered for temporal memory, parallel query decomposition, and factual delta verification against live web sources.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-w-2xl text-left">
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Temporal Grounding
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Anchors relative dates (&quot;Monday&quot;, &quot;last Tuesday&quot;) to absolute timestamps.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Episodic Recall
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Retrieves exact shortlisted items and prior claims across conversations.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-semibold mb-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Delta Verification
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Synthesizes what pricing/features changed vs what stayed identical.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <MessageList
              messages={messages}
              activeSteps={activeSteps}
              activeSources={activeSources}
              activeDelta={activeDelta}
              isStreaming={isStreaming}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Interface */}
        <ChatInterface
          sessionId={currentSessionId}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  );
}
