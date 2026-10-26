export interface TimelineDate {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  display_date?: string;
}

export interface TimelineMedia {
  url?: string;
  caption?: string;
  credit?: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  link?: string;
}

export interface TimelineText {
  headline: string;
  text: string;
}

export interface TimelineSlide {
  start_date: TimelineDate;
  end_date?: TimelineDate;
  text: TimelineText;
  media?: TimelineMedia;
  group?: string;
  display_date?: string;
  background?: {
    url?: string;
    color?: string;
  };
  unique_id?: string;
}

export interface TimelineData {
  title?: {
    media?: TimelineMedia;
    text: TimelineText;
    background?: {
      url?: string;
      color?: string;
    };
  };
  events: TimelineSlide[];
}

export interface CachedTimelineRecord {
  id: string;
  topic: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  provider: 'gemini' | 'openai';
  model: string;
  eventsCount: number;
  dateRange: {
    startYear: number;
    endYear: number;
  };
  timelineData: TimelineData;
  isFavorite?: boolean;
  tags?: string[];
  isMerged?: boolean;
  sourceRecordIds?: string[];
  colorHex?: string;
}

export interface ExtractedDateParts {
  year: string;
  month: string;
  day: string;
  displayDate: string;
}

/**
 * Robustly extracts year, month, day, and displayDate from any timeline date representation,
 * including plain JSON objects, string dates, numbers, or mutated Knight Lab TimelineJS TL.Date objects.
 */
export function extractDateParts(dateObj: any, fallbackDisplayDate?: string): ExtractedDateParts {
  let year = "";
  let month = "";
  let day = "";
  let displayDate = "";

  if (dateObj !== undefined && dateObj !== null) {
    // 1. If it's a TimelineJS TL.Date object, the properties are often nested in .data
    const d = (typeof dateObj === "object" && "data" in dateObj && dateObj.data) 
      ? dateObj.data 
      : dateObj;

    const rawYear = d?.year ?? dateObj?.year;
    if (rawYear !== undefined && rawYear !== null && rawYear !== "") {
      year = String(rawYear);
    }

    const rawMonth = d?.month ?? dateObj?.month;
    if (rawMonth !== undefined && rawMonth !== null && rawMonth !== "") {
      month = String(rawMonth);
    }

    const rawDay = d?.day ?? dateObj?.day;
    if (rawDay !== undefined && rawDay !== null && rawDay !== "") {
      day = String(rawDay);
    }

    const rawDisplay = d?.display_date ?? dateObj?.display_date;
    if (rawDisplay) {
      displayDate = String(rawDisplay);
    }

    // 2. Check TimelineJS TL.Date methods if year is still not extracted
    if (!year) {
      if (typeof dateObj.getFullYear === "function") {
        year = String(dateObj.getFullYear());
      } else if (typeof dateObj.getYear === "function") {
        year = String(dateObj.getYear());
      }
      if (!month && typeof dateObj.getMonth === "function") {
        const m = dateObj.getMonth();
        if (typeof m === "number") month = String(m + 1);
      }
      if (!day && typeof dateObj.getDate === "function") {
        const dd = dateObj.getDate();
        if (typeof dd === "number") day = String(dd);
      }
    }

    // 3. Check internal JS Date object
    const internalDate = d?.date || d?._date || dateObj?._date;
    if (!year && internalDate instanceof Date && !isNaN(internalDate.getTime())) {
      year = String(internalDate.getFullYear());
      if (!month) month = String(internalDate.getMonth() + 1);
      if (!day) day = String(internalDate.getDate());
    }

    // 4. If dateObj is a primitive number or string
    if (typeof dateObj === "number") {
      year = String(dateObj);
    } else if (typeof dateObj === "string") {
      const match = dateObj.match(/(-?\d{1,4})/);
      if (match) year = match[1];
    }
  }

  // 5. Fallback extraction from display date string if year is still missing
  if (!year && fallbackDisplayDate) {
    displayDate = fallbackDisplayDate;
    const match = fallbackDisplayDate.match(/\b(-?\d{1,4})\b/);
    if (match) {
      year = match[1];
    }
  }

  return { year, month, day, displayDate };
}

/**
 * Returns a human-friendly formatted date string (e.g. "1963/8/9" or "1963 — 1972")
 */
export function formatEventDate(start: any, end?: any, displayOverride?: string): string {
  if (displayOverride && displayOverride.trim()) {
    return displayOverride.trim();
  }
  const s = extractDateParts(start, displayOverride);
  if (!s.year) return "";

  const startStr = [s.year, s.month ? `/${s.month}` : "", s.day ? `/${s.day}` : ""].join("");
  
  if (end) {
    const e = extractDateParts(end);
    if (e.year) {
      const endStr = [e.year, e.month ? `/${e.month}` : "", e.day ? `/${e.day}` : ""].join("");
      return `${startStr} — ${endStr}`;
    }
  }

  return startStr;
}

