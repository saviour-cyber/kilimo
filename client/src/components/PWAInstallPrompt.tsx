import { useState, useEffect, useCallback } from "react";
import { X, Share, Plus, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

const isAndroid = () => /android/i.test(navigator.userAgent);

const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true ||
  window.location.search.includes("mode=standalone");

// Global store for the deferred prompt so any component can trigger it
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
const _listeners = new Set<() => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    _deferredPrompt = null;
    notifyListeners();
  });
}

export function triggerInstall() {
  if (isIOS()) return "ios";
  if (_deferredPrompt) {
    _deferredPrompt.prompt();
    _deferredPrompt.userChoice.then(() => {
      _deferredPrompt = null;
    });
    return "android";
  }
  return "unavailable";
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(!!_deferredPrompt);
  const [isInstalled] = useState(isInStandaloneMode);

  useEffect(() => {
    const update = () => setCanInstall(!!_deferredPrompt || isIOS());
    _listeners.add(update);
    // Also check immediately
    update();
    return () => { _listeners.delete(update); };
  }, []);

  return { canInstall: canInstall || isIOS(), isInstalled, triggerInstall };
}

export function PWAInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  const refresh = useCallback(() => {
    setHasPrompt(!!_deferredPrompt);
  }, []);

  useEffect(() => {
    // Skip if already installed
    if (isInStandaloneMode()) return;

    // Skip if dismissed within 24 h
    const last = localStorage.getItem("pwa_dismissed");
    if (last && Date.now() - Number(last) < 24 * 60 * 60 * 1000) return;

    _listeners.add(refresh);
    refresh();

    // Show after 3 s so the page has loaded
    const timer = setTimeout(() => {
      if (isIOS()) {
        setShowIOSSheet(true);
      } else if (_deferredPrompt) {
        setShowBanner(true);
      }
    }, 3000);

    // Listen for future prompt availability (common on Android)
    const onPrompt = () => {
      if (!isIOS()) setShowBanner(true);
    };
    _listeners.add(onPrompt);

    return () => {
      clearTimeout(timer);
      _listeners.delete(refresh);
      _listeners.delete(onPrompt);
    };
  }, [refresh]);

  const dismiss = () => {
    setShowBanner(false);
    setShowIOSSheet(false);
    localStorage.setItem("pwa_dismissed", String(Date.now()));
  };

  const handleAndroidInstall = async () => {
    if (!_deferredPrompt) return;
    await _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === "accepted") {
      _deferredPrompt = null;
      setHasPrompt(false);
    }
    setShowBanner(false);
  };

  // ── Android / Chrome banner ─────────────────────────────────────────────
  if (showBanner && _deferredPrompt) {
    return (
      <div
        style={{ zIndex: 9999 }}
        className="fixed bottom-0 left-0 right-0 p-3 sm:p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-center gap-4 max-w-sm mx-auto"
          style={{ boxShadow: "0 -2px 24px rgba(0,0,0,0.12)" }}
        >
          <img src="/logo.png" alt="KilimoHub" className="h-12 w-12 object-contain shrink-0 rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight">Install KilimoHub</p>
            <p className="text-xs text-slate-500 mt-0.5">Add to your home screen for quick access</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={dismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
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

  // ── iOS / Safari sheet ──────────────────────────────────────────────────
  if (showIOSSheet) {
    return (
      <div
        style={{ zIndex: 9999 }}
        className="fixed bottom-0 left-0 right-0 p-3 sm:p-4"
      >
        <div
          className="bg-white rounded-2xl border border-slate-100 p-5 max-w-sm mx-auto relative"
          style={{ boxShadow: "0 -2px 24px rgba(0,0,0,0.12)" }}
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="KilimoHub" className="h-10 w-10 object-contain rounded-xl" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">Install KilimoHub</p>
              <p className="text-xs text-slate-500">Add to your Home Screen</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>Tap the <span className="inline-flex items-center gap-1 font-medium text-slate-700"><Share className="w-3.5 h-3.5 text-blue-500" /> Share</span> button at the bottom of Safari</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>Tap <span className="inline-flex items-center gap-1 font-medium text-slate-700"><Plus className="w-3.5 h-3.5" /> Add to Home Screen</span></span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>Tap <span className="font-medium text-slate-700">Add</span> to install</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
