"use client";

import React, { useState, useEffect } from "react";
import { X, Key, CheckCircle2, AlertCircle, ExternalLink} from "lucide-react";
import { SettingsService, LLMProviderId } from "@/services/settings";
import { LLMService } from "@/services/llm";
import { useTimelineStore } from "@/store/zustand";

export const SettingsModal: React.FC = () => {
  const { settingsOpen, setSettingsOpen } = useTimelineStore();
  const [activeProvider, setActiveProvider] = useState<LLMProviderId>("gemini");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-flash-lite-latest");
  
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [testingOpenAi, setTestingOpenAi] = useState(false);
  const [openaiTestStatus, setOpenaiTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [savedToast, setSavedToast] = useState(false);
  const [serverConfig, setServerConfig] = useState<any>(null);

  useEffect(() => {
    if (settingsOpen) {
      const s = SettingsService.getSettings();
      setGeminiKey(s.geminiApiKey);
      setOpenaiKey(s.openaiApiKey);
      setActiveProvider(s.activeProvider);
      setGeminiModel(s.geminiModel);
      setGeminiTestStatus(null);
      setOpenaiTestStatus(null);
      SettingsService.fetchServerConfig().then(setServerConfig);
    }
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  const handleSave = () => {
    SettingsService.setGeminiApiKey(geminiKey);
    SettingsService.setOpenAiApiKey(openaiKey);
    SettingsService.setActiveProvider(activeProvider);
    SettingsService.setGeminiModel(geminiModel);

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      setSettingsOpen(false);
    }, 600);
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestStatus(null);
    const result = await LLMService.testConnection("gemini", geminiKey);
    setGeminiTestStatus(result);
    setTestingGemini(false);
  };

  const handleTestOpenAi = async () => {
    setTestingOpenAi(true);
    setOpenaiTestStatus(null);
    const result = await LLMService.testConnection("openai", openaiKey);
    setOpenaiTestStatus(result);
    setTestingOpenAi(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-brand-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100 bg-brand-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-copper-100 text-copper-700 rounded-xl">
              <Key className="w-5 h-5 text-copper-600" />
            </div>
            <div>
              <h3 className="font-bold text-brand-900 text-base">API & Model Settings</h3>
              <p className="text-xs text-brand-600">Configure your LLM provider keys and preferences</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 text-brand-400 hover:text-brand-700 rounded-lg hover:bg-brand-100/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Provider Selection */}
          <div>
            <label className="block font-semibold text-brand-900 mb-2">Active LLM Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveProvider("gemini")}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                  activeProvider === "gemini"
                    ? "border-copper-400 bg-copper-50/60 ring-2 ring-copper-400/20 text-brand-950"
                    : "border-brand-200 bg-white hover:bg-brand-50/50 text-brand-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold flex items-center gap-1.5">
                    Google Gemini
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-copper-200/80 text-copper-900">
                    Default
                  </span>
                </div>
                <span className="text-xs text-brand-500">Strict JSON schema, ultra-fast generation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProvider("openai")}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                  activeProvider === "openai"
                    ? "border-copper-400 bg-copper-50/60 ring-2 ring-copper-400/20 text-brand-950"
                    : "border-brand-200 bg-white hover:bg-brand-50/50 text-brand-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">OpenAI</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-100 text-brand-600">
                    Optional
                  </span>
                </div>
                <span className="text-xs text-brand-500">GPT-4o / GPT-4o-mini structured output</span>
              </button>
            </div>
          </div>

          {/* Google Gemini Settings */}
          <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-900 flex items-center gap-2">
                Google Gemini API Key
                {process.env.NEXT_PUBLIC_GEMINI_API_KEY && geminiKey === process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    .env configured
                  </span>
                )}
                {serverConfig?.hasServerGeminiKey && !geminiKey && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    Server configured
                  </span>
                )}
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-copper-700 hover:text-copper-800 font-medium flex items-center gap-1 hover:underline"
              >
                Get Free API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder={serverConfig?.hasServerGeminiKey ? "Using secret server key (enter to override)" : "AIzaSy..."}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-brand-950 focus:outline-none focus:ring-2 focus:ring-copper-400 font-mono text-xs"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-brand-500">Model:</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="text-xs bg-white border border-brand-300 rounded-md px-2 py-1 text-brand-800 focus:ring-1 focus:ring-copper-400 font-medium"
                >
                  <option value="gemini-flash-lite-latest">Gemini Flash-Lite Latest (Cheapest)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini || !geminiKey}
                className="text-xs px-2.5 py-1 rounded bg-copper-200 hover:bg-copper-300 disabled:opacity-50 text-copper-900 font-semibold transition-colors"
              >
                {testingGemini ? "Testing..." : "Test Key"}
              </button>
            </div>

            {geminiTestStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  geminiTestStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {geminiTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{geminiTestStatus.message}</span>
              </div>
            )}
          </div>

          {/* OpenAI Settings */}
          <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-900 flex items-center gap-2">
                OpenAI API Key (Optional)
                {process.env.NEXT_PUBLIC_OPENAI_API_KEY && openaiKey === process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    .env configured
                  </span>
                )}
                {serverConfig?.hasServerOpenAiKey && !openaiKey && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    Server configured
                  </span>
                )}
              </span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-copper-700 hover:text-copper-800 font-medium flex items-center gap-1 hover:underline"
              >
                Get OpenAI Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder={serverConfig?.hasServerOpenAiKey ? "Using secret server key (enter to override)" : "sk-proj-..."}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg text-brand-950 focus:outline-none focus:ring-2 focus:ring-copper-400 font-mono text-xs"
            />

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleTestOpenAi}
                disabled={testingOpenAi || !openaiKey}
                className="text-xs px-2.5 py-1 rounded bg-copper-200 hover:bg-copper-300 disabled:opacity-50 text-copper-900 font-semibold transition-colors"
              >
                {testingOpenAi ? "Testing..." : "Test Key"}
              </button>
            </div>

            {openaiTestStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  openaiTestStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {openaiTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{openaiTestStatus.message}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-brand-400 leading-relaxed">
            🔒 <strong>Privacy Note:</strong> Your API keys are saved directly into your browser&apos;s local storage and used purely on the client side. They are never sent to any intermediary server.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-100 bg-brand-50/70">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 rounded-xl text-brand-600 hover:bg-brand-200/60 font-medium text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-copper-400 hover:bg-copper-500 active:scale-95 text-brand-950 font-bold text-xs transition-all shadow-sm shadow-copper-500/20"
          >
            {savedToast ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};
