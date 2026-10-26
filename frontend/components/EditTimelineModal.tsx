"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  FileText,
  Calendar,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Layers,
  Palette,
} from "lucide-react";
import { TimelineSlide, formatEventDate } from "@/types/timeline";
import { useTimelineStore, TRACK_PALETTE, getTimelineTrackColor } from "@/store/zustand";

export const EditTimelineModal: React.FC = () => {
  const {
    editingTimelineRecord,
    setEditingTimelineRecord,
    updateTimelineRecord,
    deleteTimelineFromHistory,
    setEditingEvent,
  } = useTimelineStore();

  const [activeTab, setActiveTab] = useState<"general" | "cover" | "events">("general");

  // Form states
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [startYear, setStartYear] = useState<number | string>("");
  const [endYear, setEndYear] = useState<number | string>("");
  const [colorHex, setColorHex] = useState("");

  // Title Slide / Cover states
  const [coverHeadline, setCoverHeadline] = useState("");
  const [coverText, setCoverText] = useState("");
  const [coverMediaUrl, setCoverMediaUrl] = useState("");
  const [coverMediaCaption, setCoverMediaCaption] = useState("");
  const [coverMediaCredit, setCoverMediaCredit] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (editingTimelineRecord) {
      setTitle(editingTimelineRecord.title || "");
      setTopic(editingTimelineRecord.topic || "");
      setDescription(editingTimelineRecord.description || "");
      setColorHex(
        editingTimelineRecord.colorHex ||
          getTimelineTrackColor(editingTimelineRecord).hex
      );
      setStartYear(
        editingTimelineRecord.dateRange?.startYear !== undefined
          ? editingTimelineRecord.dateRange.startYear
          : ""
      );
      setEndYear(
        editingTimelineRecord.dateRange?.endYear !== undefined
          ? editingTimelineRecord.dateRange.endYear
          : ""
      );

      const titleSlide = editingTimelineRecord.timelineData?.title;
      setCoverHeadline(titleSlide?.text?.headline || editingTimelineRecord.title || "");
      setCoverText(titleSlide?.text?.text || "");
      setCoverMediaUrl(titleSlide?.media?.url || "");
      setCoverMediaCaption(titleSlide?.media?.caption || "");
      setCoverMediaCredit(titleSlide?.media?.credit || "");

      setErrorMsg(null);
      setSavedSuccess(false);
      setActiveTab("general");
    }
  }, [editingTimelineRecord]);

  if (!editingTimelineRecord) return null;

  const events = editingTimelineRecord.timelineData?.events || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please provide a timeline title.");
      return;
    }

    setIsSaving(true);
    try {
      const existingTitleSlide = editingTimelineRecord.timelineData?.title;
      const updatedTimelineData = {
        ...editingTimelineRecord.timelineData,
        title: {
          ...existingTitleSlide,
          text: {
            headline: coverHeadline.trim() || title.trim(),
            text: coverText.trim(),
          },
          ...(coverMediaUrl.trim()
            ? {
                media: {
                  url: coverMediaUrl.trim(),
                  caption: coverMediaCaption.trim() || undefined,
                  credit: coverMediaCredit.trim() || undefined,
                },
              }
            : { media: undefined }),
        },
      };

      await updateTimelineRecord(editingTimelineRecord.id, {
        title: title.trim(),
        topic: topic.trim() || title.trim(),
        description: description.trim() || undefined,
        colorHex: colorHex || undefined,
        timelineData: updatedTimelineData,
        dateRange: {
          startYear: startYear !== "" ? Number(startYear) : (editingTimelineRecord.dateRange?.startYear || 0),
          endYear: endYear !== "" ? Number(endYear) : (editingTimelineRecord.dateRange?.endYear || 0),
        },
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setEditingTimelineRecord(null);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save timeline.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTimeline = async () => {
    if (confirm(`Are you sure you want to permanently delete "${editingTimelineRecord.title}"?`)) {
      await deleteTimelineFromHistory(editingTimelineRecord.id);
      setEditingTimelineRecord(null);
    }
  };

  const handleOpenAddEvent = () => {
    const defaultStartYear = startYear !== ""
      ? Number(startYear)
      : (editingTimelineRecord.dateRange?.startYear || new Date().getFullYear());

    const defaultNewEvent: TimelineSlide = {
      unique_id: `evt-${Date.now()}`,
      start_date: {
        year: defaultStartYear,
      },
      text: {
        headline: "",
        text: "",
      },
    };

    setEditingEvent({
      recordId: editingTimelineRecord.id,
      eventIndex: null,
      event: defaultNewEvent,
    });
  };

  const handleOpenEditEvent = (eventIndex: number, event: TimelineSlide) => {
    setEditingEvent({
      recordId: editingTimelineRecord.id,
      eventIndex,
      event,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-brand-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-brand-100 bg-brand-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-copper-100 text-copper-700 rounded-xl">
              <Sliders className="w-5 h-5 text-copper-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-brand-900 text-base">Edit Timeline</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-200 text-brand-800">
                  {events.length} events
                </span>
              </div>
              <p className="text-xs text-brand-600">
                Update timeline title, cover slide narrative, and milestones
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingTimelineRecord(null)}
            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-brand-200 bg-white px-5 sm:px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "general"
                ? "border-copper-500 text-copper-900"
                : "border-transparent text-brand-500 hover:text-brand-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            General Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cover")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "cover"
                ? "border-copper-500 text-copper-900"
                : "border-transparent text-brand-500 hover:text-brand-800"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Cover Slide
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "events"
                ? "border-copper-500 text-copper-900"
                : "border-transparent text-brand-500 hover:text-brand-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Events ({events.length})
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1">
                  Timeline Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Scientific Revolution (1543-1687)"
                  required
                  className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-brand-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1">
                  Topic / Search Query
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Scientific Revolution"
                  className="w-full px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1">
                  Description / Subtitle
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brief description or notes for this timeline..."
                  className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>

              {/* Chronological Scope / Date Range */}
              <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 space-y-2">
                <label className="block text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-copper-600" />
                  Chronological Scope (Date Range)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-brand-600 block mb-0.5">Start Year</span>
                    <input
                      type="number"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      placeholder="e.g. 1963"
                      className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-copper-400"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-brand-600 block mb-0.5">End Year</span>
                    <input
                      type="number"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      placeholder="e.g. 2012"
                      className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-copper-400"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-brand-500">
                  Pre-populated from milestones; editable for defining custom historical eras.
                </p>
              </div>

              {/* Timeline Theme & Color Selection */}
              <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 space-y-2.5">
                <label className="block text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-copper-600" />
                  Timeline Color Theme
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TRACK_PALETTE.map((color) => {
                    const isSelected = colorHex?.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setColorHex(color.hex)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                          isSelected
                            ? "ring-2 ring-copper-500 border-copper-400 bg-white shadow-xs font-bold"
                            : "border-brand-200 bg-white/70 hover:bg-white text-brand-700"
                        }`}
                        title={`Select ${color.name} theme`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shadow-inner flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[11px] leading-none">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cover Slide */}
          {activeTab === "cover" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1">
                  Cover Slide Headline
                </label>
                <input
                  type="text"
                  value={coverHeadline}
                  onChange={(e) => setCoverHeadline(e.target.value)}
                  placeholder={title || "Introductory headline..."}
                  className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-brand-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1">
                  Cover Narrative / Introduction Story
                </label>
                <textarea
                  rows={4}
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  placeholder="Introductory text that appears on the opening cover slide..."
                  className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-brand-950 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-brand-200/80 bg-brand-50/40 space-y-2.5">
                <label className="block text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-copper-600" />
                  Cover Media (Optional)
                </label>

                <div>
                  <span className="text-[11px] text-brand-600 block mb-0.5">Media Image URL</span>
                  <input
                    type="url"
                    value={coverMediaUrl}
                    onChange={(e) => setCoverMediaUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs"
                  />
                </div>

                {coverMediaUrl && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                    <div>
                      <span className="text-[11px] text-brand-600 block mb-0.5">Caption</span>
                      <input
                        type="text"
                        value={coverMediaCaption}
                        onChange={(e) => setCoverMediaCaption(e.target.value)}
                        placeholder="Caption for cover image"
                        className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-brand-600 block mb-0.5">Credit</span>
                      <input
                        type="text"
                        value={coverMediaCredit}
                        onChange={(e) => setCoverMediaCredit(e.target.value)}
                        placeholder="Image credit"
                        className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Events Manager */}
          {activeTab === "events" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-brand-900">
                  Timeline Events ({events.length})
                </span>
                <button
                  type="button"
                  onClick={handleOpenAddEvent}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-copper-400 hover:bg-copper-500 text-brand-950 font-bold text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>
              </div>

              {events.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-400 border border-dashed border-brand-300 rounded-xl">
                  No events yet in this timeline. Click &ldquo;Add Event&rdquo; to create your first milestone!
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {events.map((evt, idx) => {
                    const dateStr = formatEventDate(evt.start_date, evt.end_date, evt.display_date);

                    return (
                      <div
                        key={evt.unique_id || idx}
                        className="p-3 rounded-xl border border-brand-200 bg-white hover:border-copper-300 transition-all flex items-start justify-between gap-3 shadow-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-copper-100 text-copper-800">
                              {evt.display_date || dateStr}
                            </span>
                            {evt.group && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                                {evt.group}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-brand-950 truncate">
                            {evt.text?.headline || "(Untitled Event)"}
                          </h4>
                          <p className="text-[11px] text-brand-600 line-clamp-1 mt-0.5">
                            {evt.text?.text?.replace(/<[^>]+>/g, "") || "No description"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEvent(idx, evt)}
                            className="p-1.5 rounded-lg text-brand-600 hover:text-copper-700 hover:bg-copper-50 transition-colors"
                            title="Edit this event"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-brand-100 bg-brand-50/80 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={handleDeleteTimeline}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Delete this timeline from local history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Timeline</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingTimelineRecord(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-brand-700 hover:bg-brand-200/50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                savedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-copper-400 hover:bg-copper-500 text-brand-950 active:scale-95"
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Timeline"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
