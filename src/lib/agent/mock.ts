import { Message, SearchSource, VerificationDelta } from '@/types';
import { ResolvedTimeWindow } from '../memory/temporal';

export class MockAgentEngine {
  public static async *generateStream(
    userQuery: string,
    temporal: ResolvedTimeWindow | null,
    recalledMessages: Message[],
    recalledEntities: string[],
    delta?: VerificationDelta
  ): AsyncGenerator<string, void, unknown> {
    const q = userQuery.toLowerCase();

    let fullResponse = '';

    if (q.includes('crm') || (recalledEntities.includes('Attio') && q.includes('changed'))) {
      const historicalDay = temporal?.targetDateFormatted || 'Monday';
      fullResponse = [
        `On **${historicalDay}**, we shortlisted **5 CRM tools** for your 20-person sales team:`,
        `1. **HubSpot Sales Hub** (Professional: ~$90/user/mo)`,
        `2. **Pipedrive** (Advanced: $29/user/mo)`,
        `3. **Salesforce Sales Cloud** (Starter Suite: $25/user/mo)`,
        `4. **Attio** (Plus: $34/user/mo, Pro: $69/user/mo)`,
        `5. **Close CRM** (Growth: $49/user/mo)`,
        ``,
        `---`,
        ``,
        `### What Has Changed Since Then?`,
        ``,
        `I conducted a targeted search across official pricing pages and changelogs for all 5 vendors. Here is the verification diff:`,
        ``,
        `* **Pricing Changes**: **None.** None of the 5 shortlisted vendors have raised or adjusted their core per-seat pricing since our discussion on ${historicalDay}.`,
        `* **Major Product Shipments**:`,
        `  * **Attio**: Shipped **AI Automations 2.0** with custom trigger workflows and enhanced dynamic reporting objects.`,
        `  * **Salesforce**: Expanded pilot availability for **Agentforce Sales SDRs**, allowing automated prospecting directly integrated with Starter & Enterprise tiers.`,
        `  * **Pipedrive**: Rolled out updated **AI Smart Docs** for automatic contract generation from deals.`,
        `  * **HubSpot & Close**: Incremental performance updates to their sequences and power dialers, with no breaking feature changes.`,
        ``,
        `**Summary**: Your pricing models and cost projections ($580/mo for Pipedrive up to $1,800/mo for HubSpot Pro) remain 100% valid today.`,
      ].join('\n');
    } else if (q.includes('3 november') || (q.includes('postgres') && (q.includes('pricing') || q.includes('correct')))) {
      const targetDate = temporal?.targetDateFormatted || 'November 3';
      fullResponse = [
        `On **${targetDate}**, you asked about **managed PostgreSQL hosting options** and requested a comparison between **Neon, Supabase, AWS RDS, and Render**.`,
        ``,
        `---`,
        ``,
        `### Verification: Is the Answer Still Correct Today?`,
        ``,
        `**Yes, the core pricing, tier structure, and feature architecture are still accurate today.**`,
        ``,
        `Here is the side-by-side verification:`,
        ``,
        `1. **Neon**:`,
        `   * **Status**: Unchanged & verified.`,
        `   * **Details**: The Free Tier (0.5 GB storage, 190 compute hours) and Launch Plan ($19/mo with 10 GB storage and $0.16/CU-hour) remain active.`,
        `2. **Supabase**:`,
        `   * **Status**: Unchanged & verified.`,
        `   * **Details**: Pro tier remains $25/month with 8GB disk space included. The 500MB free tier project limit is still in effect.`,
        `3. **Render**:`,
        `   * **Status**: Unchanged & verified.`,
        `   * **Details**: Starter Postgres database is still $7/month (256MB RAM, 1GB storage).`,
        `4. **AWS RDS**:`,
        `   * **Status**: Unchanged & verified.`,
        `   * **Details**: db.t4g.micro on Graviton2 remains ~$0.016/hr (~$12–$15/mo depending on region) plus standard EBS storage rates.`,
        ``,
        `All four providers have maintained steady pricing since ${targetDate}.`,
      ].join('\n');
    } else {
      fullResponse = [
        `I processed your request using real-time search verification.`,
        ``,
        `Based on the latest data retrieved:`,
        `* **Status**: Verified against current web information.`,
        `* **Findings**: Key parameters, specifications, and details match active production releases.`,
        `* **Sources**: Verified across public product documentations and changelog releases.`,
      ].join('\n');
    }

    // Stream token by token with realistic human/agent cadence
    const words = fullResponse.split(/(\s+)/);
    for (const word of words) {
      yield word;
      await new Promise((r) => setTimeout(r, 18));
    }
  }
}
