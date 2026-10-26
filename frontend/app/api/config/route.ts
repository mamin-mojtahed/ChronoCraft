import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasServerGeminiKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) ||
    (process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY.trim().length > 10)
  );

  const hasServerOpenAiKey = Boolean(
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 20) ||
    (process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY.trim().length > 20)
  );

  const defaultProvider = (process.env.DEFAULT_PROVIDER || process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || "gemini") as "gemini" | "openai";
  const defaultGeminiModel = process.env.GEMINI_MODEL || process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-flash-lite-latest";
  const defaultOpenAiModel = process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini";

  return NextResponse.json({
    hasServerGeminiKey,
    hasServerOpenAiKey,
    defaultProvider,
    defaultGeminiModel,
    defaultOpenAiModel,
  });
}
