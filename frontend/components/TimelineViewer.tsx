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
  Save,
  Layers,
  Split,
  Combine,
} from "lucide-react";
import { useTimelineStore, getTimelineTrackColor } from "@/store/zustand";
import { StorageService } from "@/services/storage";

interface TimelineViewerProps {
  data: TimelineData;
  title?: string;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ data, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineInstanceRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showOutline, setShowOutline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedComparison, setSavedComparison] = useState(false);

  const {
    currentRecord,
    history,
    toggleFavoriteTimeline,
    comparisonTracks,
    comparisonViewMode,
    setComparisonViewMode,
    loadHistory,
  } = useTimelineStore();

  const isComparison = comparisonTracks.length >= 2 || Boolean(currentRecord?.isMerged);
  const currentTrackColor = getTimelineTrackColor(currentRecord, history);

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

  // Initialize or re-render TimelineJS with ample room for event content & parallel/merged views
  useEffect(() => {
    if (!scriptLoaded || !data || !(window as any).TL?.Timeline) return;

    const embedId = `timeline-embed-${renderKey}-${Date.now()}`;
    const container = containerRef.current;
    if (!container) return;

    // Clear previous DOM contents
    container.innerHTML = `<div id="${embedId}" style="width: 100%; height: 100%;"></div>`;

    try {
      // Dynamic timenav height: allocate more height if in parallel mode with 3+ tracks
      const isParallel = isComparison && comparisonViewMode === "parallel";
      const navHeight = isParallel
        ? comparisonTracks.length >= 4
          ? 44
          : comparisonTracks.length >= 3
          ? 40
          : 36
        : 28;

      const options = {
        hash_bookmark: false,
        initial_zoom: 1,
        timenav_position: "bottom",
        timenav_height_percentage: navHeight,
        timenav_mobile_height_percentage: 42,
        scale_factor: 1,
        duration: 450,
        slide_padding_lr: 30,
        debug: false,
        is_embed: true,
      };

      timelineInstanceRef.current = new (window as any).TL.Timeline(embedId, data, options);

      // Direct styling pass for swimlanes, navigation bar, and markers
      const applyMarkerColors = () => {
        try {
          if (isComparison) {
            // Style swimlane rows in parallel mode by matching each track by title
            const groups = container.querySelectorAll<HTMLElement>(".tl-timenav .tl-timegroup");
            groups.forEach((groupEl, idx) => {
              const msgEl = groupEl.querySelector<HTMLElement>(".tl-timegroup-message");
              const rawLabel = (msgEl?.textContent || groupEl.textContent || "")
                .trim()
                .toLowerCase();

              // Match track by title comparison rather than arbitrary DOM index
              const matchedTrack =
                comparisonTracks.find((t) => {
                  const tTitle = t.title.trim().toLowerCase();
                  return rawLabel.includes(tTitle) || tTitle.includes(rawLabel);
                }) || comparisonTracks[idx % comparisonTracks.length];

              if (matchedTrack) {
                groupEl.style.setProperty(
                  "background",
                  matchedTrack.color.swimlane || matchedTrack.color.navBg,
                  "important"
                );
                groupEl.style.setProperty("border-bottom", "5px solid #0D1212", "important");
                groupEl.style.setProperty(
                  "border-top",
                  `1px solid ${matchedTrack.color.hex}60`,
                  "important"
                );
                groupEl.style.setProperty(
                  "box-shadow",
                  "inset 0 1px 0 rgba(255,255,255,0.15)",
                  "important"
                );

                if (msgEl) {
                  msgEl.style.setProperty("text-shadow", "none", "important");
                  msgEl.style.setProperty("background", "rgba(10, 14, 14, 0.90)", "important");
                  msgEl.style.setProperty(
                    "border",
                    `1.5px solid ${matchedTrack.color.hex}`,
                    "important"
                  );
                  msgEl.style.setProperty(
                    "border-left",
                    `5px solid ${matchedTrack.color.hex}`,
                    "important"
                  );
                  msgEl.style.setProperty("color", "#FFFFFF", "important");
                  msgEl.style.setProperty("font-size", "11px", "important");
                  msgEl.style.setProperty("font-weight", "700", "important");
                  msgEl.style.setProperty("letter-spacing", "0.04em", "important");
                  msgEl.style.setProperty("padding", "5px 14px", "important");
                  msgEl.style.setProperty("border-radius", "8px", "important");
                  msgEl.style.setProperty("margin-left", "14px", "important");
                  msgEl.style.setProperty(
                    "box-shadow",
                    `0 4px 14px ${matchedTrack.color.hex}40`,
                    "important"
                  );
                }
              }
            });

            // Style markers and connector lines with timeline colors in comparison mode
            comparisonTracks.forEach((track, recIdx) => {
              const isLight = ["#DCA48E", "#DE9F35"].includes(track.color.hex);
              const markers = container.querySelectorAll<HTMLElement>(
                `.tl-timemarker[id*="track-${recIdx}-"]`
              );
              markers.forEach((marker) => {
                const box = marker.querySelector<HTMLElement>(".tl-timemarker-content-container");
                if (box) {
                  box.style.setProperty("background-color", track.color.hex, "important");
                  box.style.setProperty("border-radius", "6px", "important");
                  box.style.setProperty("border", `1px solid ${track.color.border}`, "important");
                  box.style.setProperty("box-shadow", "0 2px 6px rgba(0, 0, 0, 0.35)", "important");
                }
                const h2 = marker.querySelector<HTMLElement>(".tl-timemarker-text h2");
                if (h2) {
                  h2.style.setProperty("color", isLight ? "#1A2121" : "#FFFFFF", "important");
                  h2.style.setProperty("font-weight", "700", "important");
                }
                const line = marker.querySelector<HTMLElement>(".tl-timemarker-line");
                if (line) {
                  line.style.setProperty("background-color", track.color.hex, "important");
                }
              });
            });

            // Style bottom timenav container
            const timenav = container.querySelector<HTMLElement>(".tl-timenav");
            if (timenav) {
              timenav.style.setProperty("background", "#161D1D", "important");
              timenav.style.setProperty("border-top", "2px solid #364646", "important");
            }
          } else {
            // SINGLE TIMELINE MODE: Style timenav and markers with this timeline's identifying color shade!
            const timenav = container.querySelector<HTMLElement>(".tl-timenav");
            if (timenav) {
              timenav.style.setProperty("background", currentTrackColor.navBg, "important");
              timenav.style.setProperty(
                "border-top",
                `3px solid ${currentTrackColor.hex}`,
                "important"
              );
              timenav.style.setProperty(
                "box-shadow",
                `inset 0 1px 0 rgba(255,255,255,0.1), 0 -2px 10px rgba(0,0,0,0.2)`,
                "important"
              );
            }

            const isLight = ["#DCA48E", "#DE9F35"].includes(currentTrackColor.hex);
            const markers = container.querySelectorAll<HTMLElement>(".tl-timemarker");
            markers.forEach((marker) => {
              const box = marker.querySelector<HTMLElement>(".tl-timemarker-content-container");
              if (box) {
                box.style.setProperty("background-color", currentTrackColor.hex, "important");
                box.style.setProperty("border-radius", "6px", "important");
                box.style.setProperty(
                  "border",
                  `1px solid ${currentTrackColor.border}`,
                  "important"
                );
                box.style.setProperty("box-shadow", "0 2px 6px rgba(0, 0, 0, 0.35)", "important");
              }
              const h2 = marker.querySelector<HTMLElement>(".tl-timemarker-text h2");
              if (h2) {
                h2.style.setProperty("color", isLight ? "#1A2121" : "#FFFFFF", "important");
                h2.style.setProperty("font-weight", "700", "important");
              }
              const line = marker.querySelector<HTMLElement>(".tl-timemarker-line");
              if (line) {
                line.style.setProperty("background-color", currentTrackColor.hex, "important");
                line.style.setProperty("width", "2px", "important");
              }
            });

            // Title slide backdrop with identifying color tint
            const titleSlide = container.querySelector<HTMLElement>(".tl-slide.tl-slide-titleslide");
            if (titleSlide) {
              titleSlide.style.setProperty(
                "background",
                `linear-gradient(135deg, ${currentTrackColor.hex}30 0%, #1A2222 60%, #121818 100%)`,
                "important"
              );
            }
          }
        } catch {
          // Graceful fallback
        }
      };

      setTimeout(applyMarkerColors, 50);
      setTimeout(applyMarkerColors, 200);
      setTimeout(applyMarkerColors, 500);

      if (timelineInstanceRef.current?.on) {
        timelineInstanceRef.current.on("change", () => setTimeout(applyMarkerColors, 30));
        timelineInstanceRef.current.on("nav_move", () => setTimeout(applyMarkerColors, 30));
      }
    } catch (err) {
      console.error("TimelineJS render error:", err);
    }
  }, [
    scriptLoaded,
    data,
    renderKey,
    isComparison,
    comparisonViewMode,
    comparisonTracks,
    currentTrackColor,
  ]);

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

  const handleSaveComparisonToHistory = async () => {
    if (currentRecord && isComparison) {
      await StorageService.saveTimeline(currentRecord);
      await loadHistory();
      setSavedComparison(true);
      setTimeout(() => setSavedComparison(false), 2500);
    }
  };

  const handleJumpToTrack = (trackTitle: string) => {
    const index = (data.events as any[])?.findIndex(
      (e) => e.group === trackTitle || e.trackTitle === trackTitle
    );
    if (index !== -1 && index !== undefined && timelineInstanceRef.current?.goTo) {
      const slideIdx = data.title ? index + 1 : index;
      timelineInstanceRef.current.goTo(slideIdx);
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
            {isComparison ? (
              <Layers className="w-4 h-4 text-copper-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-copper-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-brand-900 text-sm sm:text-base leading-tight">
                {title || data.title?.text?.headline || "Interactive Timeline"}
              </h2>
              {isComparison ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-copper-200 text-copper-900 border border-copper-300">
                  {comparisonViewMode === "parallel" ? "Parallel Tracks" : "Merged Track"} (
                  {comparisonTracks.length} Tracks)
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: currentTrackColor.bg,
                    color: currentTrackColor.text,
                    border: `1px solid ${currentTrackColor.border}`,
                  }}
                  title={`Color theme: ${currentTrackColor.name}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: currentTrackColor.hex }}
                  />
                  {currentTrackColor.name} Theme
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
          {/* Comparison View Mode Toggler: Parallel Tracks vs Merged Track */}
          {isComparison && comparisonTracks.length >= 2 && (
            <div className="flex items-center bg-white rounded-xl border border-brand-200 p-0.5 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setComparisonViewMode("parallel")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  comparisonViewMode === "parallel"
                    ? "bg-copper-400 text-brand-950 font-bold shadow-xs"
                    : "text-brand-600 hover:text-brand-900"
                }`}
                title="Parallel Tracks (tracks organized into stacked horizontal lines with gaps)"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Parallel Tracks</span>
              </button>

              <button
                type="button"
                onClick={() => setComparisonViewMode("merged")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
                  comparisonViewMode === "merged"
                    ? "bg-copper-400 text-brand-950 font-bold shadow-xs"
                    : "text-brand-600 hover:text-brand-900"
                }`}
                title="Merged Track (all milestones on a single chronological line, with distinct event card background colours)"
              >
                <Combine className="w-3.5 h-3.5" />
                <span>Merged Track</span>
              </button>
            </div>
          )}

          {/* Save Comparison to History Button */}
          {isComparison && (
            <button
              onClick={handleSaveComparisonToHistory}
              disabled={savedComparison}
              className="p-2 rounded-lg bg-white border border-brand-200 text-xs font-medium text-brand-700 hover:bg-brand-100/60 flex items-center gap-1.5 transition-colors"
              title="Save this comparison into History"
            >
              <Save className="w-3.5 h-3.5 text-copper-600" />
              <span className="hidden sm:inline">
                {savedComparison ? "Saved!" : "Save"}
              </span>
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

          {currentRecord && !isComparison && (
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

      {/* Track Legend Bar: Color & Track Distinction */}
      {isComparison && comparisonTracks.length >= 2 && (
        <div className="px-4 sm:px-6 py-2 bg-brand-950 text-white border-b border-brand-800 flex items-center gap-2 overflow-x-auto text-xs z-10">
          <span className="font-semibold text-copper-300 text-[11px] whitespace-nowrap flex items-center gap-1.5 mr-1">
            <span className="w-2 h-2 rounded-full bg-copper-400 animate-pulse" />
            Tracks:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {comparisonTracks.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => handleJumpToTrack(track.title)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-xs"
                style={{
                  backgroundColor: track.color.bg,
                  border: `1.5px solid ${track.color.border}`,
                  color: track.color.text,
                }}
                title={`Click to jump to first event in "${track.title}"`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color.hex }}
                />
                <span className="font-bold">Track {idx + 1}:</span>
                <span className="max-w-[140px] truncate">{track.title}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5"
                  style={{
                    backgroundColor: track.color.hex,
                    color: "#1A2121",
                  }}
                >
                  {track.eventsCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Timeline & Optional Outline Drawer */}
      <div className="flex-1 w-full relative flex overflow-hidden">
        {/* Knight Lab Timeline Container */}
        <div
          className="flex-1 w-full relative"
          style={{
            height: isFullscreen
              ? isComparison
                ? "calc(100vh - 90px)"
                : "calc(100vh - 54px)"
              : isComparison
              ? "calc(100vh - 200px)"
              : "calc(100vh - 165px)",
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

        {/* Event List Outline Panel with Track & Card Distinction */}
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

                // Find track styling if in comparison mode
                const matchingTrack = comparisonTracks.find(
                  (t) => t.title === evt.group || t.title === (evt as any).trackTitle
                );

                return (
                  <div
                    key={evt.unique_id || idx}
                    style={
                      matchingTrack
                        ? {
                            backgroundColor: matchingTrack.color.bg,
                            border: `1.5px solid ${matchingTrack.color.border}`,
                            borderLeft: `5px solid ${matchingTrack.color.hex}`,
                          }
                        : undefined
                    }
                    className={`p-3 rounded-xl transition-all shadow-xs ${
                      matchingTrack
                        ? ""
                        : "border border-brand-100 bg-brand-50/40 hover:bg-brand-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span
                        className="font-mono font-bold px-2 py-0.5 rounded text-xs"
                        style={
                          matchingTrack
                            ? {
                                backgroundColor: matchingTrack.color.hex,
                                color: "#1A2121",
                              }
                            : {
                                backgroundColor: "#FAF4F0",
                                color: "#9E5F47",
                              }
                        }
                      >
                        {dateStr}
                      </span>
                      {(evt.group || (evt as any).trackTitle) && (
                        <span
                          className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                          style={
                            matchingTrack
                              ? {
                                  backgroundColor: matchingTrack.color.border,
                                  color: matchingTrack.color.text,
                                }
                              : {
                                  backgroundColor: "#E2E8F0",
                                  color: "#334155",
                                }
                          }
                        >
                          {evt.group || (evt as any).trackTitle}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-brand-950 mb-1">
                      {evt.text?.headline || ""}
                    </h4>
                    <div
                      className="text-xs text-brand-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: evt.text?.text || "" }}
                    />
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
