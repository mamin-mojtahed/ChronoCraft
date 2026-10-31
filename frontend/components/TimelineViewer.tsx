"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { TimelineData, TimelineSlide, formatEventDate } from "@/types/timeline";
import {
  Download,
  FileJson,
  Star,
  Clock,
  ListFilter,
  Maximize2,
  Minimize2,
  Save,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useTimelineStore, getTimelineTrackColor } from "@/store/zustand";
import { StorageService } from "@/services/storage";

interface TimelineViewerProps {
  data: TimelineData;
  title?: string;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ data, title }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineInstanceRef = useRef<any>(null);
  const isNavHoveredRef = useRef(false);
  const currentSlideIdRef = useRef<string | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showOutline, setShowOutline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNavRevealed, setIsNavRevealed] = useState(false);
  const [savedComparison, setSavedComparison] = useState(false);

  const {
    currentRecord,
    history,
    toggleFavoriteTimeline,
    comparisonTracks,
    comparisonViewMode,
    loadHistory,
    setEditingTimelineRecord,
    setEditingEvent,
    deleteEvent,
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

      let startSlide = 0;
      if (currentSlideIdRef.current && data.events) {
        const foundIdx = data.events.findIndex(
          (e) => e.unique_id === currentSlideIdRef.current || e.text?.headline === currentSlideIdRef.current
        );
        if (foundIdx !== -1) {
          startSlide = data.title ? foundIdx + 1 : foundIdx;
        }
      }

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
        start_at_slide: startSlide,
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
                  box.style.setProperty(
                    "box-shadow",
                    "0 4px 14px rgba(0, 0, 0, 0.65), 0 1px 4px rgba(0, 0, 0, 0.4)",
                    "important"
                  );
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
                box.style.setProperty(
                  "box-shadow",
                  "0 4px 14px rgba(0, 0, 0, 0.65), 0 1px 4px rgba(0, 0, 0, 0.4)",
                  "important"
                );
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
        timelineInstanceRef.current.on("change", (e: any) => {
          if (e?.unique_id) {
            currentSlideIdRef.current = e.unique_id;
          } else if (timelineInstanceRef.current?.current_id) {
            currentSlideIdRef.current = timelineInstanceRef.current.current_id;
          }
          setTimeout(applyMarkerColors, 30);
        });
        timelineInstanceRef.current.on("nav_move", () => setTimeout(applyMarkerColors, 30));
      }
    } catch (err) {
      console.error("TimelineJS render error:", err);
    }
  }, [
    scriptLoaded,
    data,
    renderKey,
    isFullscreen,
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

  // Listen to browser fullscreen changes (e.g. user pressing Esc or browser UI)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreen(active);
      if (active) {
        setIsNavRevealed(true);
      } else {
        setIsNavRevealed(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      setIsNavRevealed(true);
      try {
        const root = rootRef.current;
        if (root && !document.fullscreenElement) {
          if (root.requestFullscreen) {
            await root.requestFullscreen();
          } else if ((root as any).webkitRequestFullscreen) {
            await (root as any).webkitRequestFullscreen();
          }
        }
      } catch (err) {
        console.warn("Fullscreen API failed, falling back to CSS fullscreen:", err);
      }
    } else {
      setIsFullscreen(false);
      setIsNavRevealed(false);
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
      } catch (err) {
        console.warn("Exit fullscreen failed:", err);
      }
    }
  }, [isFullscreen]);

  // Keyboard shortcut: Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    if (e.clientY <= 50) {
      setIsNavRevealed(true);
    } else if (e.clientY > 90 && !isNavHoveredRef.current) {
      setIsNavRevealed(false);
    }
  };

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

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      className={`w-full bg-white relative transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-[100] w-screen h-screen overflow-hidden flex flex-col"
          : "flex flex-col relative"
      }`}
      style={!isFullscreen ? { height: "calc(100vh - 64px)", minHeight: "calc(100vh - 64px)" } : undefined}
    >
      {/* Top invisible trigger zone for hover in fullscreen mode */}
      {isFullscreen && (
        <div
          className="absolute top-0 left-0 right-0 h-6 z-40 pointer-events-auto"
          onMouseEnter={() => setIsNavRevealed(true)}
        />
      )}

      {/* Timeline Action Header Bar / Nav Bar */}
      <div
        onMouseEnter={() => {
          isNavHoveredRef.current = true;
          setIsNavRevealed(true);
        }}
        onMouseLeave={(e) => {
          isNavHoveredRef.current = false;
          if (isFullscreen && e.clientY > 60) {
            setIsNavRevealed(false);
          }
        }}
        className={`h-14 min-h-[56px] max-h-[56px] flex items-center justify-between px-4 sm:px-6 border-b border-brand-100 bg-brand-50/95 backdrop-blur-md z-50 gap-2 transition-all duration-300 ease-in-out ${
          isFullscreen
            ? `absolute top-0 left-0 right-0 shadow-lg ${
                isNavRevealed
                  ? "translate-y-0 opacity-100 pointer-events-auto"
                  : "-translate-y-full opacity-0 pointer-events-none"
              }`
            : "relative z-10 flex-shrink-0"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-copper-100 text-copper-700 flex-shrink-0">
            {isComparison ? (
              <Layers className="w-4 h-4 text-copper-600" />
            ) : (
              <Clock className="w-4 h-4 text-copper-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-brand-900 text-sm sm:text-base leading-tight truncate">
                {title || data.title?.text?.headline || "Interactive Timeline"}
              </h2>
            </div>
            <p className="text-xs text-brand-600 truncate">
              {data.events?.length || 0} chronological milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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

          {/* Edit Timeline & Events Button */}
          {currentRecord && !isComparison && (
            <button
              onClick={() => {
                if (isFullscreen) toggleFullscreen();
                setEditingTimelineRecord(currentRecord);
              }}
              className="p-2 rounded-lg bg-white border border-brand-200 text-xs font-medium text-brand-700 hover:bg-brand-100/60 flex items-center gap-1.5 transition-colors"
              title="Edit timeline details and events"
            >
              <Pencil className="w-3.5 h-3.5 text-copper-600" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

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
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white border border-brand-200 text-brand-700 hover:bg-brand-100/60 transition-colors"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen view"}
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
            height: isFullscreen ? "100vh" : "calc(100vh - 120px)",
            minHeight: isFullscreen ? "100vh" : "calc(100vh - 120px)",
            maxHeight: isFullscreen ? "100vh" : "calc(100vh - 120px)",
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
        <aside
          className={`border-brand-200 bg-white flex flex-col z-40 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            showOutline
              ? "w-80 sm:w-96 translate-x-0 visible pointer-events-auto opacity-100 shadow-xl border-l"
              : "w-0 translate-x-full invisible pointer-events-none opacity-0 border-l-0"
          }`}
          style={{
            height: isFullscreen ? "100vh" : "calc(100vh - 120px)",
            maxHeight: isFullscreen ? "100vh" : "calc(100vh - 120px)",
            minHeight: isFullscreen ? "100vh" : "calc(100vh - 120px)",
          }}
        >
          <div className="w-80 sm:w-96 h-full flex flex-col flex-shrink-0 min-h-0">
            {/* Drawer Header (Fixed at top of drawer) */}
            <div className="p-4 border-b border-brand-100 flex-shrink-0 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-brand-900">All Timeline Events</h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                    {data.events.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOutline(false)}
                  className="p-1 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-100 transition-colors"
                  title="Close event list"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {currentRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isFullscreen) toggleFullscreen();
                      const defaultNewEvent: TimelineSlide = {
                        unique_id: `evt-${Date.now()}`,
                        start_date: {
                          year: currentRecord.dateRange?.startYear || new Date().getFullYear(),
                        },
                        text: {
                          headline: "",
                          text: "",
                        },
                      };
                      setEditingEvent({
                        recordId: currentRecord.id,
                        eventIndex: null,
                        event: defaultNewEvent,
                      });
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-copper-400 hover:bg-copper-500 text-brand-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Add new milestone to this timeline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Events List (Strictly contained within view height) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 overscroll-contain">
              {data.events.map((evt, idx) => {
                const dateStr = formatEventDate(evt.start_date, evt.end_date, evt.display_date);

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

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-brand-100/70">
                      <span className="text-[10px] text-brand-400 italic">
                        {evt.media?.url ? "Has media" : ""}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isFullscreen) toggleFullscreen();
                            const recordId = (evt as any).sourceRecordId || currentRecord?.id;
                            if (!recordId) return;
                            const sourceRec = history.find((h) => h.id === recordId) || currentRecord;
                            let eventIdx = idx;
                            let cleanEvent = evt;
                            if (sourceRec && sourceRec.timelineData?.events) {
                              const foundIdx = sourceRec.timelineData.events.findIndex(
                                (e) => e.unique_id === evt.unique_id || e.text?.headline === evt.text?.headline
                              );
                              if (foundIdx !== -1) {
                                eventIdx = foundIdx;
                                cleanEvent = sourceRec.timelineData.events[foundIdx];
                              }
                            }
                            setEditingEvent({
                              recordId,
                              eventIndex: eventIdx,
                              event: cleanEvent,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-medium text-copper-800 bg-copper-100 hover:bg-copper-200 flex items-center gap-1 transition-colors"
                          title="Edit this event"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const recordId = (evt as any).sourceRecordId || currentRecord?.id;
                            if (!recordId) return;
                            const sourceRec = history.find((h) => h.id === recordId) || currentRecord;
                            let eventIdx = idx;
                            if (sourceRec && sourceRec.timelineData?.events) {
                              const foundIdx = sourceRec.timelineData.events.findIndex(
                                (e) => e.unique_id === evt.unique_id || e.text?.headline === evt.text?.headline
                              );
                              if (foundIdx !== -1) eventIdx = foundIdx;
                            }
                            if (confirm(`Delete event "${evt.text?.headline || "Untitled"}"?`)) {
                              await deleteEvent(recordId, eventIdx);
                            }
                          }}
                          className="p-1 rounded text-brand-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete event from timeline"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
