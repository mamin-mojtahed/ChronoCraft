import { TimelineData } from "@/types/timeline";
import { LLMProviderId } from "@/services/settings";

export interface GenerateTimelineOptions {
  topic: string;
  numEvents?: number;
  model?: string;
}

export interface LLMProvider {
  id: LLMProviderId;
  name: string;
  defaultModel: string;
  availableModels: string[];
  isConfigured(apiKey: string): boolean;
  testConnection(apiKey: string): Promise<{ success: boolean; message: string }>;
  generateTimeline(apiKey: string, options: GenerateTimelineOptions): Promise<TimelineData>;
}
