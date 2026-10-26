import { NextRequest, NextResponse } from "next/server";
import { GeminiProvider } from "@/services/llm/gemini";
import { OpenAiProvider } from "@/services/llm/openai";
import { LLMProviderId } from "@/services/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, numEvents, dateRange, provider: reqProvider, model: reqModel } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Missing or invalid topic" }, { status: 400 });
    }

    const providerId: LLMProviderId = (reqProvider || process.env.DEFAULT_PROVIDER || process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || "gemini") as LLMProviderId;

    // Check client override headers first, then fallback to secret server environment variables
    const clientGeminiKey = req.headers.get("x-gemini-api-key")?.trim() || "";
    const clientOpenAiKey = req.headers.get("x-openai-api-key")?.trim() || "";

    const serverGeminiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();
    const serverOpenAiKey = (process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || "").trim();

    let apiKey = "";
    let provider = GeminiProvider;

    if (providerId === "openai") {
      apiKey = clientOpenAiKey || serverOpenAiKey;
      provider = OpenAiProvider;
    } else {
      apiKey = clientGeminiKey || serverGeminiKey;
      provider = GeminiProvider;
    }

    if (!provider.isConfigured(apiKey)) {
      return NextResponse.json(
        {
          error: `API key not configured for ${provider.name}. Please enter your API key in Settings or configure ${providerId === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"} in your server environment.`,
        },
        { status: 401 }
      );
    }

    const effectiveModel = reqModel || provider.defaultModel;

    const data = await provider.generateTimeline(apiKey, {
      topic: topic.trim(),
      numEvents: Number(numEvents) || 12,
      dateRange,
      model: effectiveModel,
    });

    return NextResponse.json({
      data,
      provider: providerId,
      model: effectiveModel,
    });
  } catch (err: any) {
    console.error("Server API generate error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate timeline on server." },
      { status: 500 }
    );
  }
}
