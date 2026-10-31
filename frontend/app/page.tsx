"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { TopNav } from "@/components/TopNav";
import { SearchBar } from "@/components/SearchBar";
import { HistorySidebar } from "@/components/HistorySidebar";
import { SettingsModal } from "@/components/SettingsModal";
import { EditTimelineModal } from "@/components/EditTimelineModal";
import { EditEventModal } from "@/components/EditEventModal";
import { TimelineViewer } from "@/components/TimelineViewer";
import { useTimelineStore } from "@/store/zustand";
import { Clock, AlertCircle, ArrowRight, BookOpen, Key } from "lucide-react";
import { SettingsService } from "@/services/settings";
import { StorageService } from "@/services/storage";

const HISTORICAL_QUOTES = [
  {
    quote: "History is not the past but a map of the past, drawn from a particular point of view, to be useful to the modern traveller.",
    author: "Henry Glassie",
  },
  {
    quote: "Study the past if you would define the future.",
    author: "Confucius",
  },
  {
    quote: "The more you know about the past, the better prepared you are for the future.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "History is a vast early warning system.",
    author: "Norman Cousins",
  },
];

const SUGGESTED_TOPICS = [
  "History of Spacecraft",
  "The Renaissance (1300-1600)",
  "Evolution of Artificial Intelligence",
  "Ancient Roman Architecture",
  "The Industrial Revolution",
  "History of Video Games",
];

export default function Home() {
  const {
    currentTimeline,
    currentRecord,
    loading,
    loadingMessage,
    error,
    setError,
    sidebarOpen,
    setSettingsOpen,
    setTimeline,
    loadHistory,
    setSearchQuery,
  } = useTimelineStore();

  const [quote, setQuote] = useState(HISTORICAL_QUOTES[0]);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const rand = HISTORICAL_QUOTES[Math.floor(Math.random() * HISTORICAL_QUOTES.length)];
    setQuote(rand);

    const s = SettingsService.getSettings();
    const activeKey = s.activeProvider === "gemini" ? s.geminiApiKey : s.openaiApiKey;
    if (activeKey && activeKey.trim().length > 0) {
      setHasApiKey(true);
    } else {
      SettingsService.fetchServerConfig().then((cfg) => {
        const hasServerKey = s.activeProvider === "gemini" ? cfg.hasServerGeminiKey : cfg.hasServerOpenAiKey;
        setHasApiKey(Boolean(hasServerKey));
      });
    }
  }, []);

  const handleLoadSampleTimeline = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const res = await fetch(`${basePath}/timeline.json`);
      if (!res.ok) throw new Error("Could not load sample timeline.json");
      const data = await res.json();
      
      const sampleRecord = {
        id: "sample-user-interface",
        topic: "Revolutionary User Interfaces",
        title: "Revolutionary User Interfaces",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        provider: "gemini" as const,
        model: "sample",
        eventsCount: data.events?.length || 0,
        dateRange: {
          startYear: 1600,
          endYear: 2012,
        },
        timelineData: data,
        isFavorite: true,
      };

      await StorageService.saveTimeline(sampleRecord);
      setTimeline(data, sampleRecord);
      await loadHistory();
    } catch (err: any) {
      console.error(err);
      setError("Failed to load sample timeline.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F4] flex flex-col font-sans text-brand-950">
      {/* Top Header */}
      <TopNav />

      {/* History Sidebar */}
      <HistorySidebar />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Timeline Editor Modal */}
      <EditTimelineModal />

      {/* Event Slide Editor Modal */}
      <EditEventModal />

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col pt-16 transition-all duration-300 w-full overflow-x-hidden ${
          sidebarOpen ? "sm:pl-80" : "pl-0"
        } ${currentTimeline && !error ? "overflow-y-hidden" : ""}`}
      >
        {/* Error Notification Banner */}
        {error && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Configure Key
              </button>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-900 px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* API Key Missing Notice */}
        {!hasApiKey && !currentTimeline && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-copper-50/80 border border-copper-200 text-brand-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-copper-600 flex-shrink-0" />
              <span>
                To generate custom timelines, please enter your free Google Gemini API key.
              </span>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs px-3 py-1 rounded-lg bg-copper-400 hover:bg-copper-500 text-brand-950 font-bold transition-colors whitespace-nowrap shadow-sm"
            >
              Add API Key
            </button>
          </div>
        )}

        {/* Dynamic Display State */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-copper-100 border border-copper-300/40 flex items-center justify-center text-copper-700 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <div className="absolute -inset-1 rounded-2xl border-2 border-copper-400/40 animate-ping opacity-25" />
            </div>
            <h3 className="text-lg font-bold text-brand-900 mb-2">
              Crafting Chronology...
            </h3>
            <p className="text-sm text-brand-600 max-w-sm mb-4">
              {loadingMessage || "Querying historical records and structuring timeline..."}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-copper-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-copper-400 animate-bounce" />
              <span>Synthesizing dates & milestones</span>
            </div>
          </div>
        ) : currentTimeline ? (
          <div className="flex-1 flex flex-col w-full h-full">
            <TimelineViewer data={currentTimeline} title={currentRecord?.title} />
          </div>
        ) : (
          /* Empty / Hero State */
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center max-w-3xl mx-auto">
            {/* Center Logo Emblem */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-copper-300 shadow-xl shadow-copper-500/10 mb-6 bg-brand-950 flex-shrink-0">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon.png`}
                alt="ChronoCraft"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                priority
              />
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-950 tracking-tight mb-4">
              Crafting Data into Stories, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-copper-500 via-copper-400 to-copper-600 bg-clip-text text-transparent">
                One Timeline at a Time
              </span>
            </h1>

            {/* Quote */}
            <p className="text-sm sm:text-base italic text-brand-700 max-w-xl mx-auto mb-8 font-serif leading-relaxed">
              &ldquo;{quote.quote}&rdquo;
              <span className="block not-italic text-xs text-brand-400 mt-1 font-sans font-medium">
                — {quote.author}
              </span>
            </p>

            {/* Search Input */}
            <div className="w-full mb-8">
              <SearchBar />
            </div>

            {/* Suggestion Chips */}
            <div className="w-full max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-3">
                Try:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSearchQuery(topic);
                      document.getElementById("timeline-research-input")?.focus();
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-copper-50 hover:text-copper-800 hover:border-copper-300 border border-brand-200 text-brand-800 transition-all shadow-sm"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Sample Timeline Demo Button */}
              <div className="mt-6 pt-6 border-t border-brand-200/60 flex items-center justify-center gap-2">
                <button
                  onClick={handleLoadSampleTimeline}
                  className="inline-flex items-center gap-2 text-xs text-brand-700 hover:text-brand-950 px-3.5 py-1.5 rounded-xl border border-brand-300 bg-white hover:bg-copper-50/60 transition-colors shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-copper-600" />
                  <span>Preview Demo Timeline (User Interfaces)</span>
                  <ArrowRight className="w-3 h-3 text-copper-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
