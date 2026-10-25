"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Settings, Sparkles, PanelLeftClose, PanelLeft, Github, Upload } from "lucide-react";
import { useTimelineStore } from "@/store/zustand";
import { SettingsService } from "@/services/settings";
import { StorageService } from "@/services/storage";
import { CachedTimelineRecord, TimelineData } from "@/types/timeline";
import { v4 as uuidv4 } from "uuid";

export const TopNav: React.FC = () => {
  const { toggleSidebar, sidebarOpen, setSettingsOpen, loadHistory, setTimeline } = useTimelineStore();
  const [providerInfo, setProviderInfo] = useState({ provider: "gemini", model: "gemini-flash-lite-latest" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = SettingsService.getSettings();
    setProviderInfo({
      provider: s.activeProvider,
      model: s.activeProvider === "gemini" ? s.geminiModel : s.openaiModel,
    });
  }, []);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed?.timelines) || Array.isArray(parsed)) {
        await StorageService.importFromJson(text);
        await loadHistory();
      } else if (parsed?.events && Array.isArray(parsed.events)) {
        const topic = parsed.title?.text?.headline || file.name.replace(/\.[^/.]+$/, "");
        const years = parsed.events
          .map((evt: any) => evt.start_date?.year)
          .filter((y: any): y is number => typeof y === "number" && !isNaN(y));
        const minYear = years.length ? Math.min(...years) : 0;
        const maxYear = years.length ? Math.max(...years) : 0;

        const newRecord: CachedTimelineRecord = {
          id: uuidv4(),
          topic,
          title: topic,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          provider: "gemini",
          model: "imported",
          eventsCount: parsed.events.length,
          dateRange: { startYear: minYear, endYear: maxYear },
          timelineData: parsed as TimelineData,
          isFavorite: false,
        };

        await StorageService.saveTimeline(newRecord);
        await loadHistory();
        setTimeline(parsed as TimelineData, newRecord);
      }
    } catch (err) {
      console.error("TopNav import error:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-brand-900/95 backdrop-blur-md border-b border-brand-800 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Left: Sidebar toggle, Logo Image & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-brand-300 hover:text-white hover:bg-brand-800 transition-colors"
          title={sidebarOpen ? "Collapse history sidebar" : "Open history sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-copper-300" />
          ) : (
            <PanelLeft className="w-5 h-5 text-brand-300" />
          )}
        </button>

        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTimeline(null)}>
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-copper-400/40 shadow-sm shadow-copper-500/10 flex-shrink-0 bg-brand-950">
            <Image
              src="./logo.jpeg"
              alt="ChronoCraft Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight leading-tight">
                ChronoCraft
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-copper-400/20 text-copper-300 border border-copper-400/30">
                Static
              </span>
            </div>
            <span className="text-[11px] text-brand-300 hidden sm:inline leading-none">
              AI Chronological Visualization
            </span>
          </div>
        </div>
      </div>

      {/* Right: Import button, Provider tag, Settings modal & GitHub */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-copper-200 text-xs font-medium border border-brand-700/80 transition-colors"
          title="Import a timeline (.json) file"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>

        {/* Active Provider Tag */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-800 hover:bg-brand-700 text-brand-200 text-xs font-medium border border-brand-700 transition-colors"
          title="Click to configure API keys"
        >
          <Sparkles className="w-3.5 h-3.5 text-copper-300" />
          <span className="capitalize">{providerInfo.provider}</span>
          <span className="text-brand-400 text-[10px]">({providerInfo.model})</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-xl text-brand-300 hover:text-white hover:bg-brand-800 transition-colors relative"
          title="API Keys & Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/mamin-mojtahed/ChronoCraft"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl text-brand-300 hover:text-white hover:bg-brand-800 transition-colors"
          title="View on GitHub"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
};
