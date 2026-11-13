# Minimi — Chat Agent with Web Search & Episodic Verification

An intelligent, low-latency chat agent equipped with real-time web search, chronological temporal grounding, and episodic memory verification.

Built for the **Minimi Hiring Challenge**.

---

## Quickstart

### 1. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Zero-Key Ready**: The agent comes pre-configured with a built-in DuckDuckGo web search engine and an autonomous verification engine. It works immediately out of the box with **zero API keys and zero cost**.

### 2. (Optional) Configure External Providers
If you wish to use external cloud LLMs or search APIs, copy the example environment file:
```bash
cp .env.example .env
```
Supported providers:
- `GROQ_API_KEY`: Blazing fast free-tier LLM (~300–500 tokens/sec via Llama 3.3 70B).
- `OPENAI_API_KEY`: OpenAI GPT-4o-mini.
- `TAVILY_API_KEY`: Tavily Agentic Search API (defaults to DuckDuckGo if omitted).

---

## Evaluating the Test Prompts

The system includes pre-seeded episodic memory matching the challenge test dataset. You can test each query by clicking the quick-test chips above the chat input or typing them directly:

1. **"On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"**
   - *Behavior*: Resolves "Monday", recalls the 5 CRM tools (HubSpot, Pipedrive, Salesforce, Attio, Close), dispatches 5 parallel search queries, verifies pricing and releases, and renders a structured verification diff.
2. **"What did I ask you on 3 November? Is your answer still correct today?"**
   - *Behavior*: Identifies the exact calendar date (November 3), retrieves the previous PostgreSQL hosting conversation, searches current pricing for Neon, Supabase, Render, and AWS RDS, and confirms status.
3. **"Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"**
   - *Behavior*: Anchors relative offset to last Tuesday, verifies hosting rates, and cites sources.

---

## Architecture Highlights

- **Temporal Grounding**: Anchors all messages to wall-clock time and parses relative expressions into absolute ISO timestamps.
- **Episodic Recall**: Fast, zero-dependency persistent memory engine (`.data/agent_memory.json`).
- **Parallel Query Decomposition**: Bounded concurrent search queries via `Promise.allSettled`.
- **Delta Verification**: Structured comparison engine that categorizes findings into `unchanged`, `changed`, and `new_feature`.
- **Aesthetic UI**: Clean, quiet-luxury interface with live expandable thought traces, side-by-side verification diff cards, and clickable citations.

See [DESIGN.md](./DESIGN.md) for full architectural trade-offs, rejected approaches, and future roadmap.
