import { TimelineData } from "@/types/timeline";
import { GenerateTimelineOptions, LLMProvider } from "./types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Ordered fallback chain of high-speed, ultra-cheap Flash-Lite models
export const FLASH_LITE_FALLBACK_CHAIN = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
];

const TIMELINE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: {
      type: "OBJECT",
      properties: {
        headline: { type: "STRING" },
        text: { type: "STRING" },
      },
      required: ["headline", "text"],
    },
    events: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          start_date: {
            type: "OBJECT",
            properties: {
              year: { type: "INTEGER" },
              month: { type: "INTEGER" },
              day: { type: "INTEGER" },
            },
            required: ["year"],
          },
          end_date: {
            type: "OBJECT",
            properties: {
              year: { type: "INTEGER" },
              month: { type: "INTEGER" },
              day: { type: "INTEGER" },
            },
          },
          text: {
            type: "OBJECT",
            properties: {
              headline: { type: "STRING" },
              text: { type: "STRING" },
            },
            required: ["headline", "text"],
          },
          media: {
            type: "OBJECT",
            properties: {
              url: { type: "STRING" },
              caption: { type: "STRING" },
              credit: { type: "STRING" },
            },
          },
        },
        required: ["start_date", "text"],
      },
    },
  },
  required: ["title", "events"],
};

export const GeminiProvider: LLMProvider = {
  id: "gemini",
  name: "Google Gemini",
  defaultModel: "gemini-flash-lite-latest",
  availableModels: [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
  ],

  isConfigured(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.trim().length > 10);
  },

  async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured(apiKey)) {
      return { success: false, message: "Please provide a valid Google Gemini API key." };
    }

    let lastError = "";
    // Test through the Flash-Lite chain until one responds
    for (const model of FLASH_LITE_FALLBACK_CHAIN) {
      try {
        const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
          }),
        });

        if (response.ok) {
          return { success: true, message: `Successfully connected using Flash-Lite model (${model})!` };
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        }
      } catch (err: any) {
        lastError = err.message || "Network error";
      }
    }

    return { success: false, message: `Gemini API Error: ${lastError}` };
  },

  async generateTimeline(apiKey: string, options: GenerateTimelineOptions): Promise<TimelineData> {
    if (!this.isConfigured(apiKey)) {
      throw new Error("Google Gemini API Key is required. Please set it in Settings.");
    }

    const requestedModel = options.model || this.defaultModel;
    // Build priority list: start with requested model, followed by the rest of the Flash-Lite chain
    const modelsToTry = [
      requestedModel,
      ...FLASH_LITE_FALLBACK_CHAIN.filter((m) => m !== requestedModel),
    ];

    const numEvents = options.numEvents || 12;
    const prompt = `You are an expert historian and educational data visualizer.
Generate a comprehensive, engaging chronological timeline for the topic: "${options.topic}".
Create exactly ${numEvents} key historical milestones or events in chronological order.
Ensure accurate start years (and months/days when known). Write clear, fascinating headlines and informative summaries.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TIMELINE_SCHEMA,
        temperature: 0.4,
      },
    };

    let lastError: Error | null = null;

    // Execute fallback loop through Flash-Lite models
    for (const model of modelsToTry) {
      try {
        const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`[Gemini Fallback] Model '${model}' failed: ${errMsg}. Trying next Flash-Lite model...`);
          lastError = new Error(`Model ${model}: ${errMsg}`);
          continue; // Try next Flash-Lite model in the chain
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
          throw new Error(`Empty response generated by ${model}.`);
        }

        const jsonText = candidate.content.parts[0].text;
        const parsedData = JSON.parse(jsonText) as TimelineData;

        if (!parsedData.events || !Array.isArray(parsedData.events)) {
          throw new Error("Invalid timeline events array received.");
        }

        const titleHeadline = parsedData.title?.text?.headline || (parsedData.title as any)?.headline || options.topic;
        const titleText =
          parsedData.title?.text?.text ||
          (typeof (parsedData.title as any)?.text === "string"
            ? (parsedData.title as any).text
            : `A chronological overview of ${options.topic}.`);

        // Successful generation with active working model!
        return {
          title: {
            text: {
              headline: titleHeadline,
              text: titleText,
            },
          },
          events: parsedData.events.map((evt: any, index: number) => ({
            unique_id: evt.unique_id || `evt-${index + 1}`,
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
              headline: evt.text?.headline || `Event ${index + 1}`,
              text: evt.text?.text || "",
            },
            media: evt.media?.url
              ? {
                  url: evt.media.url,
                  caption: evt.media.caption || "",
                  credit: evt.media.credit || "",
                }
              : undefined,
          })),
        };
      } catch (err: any) {
        console.warn(`[Gemini Fallback] Error with model '${model}': ${err.message}. Trying next Flash-Lite model...`);
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to generate timeline with all available Gemini Flash-Lite models.");
  },
};
