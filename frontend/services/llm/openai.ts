import { TimelineData } from "@/types/timeline";
import { GenerateTimelineOptions, LLMProvider } from "./types";

export const OpenAiProvider: LLMProvider = {
  id: "openai",
  name: "OpenAI",
  defaultModel: "gpt-4o-mini",
  availableModels: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],

  isConfigured(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.trim().startsWith("sk-") && apiKey.trim().length > 20);
  },

  async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured(apiKey)) {
      return { success: false, message: "Please provide a valid OpenAI API key starting with 'sk-'." };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        return { success: false, message: `OpenAI Error: ${errMsg}` };
      }

      return { success: true, message: "Successfully connected to OpenAI API!" };
    } catch (error: any) {
      return { success: false, message: `Network error: ${error.message || "Failed to reach OpenAI"}` };
    }
  },

  async generateTimeline(apiKey: string, options: GenerateTimelineOptions): Promise<TimelineData> {
    if (!this.isConfigured(apiKey)) {
      throw new Error("OpenAI API Key is required. Please set it in Settings.");
    }

    const model = options.model || this.defaultModel;
    const numEvents = options.numEvents || 12;

    const systemPrompt = `You are a historical data visualizer that outputs strictly JSON.
Output a JSON object with this exact structure:
{
  "title": {
    "text": {
      "headline": "Title of the Timeline",
      "text": "Introductory summary paragraph"
    }
  },
  "events": [
    {
      "start_date": { "year": 1969, "month": 7, "day": 20 },
      "end_date": { "year": 1969, "month": 7, "day": 24 },
      "text": {
        "headline": "Event headline",
        "text": "Event detailed description"
      },
      "media": {
        "url": "",
        "caption": ""
      }
    }
  ]
}`;

    const userPrompt = `Generate a timeline of ${numEvents} chronological historical events for topic: "${options.topic}".`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`OpenAI Error: ${errMsg}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response returned from OpenAI.");
    }

    const parsed = JSON.parse(content) as TimelineData;
    if (!parsed.events || !Array.isArray(parsed.events)) {
      throw new Error("Invalid timeline events array received from OpenAI.");
    }

    return {
      title: {
        text: {
          headline: parsed.title?.text?.headline || options.topic,
          text: parsed.title?.text?.text || `Chronological timeline for ${options.topic}`,
        },
      },
      events: parsed.events.map((evt: any, idx: number) => ({
        unique_id: evt.unique_id || `evt-${idx + 1}`,
        start_date: {
          year: Number(evt.start_date?.year),
          month: evt.start_date?.month ? Number(evt.start_date.month) : undefined,
          day: evt.start_date?.day ? Number(evt.start_date.day) : undefined,
        },
        end_date: evt.end_date?.year
          ? {
              year: Number(evt.end_date.year),
              month: evt.end_date?.month ? Number(evt.end_date.month) : undefined,
              day: evt.end_date?.day ? Number(evt.end_date.day) : undefined,
            }
          : undefined,
        text: {
          headline: evt.text?.headline || `Event ${idx + 1}`,
          text: evt.text?.text || "",
        },
        media: evt.media?.url ? evt.media : undefined,
      })),
    };
  },
};
