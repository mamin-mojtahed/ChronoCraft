import { create } from "zustand";
import { CachedTimelineRecord, TimelineData } from "@/types/timeline";
import { StorageService } from "@/services/storage";
import { SettingsService } from "@/services/settings";

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

  // Actions
  setTimeline: (data: TimelineData | null, record?: CachedTimelineRecord) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  // History & Cache management
  loadHistory: () => Promise<void>;
  selectTimelineFromHistory: (id: string) => Promise<void>;
  deleteTimelineFromHistory: (id: string) => Promise<void>;
  toggleFavoriteTimeline: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
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

  setTimeline: (data, record) => {
    set({
      currentTimeline: data,
      currentRecord: record || null,
      error: null,
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
    set({ history: [], currentTimeline: null, currentRecord: null });
  },
}));
