"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Image as ImageIcon,
  Tag,
  FileText,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
} from "lucide-react";
import { useTimelineStore } from "@/store/zustand";
import { TimelineSlide, extractDateParts } from "@/types/timeline";

export const EditEventModal: React.FC = () => {
  const {
    editingEvent,
    setEditingEvent,
    saveEvent,
    deleteEvent,
    history,
    currentRecord,
  } = useTimelineStore();

  const isEditing = editingEvent !== null;
  const isNewEvent = editingEvent?.eventIndex === null;

  // Form fields
  const [headline, setHeadline] = useState("");
  const [text, setText] = useState("");
  const [startYear, setStartYear] = useState<number | string>("");
  const [startMonth, setStartMonth] = useState<number | string>("");
  const [startDay, setStartDay] = useState<number | string>("");

  const [hasEndDate, setHasEndDate] = useState(false);
  const [endYear, setEndYear] = useState<number | string>("");
  const [endMonth, setEndMonth] = useState<number | string>("");
  const [endDay, setEndDay] = useState<number | string>("");

  const [displayDate, setDisplayDate] = useState("");
  const [group, setGroup] = useState("");

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaCredit, setMediaCredit] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      const evt = editingEvent.event;
      setHeadline(evt.text?.headline || "");
      setText(evt.text?.text || "");

      // Robust date extraction for existing dates across all formats (JSON, string, TL.Date)
      const targetRec = history.find((h) => h.id === editingEvent.recordId) || currentRecord;
      const startParts = extractDateParts(evt.start_date, evt.display_date);
      
      const defaultYear = startParts.year || (isNewEvent && targetRec?.dateRange?.startYear ? String(targetRec.dateRange.startYear) : "");
      setStartYear(defaultYear);
      setStartMonth(startParts.month);
      setStartDay(startParts.day);

      const endParts = extractDateParts(evt.end_date);
      if (endParts.year) {
        setHasEndDate(true);
        setEndYear(endParts.year);
        setEndMonth(endParts.month);
        setEndDay(endParts.day);
      } else {
        setHasEndDate(false);
        setEndYear("");
        setEndMonth("");
        setEndDay("");
      }

      setDisplayDate(evt.display_date || startParts.displayDate || "");
      setGroup(evt.group || "");

      setMediaUrl(evt.media?.url || "");
      setMediaCaption(evt.media?.caption || "");
      setMediaCredit(evt.media?.credit || "");

      setErrorMsg(null);
      setSavedSuccess(false);
    }
  }, [editingEvent, history, currentRecord, isNewEvent]);

  if (!isEditing || !editingEvent) return null;

  // Find target timeline title for context
  const targetRecord = history.find((h) => h.id === editingEvent.recordId) || currentRecord;
  const targetTitle = targetRecord?.title || targetRecord?.topic || "Timeline";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const yearNum = Number(startYear);
    if (!headline.trim()) {
      setErrorMsg("Please provide an event headline / title.");
      return;
    }
    if (startYear === "" || isNaN(yearNum)) {
      setErrorMsg("Please provide a valid start year (e.g. 1969 or -500 for BCE).");
      return;
    }

    setIsSaving(true);
    try {
      const updatedEvent: TimelineSlide = {
        unique_id: editingEvent.event.unique_id || `evt-${Date.now()}`,
        start_date: {
          year: yearNum,
          ...(startMonth ? { month: Number(startMonth) } : {}),
          ...(startDay ? { day: Number(startDay) } : {}),
        },
        ...(hasEndDate && endYear !== "" && !isNaN(Number(endYear))
          ? {
              end_date: {
                year: Number(endYear),
                ...(endMonth ? { month: Number(endMonth) } : {}),
                ...(endDay ? { day: Number(endDay) } : {}),
              },
            }
          : {}),
        ...(displayDate.trim() ? { display_date: displayDate.trim() } : {}),
        text: {
          headline: headline.trim(),
          text: text.trim(),
        },
        ...(group.trim() ? { group: group.trim() } : {}),
        ...(mediaUrl.trim()
          ? {
              media: {
                url: mediaUrl.trim(),
                caption: mediaCaption.trim() || undefined,
                credit: mediaCredit.trim() || undefined,
              },
            }
          : {}),
      };

      await saveEvent(editingEvent.recordId, editingEvent.eventIndex, updatedEvent);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setEditingEvent(null);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (editingEvent.eventIndex === null) return;
    if (confirm(`Are you sure you want to delete "${headline || "this event"}"?`)) {
      await deleteEvent(editingEvent.recordId, editingEvent.eventIndex);
      setEditingEvent(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-brand-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-brand-100 bg-brand-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-copper-100 text-copper-700 rounded-xl">
              <Calendar className="w-5 h-5 text-copper-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-brand-900 text-base">
                  {isNewEvent ? "Add New Event" : "Edit Event"}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-copper-100 text-copper-800 border border-copper-200 truncate max-w-[180px]">
                  {targetTitle}
                </span>
              </div>
              <p className="text-xs text-brand-600">
                {isNewEvent
                  ? "Craft a new historical milestone for this timeline"
                  : "Modify milestone date, description, or media"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingEvent(null)}
            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Headline & Category */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-brand-800 mb-1">
                Event Headline / Milestone Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Apollo 11 Lunar Landing"
                required
                className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-brand-950 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-copper-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-copper-600" />
                  Category / Group Track (Optional)
                </label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="e.g. Space Exploration, Physics"
                  className="w-full px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 mb-1">
                  Custom Display Date (Optional)
                </label>
                <input
                  type="text"
                  value={displayDate}
                  onChange={(e) => setDisplayDate(e.target.value)}
                  placeholder="e.g. Summer 1969 or c. 450 BCE"
                  className="w-full px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-copper-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Date Configuration */}
          <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 space-y-3">
            <div>
              <label className="block text-xs font-bold text-brand-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-copper-600" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] text-brand-600 block mb-0.5">Year</span>
                  <input
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="e.g. 1969"
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-copper-400"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-brand-600 block mb-0.5">Month (1-12)</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-copper-400"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-brand-600 block mb-0.5">Day (1-31)</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={startDay}
                    onChange={(e) => setStartDay(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-copper-400"
                  />
                </div>
              </div>
            </div>

            {/* Optional End Date */}
            <div className="pt-2 border-t border-brand-200/60">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-800 select-none">
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="rounded text-copper-600 focus:ring-copper-400 w-3.5 h-3.5"
                />
                <span>This event spans a duration / era (Has End Date)</span>
              </label>

              {hasEndDate && (
                <div className="grid grid-cols-3 gap-2 mt-2.5 animate-in fade-in">
                  <div>
                    <span className="text-[11px] text-brand-600 block mb-0.5">End Year</span>
                    <input
                      type="number"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      placeholder="e.g. 1972"
                      className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-copper-400"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-brand-600 block mb-0.5">End Month</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-copper-400"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-brand-600 block mb-0.5">End Day</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={endDay}
                      onChange={(e) => setEndDay(e.target.value)}
                      placeholder="e.g. 19"
                      className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-copper-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Event Story / Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-brand-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-copper-600" />
                Event Description & Narrative
              </label>
              <span className="text-[10px] text-brand-400">Supports text & HTML</span>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe this historical moment, significance, key figures, and broader impact..."
              className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-brand-950 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-copper-400"
            />
          </div>

          {/* Section 4: Media (Image, Video, Caption) */}
          <div className="p-3.5 rounded-xl border border-brand-200/80 bg-brand-50/40 space-y-2.5">
            <label className="block text-xs font-bold text-brand-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-copper-600" />
              Media Attachment (Optional)
            </label>

            <div>
              <span className="text-[11px] text-brand-600 block mb-0.5">
                Image or Media URL (JPG, PNG, YouTube, Wikimedia, etc.)
              </span>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-copper-400"
              />
            </div>

            {mediaUrl && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                <div>
                  <span className="text-[11px] text-brand-600 block mb-0.5">Media Caption</span>
                  <input
                    type="text"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder="e.g. Neil Armstrong on the Moon"
                    className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-brand-600 block mb-0.5">Media Credit</span>
                  <input
                    type="text"
                    value={mediaCredit}
                    onChange={(e) => setMediaCredit(e.target.value)}
                    placeholder="e.g. NASA / Wikimedia Commons"
                    className="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded-lg text-brand-950 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Live Card Preview */}
          <div className="border border-copper-200/80 bg-copper-50/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-copper-900 mb-2">
              <Eye className="w-3.5 h-3.5 text-copper-600" />
              Live Event Card Preview
            </div>
            <div className="bg-white rounded-lg p-3 border border-brand-200 shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-copper-100 text-copper-800 text-xs">
                  {displayDate || startYear || "Year"}
                </span>
                {group && (
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                    {group}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-brand-950 mb-1">
                {headline || "Event Headline"}
              </h4>
              <p className="text-xs text-brand-700 line-clamp-3 leading-relaxed">
                {text || "Event narrative and description will be displayed here..."}
              </p>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-brand-100 bg-brand-50/80 flex items-center justify-between">
          <div>
            {!isNewEvent && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Delete this event from timeline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingEvent(null)}
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
                  <span>{isSaving ? "Saving..." : "Save Event"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
