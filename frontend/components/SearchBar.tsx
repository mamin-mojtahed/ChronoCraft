"use client";

import React, { useState } from "react";
import { Search, Loader2, Sparkles, SlidersHorizontal } from "lucide-react";
import { useTimelineStore } from "@/store/zustand";
import { LLMService } from "@/services/llm";
import { StorageService } from "@/services/storage";
import { SettingsService } from "@/services/settings";
import { CachedTimelineRecord } from "@/types/timeline";
import { v4 as uuidv4 } from "uuid";

const PLACEHOLDER_TOPICS = [
  "History of Spacecraft & Lunar Exploration",
  "The Scientific Revolution (1543-1687)",
  "Evolution of Artificial Intelligence",
  "History of Renaissance Art & Masterpieces",
  "The Silk Road: Trade & Cultural Exchange",
  "History of Ancient Roman Architecture",
  "History of Computing from Babbage to Quantum",
  "The Industrial Revolution & Steam Power",
];

export const SearchBar: React.FC = () => {
  const [numEvents, setNumEvents] = useState(12);
  const [showOptions, setShowOptions] = useState(false);
  const {
    searchQuery,
    setSearchQuery,
    loading,
    setLoading,
    setTimeline,
    setError,
    loadHistory,
    setSettingsOpen,
  } = useTimelineStore();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed || loading) return;

    const settings = SettingsService.getSettings();
    const provider = settings.activeProvider;
    const key = provider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;

    if (!key) {
      setSettingsOpen(true);
      setError(`Please set your ${provider === "gemini" ? "Google Gemini" : "OpenAI"} API key to start generating timelines.`);
      return;
    }

    try {
      setLoading(true, `Querying ${provider === "gemini" ? "Google Gemini" : "OpenAI"} for "${trimmed}"...`);
      
      const result = await LLMService.generateTimeline({
        topic: trimmed,
        numEvents,
      });

      const years = result.data.events
        .map((evt) => evt.start_date?.year)
        .filter((y): y is number => typeof y === "number" && !isNaN(y));
      const minYear = years.length ? Math.min(...years) : 0;
      const maxYear = years.length ? Math.max(...years) : 0;

      const recordId = uuidv4();
      const recordTitle = result.data.title?.text?.headline || trimmed;

      const newRecord: CachedTimelineRecord = {
        id: recordId,
        topic: trimmed,
        title: recordTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        provider: result.provider,
        model: result.model,
        eventsCount: result.data.events.length,
        dateRange: {
          startYear: minYear,
          endYear: maxYear,
        },
        timelineData: result.data,
        isFavorite: false,
      };

      await StorageService.saveTimeline(newRecord);
      setTimeline(result.data, newRecord);
      await loadHistory();
      setSearchQuery("");
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to generate timeline. Please check your API key and connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 z-20">
      <form onSubmit={handleSearch} className="relative flex flex-col gap-2">
        <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-brand-950/5 border border-brand-200/80 p-2 transition-all focus-within:ring-2 focus-within:ring-copper-400 focus-within:border-copper-400">
          <div className="pl-3 pr-2 text-brand-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            id="timeline-research-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            placeholder={
              PLACEHOLDER_TOPICS[Math.floor(Math.random() * PLACEHOLDER_TOPICS.length)]
            }
            className="flex-1 bg-transparent border-none outline-none text-brand-950 placeholder-brand-300 text-sm sm:text-base px-1 py-1"
          />

          <div className="flex items-center gap-1.5 pr-1">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors ${
                showOptions
                  ? "bg-copper-100 text-copper-800"
                  : "text-brand-500 hover:text-brand-900 hover:bg-brand-50"
              }`}
              title="Toggle timeline generation options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl bg-copper-400 hover:bg-copper-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-brand-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm shadow-copper-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-950" />
                  <span className="hidden sm:inline">Crafting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-900" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Options drawer */}
        {showOptions && (
          <div className="p-3 bg-white rounded-xl border border-brand-200 shadow-lg text-xs text-brand-700 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-900">Events count:</span>
              <div className="flex items-center gap-1">
                {[6, 10, 12, 16, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumEvents(count)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      numEvents === count
                        ? "bg-copper-400 text-brand-950 font-bold shadow-sm"
                        : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-brand-400 hidden sm:inline">
              More events provide deeper chronological granularity
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
