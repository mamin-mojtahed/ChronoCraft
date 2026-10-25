import { create } from "zustand";
import { CachedTimelineRecord, TimelineData, TimelineSlide } from "@/types/timeline";
import { StorageService } from "@/services/storage";
import { SettingsService } from "@/services/settings";

export type MergeMode = "parallel" | "unified";

interface TimelineStore {
  currentTimeline: TimelineData | null;
  currentRecord: CachedTimelineRecord | null;
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  history: CachedTimelineRecord[];
  historyLoading: boolean;
  sidebarOpen: boolean;
  settingsOpen: boolean;

  // Search input state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Multi-select & Merging state
  isMultiSelectMode: boolean;
  selectedHistoryIds: string[];
  mergeMode: MergeMode;
  mergedSources: CachedTimelineRecord[];

  // Actions
  setTimeline: (data: TimelineData | null, record?: CachedTimelineRecord) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  // Multi-select actions
  toggleMultiSelectMode: (enabled?: boolean) => void;
  toggleSelectHistoryId: (id: string) => void;
  selectAllHistory: () => void;
  clearSelectedHistory: () => void;
  setMergeMode: (mode: MergeMode) => void;
  mergeSelectedTimelines: () => void;

  // History & Cache management
  loadHistory: () => Promise<void>;
  selectTimelineFromHistory: (id: string) => Promise<void>;
  deleteTimelineFromHistory: (id: string) => Promise<void>;
  toggleFavoriteTimeline: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
}

