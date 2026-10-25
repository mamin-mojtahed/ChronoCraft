"use client";

import React, { useEffect, useRef, useState } from "react";
import { TimelineData } from "@/types/timeline";
import {
  Download,
  FileJson,
  Star,
  Sparkles,
  ListFilter,
  Maximize2,
  Minimize2,
  Split,
  Combine,
  Save,
  GitMerge,
} from "lucide-react";
import { useTimelineStore } from "@/store/zustand";
import { StorageService } from "@/services/storage";

interface TimelineViewerProps {
  data: TimelineData;
  title?: string;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ data, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showOutline, setShowOutline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedMerged, setSavedMerged] = useState(false);

  const {
    currentRecord,
    toggleFavoriteTimeline,
    mergedSources,
    mergeMode,
    setMergeMode,
    loadHistory,
  } = useTimelineStore();

  const isMergedTimeline = Boolean(currentRecord?.isMerged || mergedSources.length >= 2);

  // Load Knight Lab TimelineJS stylesheet and script dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cssId = "timelinejs-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdn.knightlab.com/libs/timeline3/latest/css/timeline.css";
      document.head.appendChild(link);
    }

    if ((window as any).TL?.Timeline) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = "timelinejs-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.knightlab.com/libs/timeline3/latest/js/timeline.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", () => setScriptLoaded(true));
    }
  }, []);

  // Initialize or re-render TimelineJS with ample room for event content
  useEffect(() => {
    if (!scriptLoaded || !data || !(window as any).TL?.Timeline) return;

    const embedId = `timeline-embed-${renderKey}`;
    const container = containerRef.current;
    if (!container) return;

    // Clear previous DOM contents
    container.innerHTML = `<div id="${embedId}" style="width: 100%; height: 100%;"></div>`;

    try {
      // Knight Lab options
      const options = {
        hash_bookmark: false,
        initial_zoom: 1,
        timenav_position: "bottom",
        timenav_height_percentage: isMergedTimeline && mergeMode === "parallel" ? 36 : 28,
        timenav_mobile_height_percentage: 38,
        scale_factor: 1,
        duration: 500,
        slide_padding_lr: 30,
        debug: false,
        is_embed: true,
      };

      new (window as any).TL.Timeline(embedId, data, options);
    } catch (err) {
      console.error("TimelineJS render error:", err);
    }
  }, [scriptLoaded, data, renderKey, isMergedTimeline, mergeMode]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setRenderKey((prev) => prev + 1);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "timeline").toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintOrScreenshot = () => {
    window.print();
  };

  const handleSaveMergedToHistory = async () => {
    if (currentRecord && isMergedTimeline) {
      await StorageService.saveTimeline(currentRecord);
      await loadHistory();
      setSavedMerged(true);
      setTimeout(() => setSavedMerged(false), 2500);
    }
  };

  return (
    <div
      className={`flex flex-col w-full bg-white relative transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 h-screen" : "flex-1"
      }`}
    >
      {/* Timeline Action Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-brand-100 bg-brand-50/90 backdrop-blur-sm z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-copper-100 text-copper-700">
            {isMergedTimeline ? (
              <GitMerge className="w-4 h-4 text-copper-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-copper-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-brand-900 text-sm sm:text-base leading-tight">
                {title || data.title?.text?.headline || "Interactive Timeline"}
              </h2>
              {isMergedTimeline && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-copper-200 text-copper-900 border border-copper-300">
                  Merged Comparison
                </span>
              )}
            </div>
            <p className="text-xs text-brand-600">
              {data.events?.length || 0} chronological milestones
              {currentRecord?.provider && (
                <span className="ml-2 uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-copper-200/60 text-copper-800 font-semibold">
                  {currentRecord.provider}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Parallel Swimlanes vs Same Timeline Toggle (Only when merged) */}
          {isMergedTimeline && (
            <div className="flex items-center bg-white rounded-xl border border-brand-200 p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setMergeMode("parallel")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  mergeMode === "parallel"
                    ? "bg-copper-400 text-brand-950 font-bold shadow-xs"
                    : "text-brand-600 hover:text-brand-900"
                }`}
                title="Parallel Swimlanes (entries organized on stacked horizontal lines)"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Parallel Lines</span>
              </button>

              <button
                type="button"
                onClick={() => setMergeMode("unified")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  mergeMode === "unified"
                    ? "bg-copper-400 text-brand-950 font-bold shadow-xs"
                    : "text-brand-600 hover:text-brand-900"
                }`}
                title="Unified Timeline (all milestones merged into the same single track)"
              >
                <Combine className="w-3.5 h-3.5" />
                <span>Same Timeline</span>
              </button>
            </div>
          )}

          {/* Save Merged Timeline Button */}
          {isMergedTimeline && (
            <button
              onClick={handleSaveMergedToHistory}
              disabled={savedMerged}
              className="p-2 rounded-lg bg-white border border-brand-200 text-xs font-medium text-brand-700 hover:bg-brand-100/60 flex items-center gap-1.5 transition-colors"
              title="Save this merged comparison into History"
            >
              <Save className="w-3.5 h-3.5 text-copper-600" />
              <span className="hidden sm:inline">{savedMerged ? "Saved!" : "Save Merge"}</span>
            </button>
          )}

          {/* Outline / All events drawer toggle */}
          <button
            onClick={() => setShowOutline(!showOutline)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showOutline
                ? "bg-copper-300 text-brand-950 border-copper-400 font-semibold"
                : "bg-white border-brand-200 text-brand-700 hover:bg-brand-100/60"
            }`}
            title="View full event list outline"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Event List</span>
          </button>

          {currentRecord && !isMergedTimeline && (
            <button
              onClick={() => toggleFavoriteTimeline(currentRecord.id)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                currentRecord.isFavorite
                  ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                  : "bg-white border-brand-200 text-brand-700 hover:bg-brand-100/60"
              }`}
              title={currentRecord.isFavorite ? "Favorited" : "Favorite this timeline"}
            >
              <Star
                className={`w-3.5 h-3.5 ${currentRecord.isFavorite ? "fill-amber-500 text-amber-500" : ""}`}
              />
              <span className="hidden sm:inline">
                {currentRecord.isFavorite ? "Favorited" : "Star"}
              </span>
            </button>
          )}

          <button
            onClick={handleExportJson}
            className="p-2 rounded-lg bg-white border border-brand-200 text-xs font-medium text-brand-700 hover:bg-brand-100/60 flex items-center gap-1.5 transition-colors"
            title="Download JSON export"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={handlePrintOrScreenshot}
            className="p-2 rounded-lg bg-brand-800 text-white text-xs font-medium hover:bg-brand-900 flex items-center gap-1.5 transition-colors"
            title="Print or export as PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-white border border-brand-200 text-brand-700 hover:bg-brand-100/60 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen view"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Timeline & Optional Outline Drawer */}
      <div className="flex-1 w-full relative flex overflow-hidden">
        {/* Knight Lab Timeline Container */}
        <div
          className="flex-1 w-full relative"
          style={{
            height: isFullscreen ? "calc(100vh - 54px)" : "calc(100vh - 165px)",
            minHeight: "560px",
          }}
        >
          {!scriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-50/50">
              <div className="flex flex-col items-center gap-2 text-brand-600 text-sm">
                <div className="w-6 h-6 border-2 border-copper-400 border-t-transparent rounded-full animate-spin" />
                <span>Initializing Knight Lab Timeline Engine...</span>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Event List Outline Panel */}
        {showOutline && (
          <aside className="w-80 sm:w-96 border-l border-brand-200 bg-white overflow-y-auto p-4 space-y-4 shadow-xl z-20 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-brand-100 pb-2">
              <h3 className="font-bold text-sm text-brand-900">All Timeline Events</h3>
              <span className="text-xs text-brand-500 font-mono">{data.events.length} events</span>
            </div>

            <div className="space-y-3">
              {data.events.map((evt, idx) => {
                const yearStr = evt.start_date?.year;
                const dateStr = [
                  yearStr,
                  evt.start_date?.month ? `/${evt.start_date.month}` : "",
                  evt.start_date?.day ? `/${evt.start_date.day}` : "",
                ].join("");

                return (
                  <div
                    key={evt.unique_id || idx}
                    className="p-3 rounded-xl border border-brand-100 bg-brand-50/40 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-copper-700 bg-copper-100/80 px-2 py-0.5 rounded">
                        {dateStr}
                      </span>
                      {evt.group && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-200 text-brand-900">
                          {evt.group}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-xs text-brand-950 mb-1">
                      {evt.text?.headline}
                    </h4>
                    <p className="text-xs text-brand-700 leading-relaxed">
                      {evt.text?.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
