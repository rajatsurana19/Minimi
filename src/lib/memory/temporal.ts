/**
 * Temporal Resolution Engine
 * Grounds the agent in wall-clock time and resolves relative temporal expressions
 * (e.g., "On Monday", "Last Tuesday", "3 November", "since then") into concrete dates.
 */

export interface TemporalContext {
  now: Date;
  isoString: string;
  formattedDate: string;
  dayOfWeek: string;
}

export interface ResolvedTimeWindow {
  detectedPhrase?: string;
  targetDate?: Date;
  targetDateFormatted?: string;
  isRelative: boolean;
  searchFilterDate?: string; // YYYY-MM-DD for search recency operators
}

export class TemporalEngine {
  /**
   * Get current anchored temporal context
   */
  public static getContext(referenceDate?: Date): TemporalContext {
    const now = referenceDate || new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      now,
      isoString: now.toISOString(),
      formattedDate: now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      dayOfWeek: days[now.getDay()],
    };
  }

  /**
   * Parse relative and absolute date expressions from user query
   */
  public static resolveQueryTemporalContext(
    query: string,
    currentDate: Date = new Date()
  ): ResolvedTimeWindow | null {
    const lower = query.toLowerCase();

    // 1. Explicit dates like "3 November" or "November 3" or "Nov 3"
    const monthRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
    const monthRegexReverse = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

    let match = lower.match(monthRegex);
    let day = 0;
    let monthStr = '';

    if (match) {
      day = parseInt(match[1], 10);
      monthStr = match[2];
    } else {
      match = lower.match(monthRegexReverse);
      if (match) {
        monthStr = match[1];
        day = parseInt(match[2], 10);
      }
    }

    if (day && monthStr) {
      const parsedDate = new Date(`${monthStr} ${day}, ${currentDate.getFullYear()}`);
      if (!isNaN(parsedDate.getTime())) {
        // If parsed date is in future relative to current date, assume previous year
        if (parsedDate > currentDate) {
          parsedDate.setFullYear(currentDate.getFullYear() - 1);
        }
        return {
          detectedPhrase: match?.[0],
          targetDate: parsedDate,
          targetDateFormatted: parsedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          isRelative: false,
          searchFilterDate: parsedDate.toISOString().split('T')[0],
        };
      }
    }

    // 2. Relative day references: "last tuesday", "on monday", "this past wednesday"
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < weekdays.length; i++) {
      const dayName = weekdays[i];
      const lastPattern = new RegExp(`\\b(?:last|past)\\s+${dayName}\\b`, 'i');
      const onPattern = new RegExp(`\\b(?:on\\s+)?${dayName}\\b`, 'i');

      if (lastPattern.test(lower)) {
        const target = this.getPreviousWeekday(currentDate, i, true);
        return {
          detectedPhrase: `last ${dayName}`,
          targetDate: target,
          targetDateFormatted: target.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          isRelative: true,
          searchFilterDate: target.toISOString().split('T')[0],
        };
      } else if (onPattern.test(lower) && (lower.includes('on ') || lower.includes('shortlisted') || lower.includes('asked'))) {
        const target = this.getPreviousWeekday(currentDate, i, false);
        return {
          detectedPhrase: dayName,
          targetDate: target,
          targetDateFormatted: target.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          isRelative: true,
          searchFilterDate: target.toISOString().split('T')[0],
        };
      }
    }

    // 3. Yesterday / days ago
    if (/\byesterday\b/i.test(lower)) {
      const target = new Date(currentDate);
      target.setDate(target.getDate() - 1);
      return {
        detectedPhrase: 'yesterday',
        targetDate: target,
        targetDateFormatted: target.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        isRelative: true,
        searchFilterDate: target.toISOString().split('T')[0],
      };
    }

    return null;
  }

  private static getPreviousWeekday(fromDate: Date, targetDayIndex: number, forceLastWeek: boolean): Date {
    const result = new Date(fromDate);
    const currentDay = result.getDay();
    let diff = (currentDay - targetDayIndex + 7) % 7;
    
    if (diff === 0 || forceLastWeek) {
      diff += 7; // Go back to the previous week's occurrence
    }

    result.setDate(result.getDate() - diff);
    return result;
  }
}
