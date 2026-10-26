"use client";

import React from "react";
import Image from "next/image";
import { Settings, PanelLeftClose, PanelLeft, Github } from "lucide-react";
import { useTimelineStore } from "@/store/zustand";

export const TopNav: React.FC = () => {
  const { toggleSidebar, sidebarOpen, setSettingsOpen, setTimeline } = useTimelineStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-brand-900/95 backdrop-blur-md border-b border-brand-800 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
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
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo_zoomed.png`}
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
            </div>
            <span className="text-[11px] text-brand-300 hidden sm:inline leading-none">
              AI Chronological Visualization
            </span>
          </div>
        </div>
      </div>

      {/* Right: Settings modal & GitHub */}
      <div className="flex items-center gap-2 sm:gap-3">
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