function buildMergedTimeline(
  records: CachedTimelineRecord[],
  mode: MergeMode
): { data: TimelineData; record: CachedTimelineRecord } {
  const combinedEvents: TimelineSlide[] = [];
  const years: number[] = [];

  records.forEach((rec, recIdx) => {
    const trackName = rec.title || rec.topic || `Track ${recIdx + 1}`;
    const evts = rec.timelineData?.events || [];

    evts.forEach((evt, evtIdx) => {
      const year = evt.start_date?.year;
      if (typeof year === "number" && !isNaN(year)) {
        years.push(year);
      }

      combinedEvents.push({
        ...evt,
        unique_id: `${rec.id}-${evt.unique_id || evtIdx + 1}`,
        // In parallel mode, group creates separate horizontal swimlanes in TimelineJS!
        group: mode === "parallel" ? trackName : undefined,
        text: {
          headline: mode === "unified" ? `[${trackName}] ${evt.text?.headline}` : evt.text?.headline,
          text: evt.text?.text || "",
        },
      });
    });
  });

  // Sort combined events chronologically
  combinedEvents.sort((a, b) => {
    const yA = a.start_date?.year ?? 0;
    const yB = b.start_date?.year ?? 0;
    if (yA !== yB) return yA - yB;
    const mA = a.start_date?.month ?? 1;
    const mB = b.start_date?.month ?? 1;
    if (mA !== mB) return mA - mB;
    const dA = a.start_date?.day ?? 1;
    const dB = b.start_date?.day ?? 1;
    return dA - dB;
  });

  const minYear = years.length ? Math.min(...years) : 0;
  const maxYear = years.length ? Math.max(...years) : 0;
  const combinedTitle = records.map((r) => r.title || r.topic).join(" & ");

  const data: TimelineData = {
    title: {
      text: {
        headline: `Comparison: ${combinedTitle}`,
        text: `Comparative chronological timeline merging ${records.length} narratives (${combinedEvents.length} total events) in ${
          mode === "parallel" ? "parallel swimlanes" : "a unified chronological track"
        }.`,
      },
    },
    events: combinedEvents,
  };

  const record: CachedTimelineRecord = {
    id: `merged-${records.map((r) => r.id).join("-")}`,
    topic: combinedTitle,
    title: `Comparison: ${combinedTitle}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    provider: "gemini",
    model: `merged (${mode})`,
    eventsCount: combinedEvents.length,
    dateRange: { startYear: minYear, endYear: maxYear },
    timelineData: data,
    isMerged: true,
    sourceRecordIds: records.map((r) => r.id),
  };

  return { data, record };
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  currentTimeline: null,
  currentRecord: null,
  loading: false,
  loadingMessage: "",
  error: null,
  history: [],
  historyLoading: false,
  sidebarOpen: typeof window !== "undefined" ? SettingsService.getSettings().sidebarOpen : true,
  settingsOpen: false,

  // Search input state
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Multi-select state
  isMultiSelectMode: false,
  selectedHistoryIds: [],
  mergeMode: "parallel",
  mergedSources: [],

  setTimeline: (data, record) => {
    set({
      currentTimeline: data,
      currentRecord: record || null,
      error: null,
      mergedSources: record?.isMerged ? get().mergedSources : [],
    });
  },

  setLoading: (loading, message = "Generating timeline with AI...") => {
    set({ loading, loadingMessage: message, error: loading ? null : get().error });
  },

  setError: (error) => {
    set({ error, loading: false });
  },

  setSidebarOpen: (open) => {
    SettingsService.setSidebarOpen(open);
    set({ sidebarOpen: open });
  },

  toggleSidebar: () => {
    const next = !get().sidebarOpen;
    SettingsService.setSidebarOpen(next);
    set({ sidebarOpen: next });
  },

  setSettingsOpen: (open) => {
    set({ settingsOpen: open });
  },

  toggleMultiSelectMode: (enabled) => {
    const next = enabled !== undefined ? enabled : !get().isMultiSelectMode;
    set({
      isMultiSelectMode: next,
      selectedHistoryIds: next ? get().selectedHistoryIds : [],
    });
  },

  toggleSelectHistoryId: (id) => {
    const current = get().selectedHistoryIds;
    if (current.includes(id)) {
      set({ selectedHistoryIds: current.filter((i) => i !== id) });
    } else {
      set({ selectedHistoryIds: [...current, id] });
    }
  },

  selectAllHistory: () => {
    set({ selectedHistoryIds: get().history.map((h) => h.id) });
  },

  clearSelectedHistory: () => {
    set({ selectedHistoryIds: [] });
  },

  setMergeMode: (mode) => {
    set({ mergeMode: mode });
    // If currently displaying a merged timeline, re-render immediately with the new mode
    const sources = get().mergedSources;
    if (sources.length >= 2) {
      const { data, record } = buildMergedTimeline(sources, mode);
      set({ currentTimeline: data, currentRecord: record });
    }
  },

  mergeSelectedTimelines: () => {
    const selectedIds = get().selectedHistoryIds;
    if (selectedIds.length < 2) return;

    const sources = get().history.filter((h) => selectedIds.includes(h.id));
    if (sources.length < 2) return;

    const mode = get().mergeMode;
    const { data, record } = buildMergedTimeline(sources, mode);

    set({
      currentTimeline: data,
      currentRecord: record,
      mergedSources: sources,
      isMultiSelectMode: false,
      selectedHistoryIds: [],
      error: null,
    });
  },

  loadHistory: async () => {
    set({ historyLoading: true });
    try {
      const records = await StorageService.getAllTimelines();
      set({ history: records, historyLoading: false });
    } catch (err) {
      console.error("Failed to load timeline history:", err);
      set({ historyLoading: false });
    }
  },

  selectTimelineFromHistory: async (id: string) => {
    const cached = await StorageService.getTimeline(id);
    if (cached) {
      set({
        currentTimeline: cached.timelineData,
        currentRecord: cached,
        mergedSources: [],
        error: null,
      });
    }
  },

  deleteTimelineFromHistory: async (id: string) => {
    await StorageService.deleteTimeline(id);
    const updated = get().history.filter((item) => item.id !== id);
    const isCurrent = get().currentRecord?.id === id;
    set({
      history: updated,
      currentTimeline: isCurrent ? null : get().currentTimeline,
      currentRecord: isCurrent ? null : get().currentRecord,
      selectedHistoryIds: get().selectedHistoryIds.filter((i) => i !== id),
    });
  },

  toggleFavoriteTimeline: async (id: string) => {
    await StorageService.toggleFavorite(id);
    const updated = get().history.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    set({ history: updated });
    if (get().currentRecord?.id === id) {
      set({
        currentRecord: {
          ...get().currentRecord!,
          isFavorite: !get().currentRecord!.isFavorite,
        },
      });
    }
  },

  clearAllHistory: async () => {
    await StorageService.clearAllTimelines();
    set({
      history: [],
      currentTimeline: null,
      currentRecord: null,
      selectedHistoryIds: [],
      mergedSources: [],
    });
  },
}));
