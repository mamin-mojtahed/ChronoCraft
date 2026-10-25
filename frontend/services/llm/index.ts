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

    const apiKey = providerId === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;
    if (!provider.isConfigured(apiKey)) {
      throw new Error(
        `API key not configured for ${provider.name}. Please open Settings (gear icon) in the top bar to enter your API key.`
      );
    }

    const model = providerId === "gemini" ? settings.geminiModel : settings.openaiModel;
    const data = await provider.generateTimeline(apiKey, {
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
