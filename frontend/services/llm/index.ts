import { LLMProviderId, SettingsService } from "@/services/settings";
import { GeminiProvider } from "./gemini";
import { OpenAiProvider } from "./openai";
import { GenerateTimelineOptions, LLMProvider } from "./types";
import { TimelineData } from "@/types/timeline";

export const providers: Record<LLMProviderId, LLMProvider> = {
  gemini: GeminiProvider,
  openai: OpenAiProvider,
};

export const LLMService = {
  getProvider(providerId?: LLMProviderId): LLMProvider {
    const id = providerId || SettingsService.getSettings().activeProvider;
    return providers[id] || GeminiProvider;
  },

  async testConnection(providerId: LLMProviderId, apiKey: string): Promise<{ success: boolean; message: string }> {
    const provider = providers[providerId];
    if (!provider) {
      return { success: false, message: `Unknown provider: ${providerId}` };
    }
    return provider.testConnection(apiKey);
  },

  async generateTimeline(options: GenerateTimelineOptions): Promise<{ data: TimelineData; provider: LLMProviderId; model: string }> {
    const settings = SettingsService.getSettings();
    const providerId = settings.activeProvider;
    const provider = this.getProvider(providerId);
    const model = providerId === "gemini" ? settings.geminiModel : settings.openaiModel;
    const clientApiKey = providerId === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;

    // 1. Try serverless API route first (supports secret server-side API keys on Vercel)
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (settings.geminiApiKey) headers["x-gemini-api-key"] = settings.geminiApiKey;
      if (settings.openaiApiKey) headers["x-openai-api-key"] = settings.openaiApiKey;

      const res = await fetch(`${basePath}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic: options.topic,
          numEvents: options.numEvents,
          dateRange: options.dateRange,
          provider: providerId,
          model,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        return {
          data: result.data,
          provider: result.provider || providerId,
          model: result.model || model,
        };
      } else if (res.status !== 404) {
        // If server responded with a non-404 error (e.g. quota, bad key, invalid prompt), extract server error message
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) {
          throw new Error(errJson.error);
        }
      }
    } catch (err: any) {
      // If error is an explicit message from the server route, rethrow
      if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
      // If network error / 404 (e.g. static GitHub Pages export), fallback to client-side call below
    }

    // 2. Fallback to direct client-side provider call (for GitHub Pages static export or offline)
    if (!provider.isConfigured(clientApiKey)) {
      throw new Error(
        `API key not configured for ${provider.name}. Please open Settings (gear icon) in the top bar to enter your API key, or configure GEMINI_API_KEY in your Vercel deployment.`
      );
    }

    const data = await provider.generateTimeline(clientApiKey, {
      ...options,
      model,
    });

    return {
      data,
      provider: providerId,
      model,
    };
  },
};
