import { AgentStep, Message } from '@/types';
import { TemporalEngine, ResolvedTimeWindow } from '../memory/temporal';
import { MemoryStore } from '../memory/store';
import { SearchParams } from '../search/types';

export type UserIntent = 'MEMORY_VERIFICATION' | 'REALTIME_SEARCH' | 'CONVERSATIONAL';

export interface PlannedExecution {
  intent: UserIntent;
  temporalContext: ResolvedTimeWindow | null;
  recalledMessages: Message[];
  recalledEntities: string[];
  searchQueries: SearchParams[];
  initialSteps: AgentStep[];
}

export class AgentPlanner {
  public static plan(userQuery: string, currentSessionId?: string): PlannedExecution {
    const memory = MemoryStore.getInstance();
    const temporalContext = TemporalEngine.resolveQueryTemporalContext(userQuery);
    const initialSteps: AgentStep[] = [];

    // Step 1: Temporal grounding
    const tempContext = TemporalEngine.getContext();
    initialSteps.push({
      id: 'step-temporal-1',
      type: 'temporal',
      title: 'Anchored wall-clock context',
      description: `Today is ${tempContext.formattedDate}. ${
        temporalContext?.detectedPhrase
          ? `Detected temporal reference "${temporalContext.detectedPhrase}" -> resolved to ${temporalContext.targetDateFormatted}.`
          : 'No historical date specified.'
      }`,
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

    let recalledMessages: Message[] = [];
    let recalledEntities: string[] = [];

    // Step 2: Episodic memory recall if date or past reference is mentioned
    if (temporalContext && temporalContext.targetDate) {
      recalledMessages = memory.findContextByDate(temporalContext.targetDate, 2);
    }

    if (recalledMessages.length === 0 && (userQuery.toLowerCase().includes('ask') || userQuery.toLowerCase().includes('shortlist') || userQuery.toLowerCase().includes('we') || userQuery.toLowerCase().includes('you'))) {
      recalledMessages = memory.searchMemory(userQuery);
    }

    // Extract shortlisted/discussed entities from recalled messages
    for (const msg of recalledMessages) {
      if (msg.entities) {
        recalledEntities.push(...msg.entities);
      }
    }
    recalledEntities = Array.from(new Set(recalledEntities));

    const isVerification =
      recalledMessages.length > 0 ||
      userQuery.toLowerCase().includes('changed') ||
      userQuery.toLowerCase().includes('still correct') ||
      userQuery.toLowerCase().includes('pricing') ||
      userQuery.toLowerCase().includes('shipped');

    const intent: UserIntent = isVerification
      ? 'MEMORY_VERIFICATION'
      : userQuery.toLowerCase().includes('what') || userQuery.toLowerCase().includes('search') || userQuery.toLowerCase().includes('price')
      ? 'REALTIME_SEARCH'
      : 'CONVERSATIONAL';

    if (recalledMessages.length > 0) {
      initialSteps.push({
        id: 'step-memory-1',
        type: 'memory_recall',
        title: `Retrieved past conversation context (${recalledEntities.length || recalledMessages.length} items)`,
        description: `Found prior session discussing: ${recalledEntities.join(', ') || 'historical topics'}.`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        metadata: { messageCount: recalledMessages.length, entities: recalledEntities },
      });
    }

    // Step 3: Parallel search query decomposition
    const searchQueries: SearchParams[] = [];

    if (intent === 'MEMORY_VERIFICATION') {
      if (recalledEntities.length > 0) {
        // Query decomposition: dispatch parallel targeted queries for each entity with temporal recency
        for (const entity of recalledEntities) {
          searchQueries.push({
            query: `${entity} pricing changes product updates changelog`,
            maxResults: 3,
            recencyDays: 14,
          });
        }
      } else {
        searchQueries.push({
          query: `${userQuery} recent pricing changelog updates`,
          maxResults: 5,
        });
      }
    } else if (intent === 'REALTIME_SEARCH') {
      searchQueries.push({
        query: userQuery,
        maxResults: 5,
      });
    }

    if (searchQueries.length > 0) {
      initialSteps.push({
        id: 'step-decomp-1',
        type: 'query_decomposition',
        title: `Decomposed into ${searchQueries.length} parallel search queries`,
        description: searchQueries.map((q) => `"${q.query}"`).slice(0, 3).join(', ') + (searchQueries.length > 3 ? '...' : ''),
        status: 'pending',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      intent,
      temporalContext,
      recalledMessages,
      recalledEntities,
      searchQueries,
      initialSteps,
    };
  }
}
