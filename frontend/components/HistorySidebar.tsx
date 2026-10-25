"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTimelineStore, TRACK_PALETTE, getTimelineTrackColor } from "@/store/zustand";
import {
  Clock,
  Star,
  Trash2,
  Search,
  ChevronRight,
  Plus,
  Calendar,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Layers,
  CheckSquare,
  Square,
  X,
  SlidersHorizontal,
  Split,
  Combine,
} from "lucide-react";
import { StorageService } from "@/services/storage";
import { CachedTimelineRecord, TimelineData } from "@/types/timeline";
import { v4 as uuidv4 } from "uuid";

export const HistorySidebar: React.FC = () => {
  const {
    sidebarOpen,
    toggleSidebar,
    history,
    historyLoading,
    loadHistory,
    selectTimelineFromHistory,
    deleteTimelineFromHistory,
    toggleFavoriteTimeline,
    currentRecord,
    setTimeline,
    isCompareMode,
    toggleCompareMode,
    selectedHistoryIds,
    toggleSelectHistoryId,
    selectAllHistory,
    clearSelectedHistory,
    comparisonTracks,
    comparisonViewMode,
    setComparisonViewMode,
  } = useTimelineStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorite = filterFavorite ? Boolean(item.isFavorite) : true;
      return matchesSearch && matchesFavorite;
    });
  }, [history, searchTerm, filterFavorite]);

  const handleExportBackup = async () => {
    const jsonStr = await StorageService.exportAllAsJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronocraft_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed?.timelines) || Array.isArray(parsed)) {
        const count = await StorageService.importFromJson(text);
        await loadHistory();
        setImportStatus({ success: true, message: `Imported ${count} timelines!` });
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
        setImportStatus({ success: true, message: `Imported "${topic}"!` });
      } else {
        throw new Error("Invalid JSON structure: Expected timeline with 'events' array.");
      }

      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      console.error("Import error:", err);
      setImportStatus({ success: false, message: err.message || "Failed to parse JSON file" });
      setTimeout(() => setImportStatus(null), 4000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNewTimeline = () => {
    setTimeline(null);
  };

  return (
    <>
      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-30 bg-brand-900 border-r border-brand-800 text-brand-100 transition-all duration-300 flex flex-col ${
          sidebarOpen
            ? "w-80 translate-x-0 overflow-y-auto visible pointer-events-auto opacity-100 shadow-2xl"
            : "w-0 -translate-x-full overflow-hidden invisible pointer-events-none opacity-0"
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="p-3.5 border-b border-brand-800 flex items-center justify-between bg-brand-950/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-copper-300" />
            <h3 className="font-semibold text-sm text-brand-100">Timelines</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-800 text-copper-200 font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Compare mode toggle button */}
            <button
              onClick={() => toggleCompareMode()}
              disabled={history.length < 2}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 ${
                isCompareMode
                  ? "bg-copper-400 text-brand-950 font-bold"
                  : "bg-brand-800 text-brand-300 hover:text-white hover:bg-brand-700"
              }`}
              title={isCompareMode ? "Exit compare mode" : "Compare multiple timelines in parallel"}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            <button
              onClick={handleNewTimeline}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-copper-400 hover:bg-copper-500 text-brand-950 font-semibold transition-colors shadow-sm"
              title="Create new timeline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Compare Mode Status & Instant Filter Bar (Active during compare mode) */}
        {isCompareMode && (
          <div className="p-3 bg-brand-950 border-b border-brand-800 space-y-2.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-xs text-brand-200">
              <span className="font-semibold text-copper-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-copper-400" />
                Comparing {selectedHistoryIds.length} of {history.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllHistory}
                  className="text-brand-400 hover:text-brand-200 text-[11px] underline"
                >
                  All
                </button>
                <button
                  onClick={clearSelectedHistory}
                  className="text-brand-400 hover:text-brand-200 text-[11px] underline"
                >
                  Clear
                </button>
                <button
                  onClick={() => toggleCompareMode(false)}
                  className="p-1 text-brand-400 hover:text-white"
                  title="Close compare mode"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Color Chips of Currently Active Tracks */}
            {comparisonTracks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {comparisonTracks.map((track) => (
                  <span
                    key={track.id}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shadow-xs"
                    style={{
                      backgroundColor: track.color.hex,
                      color: "#1A2121",
                    }}
                    title={`${track.title} (${track.eventsCount} milestones)`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-950/40" />
                    <span className="max-w-[100px] truncate">{track.title}</span>
                  </span>
                ))}
              </div>
            )}

            {/* View Mode Toggler: Parallel Tracks vs Merged Track */}
            {comparisonTracks.length >= 2 && (
              <div className="flex items-center bg-brand-900/90 p-1 rounded-lg border border-brand-800 text-xs">
                <button
                  type="button"
                  onClick={() => setComparisonViewMode("parallel")}
                  className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 text-[11px] transition-all ${
                    comparisonViewMode === "parallel"
                      ? "bg-copper-400 text-brand-950 font-bold shadow-xs"
                      : "text-brand-400 hover:text-brand-200"
                  }`}
                  title="Parallel Tracks (tracks organized into stacked swimlanes with gaps)"
                >
                  <Split className="w-3 h-3" />
                  <span>Parallel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonViewMode("merged")}
                  className={`flex-1 py-1 px-2 rounded-md flex items-center justify-center gap-1 text-[11px] transition-all ${
                    comparisonViewMode === "merged"
                      ? "bg-copper-400 text-brand-950 font-bold shadow-xs"
                      : "text-brand-400 hover:text-brand-200"
                  }`}
                  title="Merged Track (all milestones on single chronological line, with distinct card colors)"
                >
                  <Combine className="w-3 h-3" />
                  <span>Merged Track</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search & Favorites Filter */}
        <div className="p-3 border-b border-brand-800 space-y-2 bg-brand-900/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
            <input
              id="sidebar-filter-input"
              type="text"
              placeholder="Search past timelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-800/80 border border-brand-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-100 placeholder-brand-400 focus:outline-none focus:border-copper-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterFavorite(false)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                !filterFavorite
                  ? "bg-brand-800 text-white font-medium"
                  : "text-brand-300 hover:text-white"
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilterFavorite(true)}
              className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                filterFavorite
                  ? "bg-copper-400/20 text-copper-300 font-medium border border-copper-400/40"
                  : "text-brand-300 hover:text-white"
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              Starred ({history.filter((h) => h.isFavorite).length})
            </button>
          </div>
        </div>

        {/* Import Notification Banner */}
        {importStatus && (
          <div
            className={`m-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
              importStatus.success
                ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700"
                : "bg-red-900/60 text-red-200 border border-red-700"
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span className="line-clamp-2">{importStatus.message}</span>
          </div>
        )}

        {/* Scrollable History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {historyLoading ? (
            <div className="p-6 text-center text-xs text-brand-400">Loading history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-brand-400 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-brand-600" />
              <p>
                {searchTerm
                  ? "No timelines match your search."
                  : filterFavorite
                  ? "No starred timelines yet."
                  : "No saved timelines. Generate or import a timeline to see it here!"}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isSelected = isCompareMode
                ? selectedHistoryIds.includes(item.id)
                : currentRecord?.id === item.id;

              // Find track color if selected in compare mode, or timeline identifying color in general
              const trackIndex = selectedHistoryIds.indexOf(item.id);
              const assignedTrackColor =
                isCompareMode && trackIndex !== -1
                  ? TRACK_PALETTE[trackIndex % TRACK_PALETTE.length]
                  : null;

              const singleItemColor = getTimelineTrackColor(item, history);
              const activeColor = assignedTrackColor || (isSelected ? singleItemColor : null);

              const dateText =
                item.dateRange?.startYear && item.dateRange?.endYear
                  ? `${item.dateRange.startYear} - ${item.dateRange.endYear}`
                  : item.dateRange?.startYear
                  ? `${item.dateRange.startYear}`
                  : null;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isCompareMode) {
                      toggleSelectHistoryId(item.id);
                    } else {
                      selectTimelineFromHistory(item.id);
                    }
                  }}
                  style={
                    activeColor
                      ? {
                          borderColor: activeColor.hex,
                          backgroundColor: `${activeColor.hex}18`,
                        }
                      : undefined
                  }
                  className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    activeColor
                      ? "ring-1 ring-offset-0 text-white"
                      : "bg-brand-800/40 border-brand-800 hover:bg-brand-800/90 hover:border-brand-700 text-brand-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {/* Checkbox when in Compare Mode with instant update */}
                      {isCompareMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectHistoryId(item.id);
                          }}
                          className="pt-0.5 flex-shrink-0"
                          style={{
                            color: assignedTrackColor?.hex || undefined,
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare
                              className="w-4 h-4 fill-current"
                              style={{ color: assignedTrackColor?.hex || "#DCA48E" }}
                            />
                          ) : (
                            <Square className="w-4 h-4 text-brand-500" />
                          )}
                        </button>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {assignedTrackColor ? (
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
                              style={{
                                backgroundColor: assignedTrackColor.hex,
                                color: "#1A2121",
                              }}
                            >
                              Track {trackIndex + 1}
                            </span>
                          ) : (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: singleItemColor.hex }}
                              title={`Theme: ${singleItemColor.name}`}
                            />
                          )}
                          <h4 className="font-medium text-xs leading-snug line-clamp-2 text-white">
                            {item.title || item.topic}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Star button */}
                    {!isCompareMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteTimeline(item.id);
                        }}
                        className="p-1 text-brand-400 hover:text-amber-400 transition-colors flex-shrink-0"
                        title={item.isFavorite ? "Unstar" : "Star"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            item.isFavorite ? "fill-amber-400 text-amber-400" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-brand-400 mt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {dateText && (
                        <span className="flex items-center gap-1 text-copper-300 font-mono text-[10px]">
                          <Calendar className="w-3 h-3 text-copper-400" />
                          {dateText}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-800 text-brand-300">
                        {item.eventsCount} events
                      </span>
                    </div>

                    {!isCompareMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${item.title || item.topic}"?`)) {
                            deleteTimelineFromHistory(item.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-brand-400 hover:text-red-400 transition-opacity"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Import & Export Options */}
        <div className="p-3 border-t border-brand-800 bg-brand-950/60 flex items-center justify-between text-xs text-brand-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-copper-300 hover:text-copper-200 transition-colors text-[11px] font-medium"
              title="Import timeline or backup JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            <button
              onClick={handleExportBackup}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-brand-300 hover:text-white disabled:opacity-40 transition-colors text-[11px]"
              title="Download JSON backup of all cached timelines"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          <span className="text-[10px] text-brand-500 font-mono">IndexedDB</span>
        </div>
      </aside>

      {/* Floating Toggle Button when sidebar is collapsed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-20 left-3 z-30 p-2 rounded-xl bg-brand-900/95 text-copper-200 shadow-xl border border-brand-700/80 hover:bg-brand-800 transition-all flex items-center gap-1.5 text-xs backdrop-blur-sm"
          title="Open Timeline History"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">History</span>
        </button>
      )}
    </>
  );
};
