import { create } from "zustand";
import { CachedTimelineRecord, TimelineData, TimelineSlide } from "@/types/timeline";
import { StorageService } from "@/services/storage";
import { SettingsService } from "@/services/settings";

export interface TrackColor {
  name: string;
  hex: string;
  bg: string;
  border: string;
  text: string;
  swimlane: string;
  navBg: string;
}

export const TRACK_PALETTE: TrackColor[] = [
  {
    name: "Copper",
    hex: "#DCA48E",
    bg: "#FAF4F0",
    border: "#DCA48E",
    text: "#663320",
    swimlane: "linear-gradient(90deg, #7A4232 0%, #5C3023 50%, #442117 100%)",
    navBg: "linear-gradient(180deg, #4A2419 0%, #33170F 50%, #1F0C07 100%)",
  },
  {
    name: "Teal",
    hex: "#4E9B9E",
    bg: "#F0F7F7",
    border: "#4E9B9E",
    text: "#184547",
    swimlane: "linear-gradient(90deg, #24757A 0%, #1A575B 50%, #124043 100%)",
    navBg: "linear-gradient(180deg, #13464A 0%, #0C2F32 50%, #061C1E 100%)",
  },
  {
    name: "Gold",
    hex: "#DE9F35",
    bg: "#FCF8ED",
    border: "#DE9F35",
    text: "#523600",
    swimlane: "linear-gradient(90deg, #996B17 0%, #78520D 50%, #573A05 100%)",
    navBg: "linear-gradient(180deg, #54390A 0%, #3B2605 50%, #221502 100%)",
  },
  {
    name: "Indigo",
    hex: "#8A74B8",
    bg: "#F4F1FA",
    border: "#8A74B8",
    text: "#34235C",
    swimlane: "linear-gradient(90deg, #6C48A3 0%, #543582 50%, #3E2463 100%)",
    navBg: "linear-gradient(180deg, #3E2461 0%, #2A1744 50%, #170B27 100%)",
  },
  {
    name: "Coral",
    hex: "#D96868",
    bg: "#FDF2F2",
    border: "#D96868",
    text: "#5E1818",
    swimlane: "linear-gradient(90deg, #9E3737 0%, #7D2626 50%, #5C1818 100%)",
    navBg: "linear-gradient(180deg, #571B1B 0%, #3D1010 50%, #230808 100%)",
  },
  {
    name: "Emerald",
    hex: "#4B9678",
    bg: "#F0F8F4",
    border: "#4B9678",
    text: "#124230",
    swimlane: "linear-gradient(90deg, #2A7858 0%, #1E5C42 50%, #144530 100%)",
    navBg: "linear-gradient(180deg, #144531 0%, #0D2F21 50%, #071C13 100%)",
  },
];

export function getTimelineTrackColor(
  record?: CachedTimelineRecord | null,
  history?: CachedTimelineRecord[]
): TrackColor {
  if (!record) return TRACK_PALETTE[0];
  if (history && history.length > 0) {
    const idx = history.findIndex((h) => h.id === record.id);
    if (idx !== -1) {
      return TRACK_PALETTE[idx % TRACK_PALETTE.length];
    }
  }
  let hash = 0;
  const str = record.id + (record.title || record.topic || "");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return TRACK_PALETTE[Math.abs(hash) % TRACK_PALETTE.length];
}

export interface ComparisonTrackInfo {
  id: string;
  title: string;
  color: TrackColor;
  eventsCount: number;
}

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

  // Reactive Compare mode state
  isCompareMode: boolean;
  selectedHistoryIds: string[];
  comparisonTracks: ComparisonTrackInfo[];
  comparisonViewMode: "parallel" | "merged";

  // Actions
  setTimeline: (data: TimelineData | null, record?: CachedTimelineRecord) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  // Compare mode actions (instant reactive comparison)
  toggleCompareMode: (enabled?: boolean) => void;
  toggleSelectHistoryId: (id: string) => void;
  selectAllHistory: () => void;
  clearSelectedHistory: () => void;
  setComparisonViewMode: (mode: "parallel" | "merged") => void;
  applyComparison: (selectedIds: string[], viewMode?: "parallel" | "merged") => void;

  // History & Cache management
  loadHistory: () => Promise<void>;
  selectTimelineFromHistory: (id: string) => Promise<void>;
  deleteTimelineFromHistory: (id: string) => Promise<void>;
  toggleFavoriteTimeline: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
}

