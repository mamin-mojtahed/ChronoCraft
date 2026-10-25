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
}
