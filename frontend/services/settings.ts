export type LLMProviderId = "gemini" | "openai";

export interface AppSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  activeProvider: LLMProviderId;
  geminiModel: string;
  openaiModel: string;
  sidebarOpen: boolean;
}

const STORAGE_KEYS = {
  GEMINI_API_KEY: "chronocraft_gemini_key",
  OPENAI_API_KEY: "chronocraft_openai_key",
  ACTIVE_PROVIDER: "chronocraft_active_provider",
  GEMINI_MODEL: "chronocraft_gemini_model",
  OPENAI_MODEL: "chronocraft_openai_model",
  SIDEBAR_OPEN: "chronocraft_sidebar_open",
};

const ENV_CONFIG = {
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  activeProvider: (process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as LLMProviderId) || "gemini",
  geminiModel: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-flash-lite-latest",
  openaiModel: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini",
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: ENV_CONFIG.geminiApiKey,
  openaiApiKey: ENV_CONFIG.openaiApiKey,
  activeProvider: ENV_CONFIG.activeProvider,
  geminiModel: ENV_CONFIG.geminiModel,
  openaiModel: ENV_CONFIG.openaiModel,
  sidebarOpen: true,
};

export const SettingsService = {
  getSettings(): AppSettings {
    if (typeof window === "undefined") {
      return DEFAULT_SETTINGS;
    }
    try {
      // Check localStorage first; if not set or empty, fallback to environment variable
      const storedGemini = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
      const geminiApiKey = (storedGemini && storedGemini.trim().length > 0) ? storedGemini : ENV_CONFIG.geminiApiKey;

      const storedOpenai = localStorage.getItem(STORAGE_KEYS.OPENAI_API_KEY);
      const openaiApiKey = (storedOpenai && storedOpenai.trim().length > 0) ? storedOpenai : ENV_CONFIG.openaiApiKey;

      const activeProvider =
        (localStorage.getItem(STORAGE_KEYS.ACTIVE_PROVIDER) as LLMProviderId) || ENV_CONFIG.activeProvider;
      let geminiModel = localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL) || ENV_CONFIG.geminiModel;
      if (geminiModel.includes("2.5") || geminiModel.includes("3.8") || !geminiModel) {
        geminiModel = "gemini-flash-lite-latest";
        localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, "gemini-flash-lite-latest");
      }
      const openaiModel = localStorage.getItem(STORAGE_KEYS.OPENAI_MODEL) || ENV_CONFIG.openaiModel;
      const sidebarStored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
      const sidebarOpen = sidebarStored !== null ? sidebarStored === "true" : DEFAULT_SETTINGS.sidebarOpen;

      return {
        geminiApiKey,
        openaiApiKey,
        activeProvider,
        geminiModel,
        openaiModel,
        sidebarOpen,
      };
    } catch (e) {
      console.warn("Failed to read settings from localStorage:", e);
      return DEFAULT_SETTINGS;
    }
  },

  setGeminiApiKey(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
  },

  setOpenAiApiKey(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.OPENAI_API_KEY, key.trim());
  },

  setActiveProvider(provider: LLMProviderId): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, provider);
  },

  setGeminiModel(model: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, model);
  },

  setSidebarOpen(open: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(open));
  },
};