function buildComparisonTimeline(
  records: CachedTimelineRecord[],
  viewMode: "parallel" | "merged" = "parallel"
): {
  data: TimelineData;
  record: CachedTimelineRecord;
  tracks: ComparisonTrackInfo[];
} {
  const combinedEvents: (TimelineSlide & { trackColorHex?: string; trackTitle?: string; sourceRecordId?: string })[] = [];
  const years: number[] = [];
  const tracks: ComparisonTrackInfo[] = [];

  records.forEach((rec, recIdx) => {
    const trackColor = TRACK_PALETTE[recIdx % TRACK_PALETTE.length];
    const trackName = rec.title || rec.topic || `Track ${recIdx + 1}`;
    const evts = rec.timelineData?.events || [];

    tracks.push({
      id: rec.id,
      title: trackName,
      color: trackColor,
      eventsCount: evts.length,
    });

    evts.forEach((evt, evtIdx) => {
      const year = evt.start_date?.year;
      if (typeof year === "number" && !isNaN(year)) {
        years.push(year);
      }

      const isLightTrack = ["#DCA48E", "#DE9F35"].includes(trackColor.hex);
      const trackBadgeTextColor = isLightTrack ? "#1A2121" : "#FFFFFF";

      combinedEvents.push({
        ...evt,
        unique_id: `track-${recIdx}-evt-${evtIdx}`,
        // In "parallel" mode, group defines the swimlane; in "merged" mode, group is omitted so events flow in one unified line
        group: viewMode === "parallel" ? trackName : undefined,
        background: {
          color: trackColor.bg, // Distinct event slide canvas background
        },
        text: {
          // Pure milestone title: No track label prepended, so .tl-timemarker displays the actual milestone title!
          headline: evt.text?.headline || "",
          // Slide body includes the colored track badge and styled card container
          text: `<div style="display:inline-flex; align-items:center; gap:6px; background-color:${trackColor.hex}; color:${trackBadgeTextColor}; padding:3px 12px; border-radius:9999px; font-size:11px; font-weight:700; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.15);"><span style="width:6px; height:6px; border-radius:9999px; background:currentColor;"></span>${trackName}</div><div style="background-color:${trackColor.bg}; border:1.5px solid ${trackColor.border}; border-left:5px solid ${trackColor.hex}; border-radius:10px; padding:16px; color:#2D3737; box-shadow:0 2px 8px rgba(0,0,0,0.04); font-size:0.95em; line-height:1.6;">${evt.text?.text || ""}</div>`,
        },
        trackColorHex: trackColor.hex,
        trackTitle: trackName,
        sourceRecordId: rec.id,
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
  const combinedTitle = records.map((r) => r.title || r.topic).join(" vs. ");

  const data: TimelineData = {
    title: {
      background: {
        color: "#252F2F",
      },
      text: {
        headline: `Comparison: ${combinedTitle}`,
        text:
          viewMode === "parallel"
            ? `Parallel timeline comparison across ${records.length} distinct historical tracks (${combinedEvents.length} total milestones). Events are organized into parallel horizontal swimlanes color-coded by topic.`
            : `Unified timeline comparison across ${records.length} historical tracks (${combinedEvents.length} total milestones). All events share a single chronological line, with card background colors distinguishing each track.`,
      },
    },
    events: combinedEvents as TimelineSlide[],
  };

  const record: CachedTimelineRecord = {
    id: `compare-${records.map((r) => r.id).join("-")}`,
    topic: combinedTitle,
    title: `Comparison: ${combinedTitle}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    provider: "gemini",
    model: `${viewMode} comparison (${records.length} tracks)`,
    eventsCount: combinedEvents.length,
    dateRange: { startYear: minYear, endYear: maxYear },
    timelineData: data,
    isMerged: true,
    sourceRecordIds: records.map((r) => r.id),
  };

  return { data, record, tracks };
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

  // Reactive Compare mode state
  isCompareMode: false,
  selectedHistoryIds: [],
  comparisonTracks: [],
  comparisonViewMode: "parallel",

  setTimeline: (data, record) => {
    set({
      currentTimeline: data,
      currentRecord: record || null,
      error: null,
      comparisonTracks: [],
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

  toggleCompareMode: (enabled) => {
    const next = enabled !== undefined ? enabled : !get().isCompareMode;
    const currentRec = get().currentRecord;
    
    // Auto-select currently viewed timeline if entering compare mode
    const initialSelected = next && currentRec && !currentRec.isMerged ? [currentRec.id] : [];
    
    set({
      isCompareMode: next,
      selectedHistoryIds: initialSelected,
    });

    if (next) {
      get().applyComparison(initialSelected);
    } else if (currentRec?.isMerged) {
      // Revert to first source or clear
      const firstSource = get().history.find((h) => currentRec.sourceRecordIds?.includes(h.id));
      if (firstSource) {
        set({ currentTimeline: firstSource.timelineData, currentRecord: firstSource, comparisonTracks: [] });
      }
    }
  },

  toggleSelectHistoryId: (id) => {
    const current = get().selectedHistoryIds;
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    
    set({ selectedHistoryIds: next });
    get().applyComparison(next);
  },

  selectAllHistory: () => {
    const allIds = get().history.map((h) => h.id);
    set({ selectedHistoryIds: allIds });
    get().applyComparison(allIds);
  },

  clearSelectedHistory: () => {
    set({ selectedHistoryIds: [] });
    get().applyComparison([]);
  },

  setComparisonViewMode: (mode) => {
    set({ comparisonViewMode: mode });
    const selected = get().selectedHistoryIds;
    if (selected.length >= 2) {
      get().applyComparison(selected, mode);
    }
  },

  applyComparison: (selectedIds, viewMode) => {
    const mode = viewMode || get().comparisonViewMode;
    if (selectedIds.length === 0) {
      set({
        currentTimeline: null,
        currentRecord: null,
        comparisonTracks: [],
      });
      return;
    }

    if (selectedIds.length === 1) {
      const single = get().history.find((h) => h.id === selectedIds[0]);
      if (single) {
        set({
          currentTimeline: single.timelineData,
          currentRecord: single,
          comparisonTracks: [
            {
              id: single.id,
              title: single.title || single.topic,
              color: TRACK_PALETTE[0],
              eventsCount: single.eventsCount,
            },
          ],
        });
      }
      return;
    }

    // 2 or more timelines selected: Instant reactive comparison!
    const records = get().history.filter((h) => selectedIds.includes(h.id));
    if (records.length >= 2) {
      const { data, record, tracks } = buildComparisonTimeline(records, mode);
      set({
        currentTimeline: data,
        currentRecord: record,
        comparisonTracks: tracks,
      });
    }
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
        isCompareMode: false,
        selectedHistoryIds: [],
        comparisonTracks: [],
        error: null,
      });
    }
  },

  deleteTimelineFromHistory: async (id: string) => {
    await StorageService.deleteTimeline(id);
    const updated = get().history.filter((item) => item.id !== id);
    const isCurrent = get().currentRecord?.id === id;
    const remainingSelected = get().selectedHistoryIds.filter((i) => i !== id);

    set({
      history: updated,
      currentTimeline: isCurrent ? null : get().currentTimeline,
      currentRecord: isCurrent ? null : get().currentRecord,
      selectedHistoryIds: remainingSelected,
    });

    if (get().isCompareMode) {
      get().applyComparison(remainingSelected);
    }
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
      isCompareMode: false,
      selectedHistoryIds: [],
      comparisonTracks: [],
    });
  },
}));
