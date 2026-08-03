import { useState, useEffect } from "react";
import { X, Share, Plus, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detect iOS
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

// Detect if already installed
const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isInStandaloneMode()) return;

    // Check if user already dismissed recently (24h cooldown)
    const lastDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (lastDismissed && Date.now() - Number(lastDismissed) < 24 * 60 * 60 * 1000) return;

    if (isIOS()) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => clearTimeout(timer);
    } else {
      // Listen for Android/Chrome's native prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowAndroidPrompt(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleDismiss = () => {
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa_prompt_dismissed", String(Date.now()));
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowAndroidPrompt(false);
      setDeferredPrompt(null);
    }
  };

  if (dismissed || (!showAndroidPrompt && !showIOSPrompt)) return null;

  // ── Android / Chrome prompt ──────────────────────────────────────────────
  if (showAndroidPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-center gap-4 max-w-sm mx-auto">
          <img src="/logo.png" alt="KilimoHub" className="h-12 w-12 object-contain shrink-0 rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight">Install KilimoHub</p>
            <p className="text-xs text-slate-500 mt-0.5">Add to your home screen for quick access</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleAndroidInstall}
              className="bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── iOS / Safari prompt ──────────────────────────────────────────────────
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 max-w-sm mx-auto relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="KilimoHub" className="h-10 w-10 object-contain rounded-xl" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">Install KilimoHub</p>
              <p className="text-xs text-slate-500">Add to your home screen</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>
                Tap the <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Share className="w-3.5 h-3.5 text-blue-500" /> Share
                </span> button at the bottom of your browser
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>
                Scroll down and tap <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Plus className="w-3.5 h-3.5" /> Add to Home Screen
                </span>
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>Tap <span className="font-medium text-slate-700">Add</span> to install KilimoHub on your home screen</span>
            </div>
          </div>

          {/* Arrow pointing down to Safari's share button */}
          <div className="flex justify-center mt-4">
            <div className="flex flex-col items-center gap-1 text-[#10B981]">
              <div className="w-px h-6 bg-[#10B981]/30" />
              <div className="w-2 h-2 border-b-2 border-r-2 border-[#10B981] rotate-45 mb-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
