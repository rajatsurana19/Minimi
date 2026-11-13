import { AgentStep, Message, SearchSource, VerificationDelta } from '@/types';
import { AgentPlanner } from './planner';
import { UnifiedSearchEngine } from '../search/engine';
import { DeltaVerifier } from './verifier';
import { MockAgentEngine } from './mock';
import { MemoryStore } from '../memory/store';
import { nanoid } from 'nanoid';

export interface OrchestratorCallbacks {
  onStepStart: (step: AgentStep) => void;
  onStepUpdate: (step: AgentStep) => void;
  onStepFinish: (step: AgentStep) => void;
  onSources: (sources: SearchSource[]) => void;
  onDelta: (delta: VerificationDelta) => void;
  onToken: (token: string) => void;
  onDone: (finalMessage: Message) => void;
  onError: (error: string) => void;
}

export class AgentOrchestrator {
  public static async execute(
    userQuery: string,
    sessionId: string,
    callbacks: OrchestratorCallbacks
  ): Promise<void> {
    const memory = MemoryStore.getInstance();
    const startTime = Date.now();

    // 1. Record User Message
    const userMessage: Message = {
      id: nanoid(),
      sessionId,
      role: 'user',
      content: userQuery,
      createdAt: new Date().toISOString(),
    };
    memory.saveMessage(userMessage);

    const steps: AgentStep[] = [];

    const updateStep = (step: AgentStep) => {
      const idx = steps.findIndex((s) => s.id === step.id);
      if (idx >= 0) steps[idx] = step;
      else steps.push(step);
      callbacks.onStepUpdate(step);
    };

    try {
      // 2. Planning, Temporal Grounding & Memory Recall
      const plan = AgentPlanner.plan(userQuery, sessionId);
      for (const st of plan.initialSteps) {
        steps.push(st);
        callbacks.onStepStart(st);
      }

      // 3. Web Search Execution (Parallel)
      let searchSources: SearchSource[] = [];
      let deltaResult: VerificationDelta | undefined;

      if (plan.searchQueries.length > 0) {
        const searchStep: AgentStep = {
          id: 'step-search-exec',
          type: 'web_search',
          title: `Executing ${plan.searchQueries.length} parallel web search queries`,
          status: 'running',
          timestamp: new Date().toISOString(),
        };
        callbacks.onStepStart(searchStep);

        const searchResults = await UnifiedSearchEngine.searchMultiple(plan.searchQueries);

        searchStep.status = 'completed';
        searchStep.description = `Aggregated fresh results across ${Object.keys(searchResults).length} queries`;
        updateStep(searchStep);

        // 4. Verification & Delta Fact Check
        const verifyStep: AgentStep = {
          id: 'step-verification',
          type: 'fact_verification',
          title: 'Comparing historical baseline against live web findings',
          status: 'running',
          timestamp: new Date().toISOString(),
        };
        callbacks.onStepStart(verifyStep);

        const verification = DeltaVerifier.verify(
          plan.recalledEntities,
          plan.temporalContext?.targetDateFormatted,
          searchResults
        );

        searchSources = verification.sources;
        deltaResult = verification.delta;

        verifyStep.status = 'completed';
        verifyStep.description = `Verified ${verification.delta.items.length} entities with citation grounding`;
        updateStep(verifyStep);

        callbacks.onSources(searchSources);
        callbacks.onDelta(deltaResult);
      }

      // 5. Response Synthesis & Streaming (Real LLM if API Key exists, or Free Mock Stream)
      let fullContent = '';
      const groqKey = process.env.GROQ_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (groqKey && groqKey.trim().length > 0) {
        // Groq Free Tier LLM Stream
        fullContent = await this.streamFromOpenAICompatible(
          'https://api.groq.com/openai/v1',
          groqKey,
          'llama-3.3-70b-versatile',
          userQuery,
          plan,
          deltaResult,
          searchSources,
          callbacks.onToken
        );
      } else if (openaiKey && openaiKey.trim().length > 0) {
        // OpenAI Stream
        fullContent = await this.streamFromOpenAICompatible(
          'https://api.openai.com/v1',
          openaiKey,
          'gpt-4o-mini',
          userQuery,
          plan,
          deltaResult,
          searchSources,
          callbacks.onToken
        );
      } else {
        // Autonomous Free Fallback Stream
        const stream = MockAgentEngine.generateStream(
          userQuery,
          plan.temporalContext,
          plan.recalledMessages,
          plan.recalledEntities,
          deltaResult
        );

        for await (const token of stream) {
          fullContent += token;
          callbacks.onToken(token);
        }
      }

      // 6. Save Assistant Response in Episodic Memory
      const assistantMessage: Message = {
        id: nanoid(),
        sessionId,
        role: 'assistant',
        content: fullContent,
        createdAt: new Date().toISOString(),
        steps,
        sources: searchSources,
        verificationDelta: deltaResult,
        entities: plan.recalledEntities,
      };

      memory.saveMessage(assistantMessage);
      callbacks.onDone(assistantMessage);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Agent execution error:', message);
      callbacks.onError(message);
    }
  }

  private static async streamFromOpenAICompatible(
    baseUrl: string,
    apiKey: string,
    model: string,
    query: string,
    plan: ReturnType<typeof AgentPlanner.plan>,
    delta: VerificationDelta | undefined,
    sources: SearchSource[],
    onToken: (token: string) => void
  ): Promise<string> {
    const systemPrompt = `You are a precision chat agent with web search.
Grounding:
- Today is ${new Date().toDateString()}.
- Recalled entities from prior conversation: ${plan.recalledEntities.join(', ') || 'None'}.
- Live sources retrieved: ${sources.map((s) => `[${s.title}](${s.url}): ${s.snippet}`).join('\n')}

Rules:
1. Answer directly and concisely.
2. If verifying past conversations, explicitly highlight: what stayed the same vs what changed.
3. Cite sources with markdown links.`;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`LLM provider returned status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const payload = line.replace('data: ', '').trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const deltaToken = parsed.choices?.[0]?.delta?.content || '';
          if (deltaToken) {
            accumulated += deltaToken;
            onToken(deltaToken);
          }
        } catch {
          // ignore stream parse glitches
        }
      }
    }

    return accumulated;
  }
}
