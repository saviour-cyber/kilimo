import { useState, useEffect, useCallback } from "react";
import { Download, Smartphone, Share, Plus, CheckCircle2, MonitorPlay } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// Types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Global store for the deferred prompt
let _deferredPrompt: BeforeInstallPromptEvent | null = typeof window !== "undefined" ? (window as any)._deferredPrompt : null;
const _listeners = new Set<() => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  // Overwrite the inline script's listener with our React-aware one,
  // or catch it if it hasn't fired yet.
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    (window as any)._deferredPrompt = e;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    _deferredPrompt = null;
    (window as any)._deferredPrompt = null;
    notifyListeners();
  });
}

// Helpers
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

export const isAndroid = () => /android/i.test(navigator.userAgent);

export const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

// Custom Hook
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(!!_deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(isInStandaloneMode);

  const refresh = useCallback(() => {
    setCanInstall(!!_deferredPrompt || isIOS());
    setIsInstalled(isInStandaloneMode());
  }, []);

  useEffect(() => {
    _listeners.add(refresh);
    
    // Also listen to display-mode changes to detect install happening in real-time
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => setIsInstalled(mediaQuery.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange); // fallback for older browsers
    }

    refresh();
    
    return () => {
      _listeners.delete(refresh);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [refresh]);

  const triggerPrompt = async () => {
    if (_deferredPrompt) {
      await _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === "accepted") {
        _deferredPrompt = null;
        notifyListeners();
      }
    }
  };

  return { 
    canInstall: canInstall || isIOS(), 
    isInstalled, 
    hasNativePrompt: !!_deferredPrompt,
    isIOS: isIOS(),
    triggerPrompt 
  };
}

// --- UI Components ---

export function InstallCard() {
  const { isInstalled, hasNativePrompt, isIOS, triggerPrompt } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-emerald-900 mb-1">App is Installed</h3>
        <p className="text-sm text-emerald-700/80 max-w-sm">
          You are currently using the installed version of SproutX.
        </p>
      </div>
    );
  }

  if (hasNativePrompt) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <img src="/icon-192.png" alt="SproutX Logo" className="w-16 h-16 rounded-2xl shadow-sm border border-slate-100" />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-medium text-slate-900">Install SproutX</h3>
          <p className="text-sm text-slate-500 mt-1">Add SproutX to your home screen for a faster, full-screen experience and offline capabilities.</p>
        </div>
        <button 
          onClick={triggerPrompt}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2.5 rounded-xl transition-colors shrink-0 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <img src="/icon-192.png" alt="SproutX Logo" className="w-12 h-12 rounded-xl shadow-sm border border-slate-100" />
          <div>
            <h3 className="text-lg font-medium text-slate-900">Add to Home Screen</h3>
            <p className="text-sm text-slate-500">Install SproutX on your iOS device</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="bg-white border border-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">1</span>
            <span className="leading-relaxed">Tap the <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200"><Share className="w-3.5 h-3.5 text-blue-500" /> Share</span> button at the bottom of Safari</span>
          </div>
          <div className="flex items-start gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="bg-white border border-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">2</span>
            <span className="leading-relaxed">Scroll down and tap <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200"><Plus className="w-3.5 h-3.5" /> Add to Home Screen</span></span>
          </div>
          <div className="flex items-start gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="bg-white border border-slate-200 text-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">3</span>
            <span className="leading-relaxed">Tap <span className="font-medium text-slate-700">Add</span> in the top right corner</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: unsupported or no prompt exposed
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
          <MonitorPlay className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <h3 className="text-base font-medium text-slate-900">Browser Installation</h3>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Your current browser or device does not support automatic installation prompts. 
            However, you can usually install the app manually by opening your browser's menu (often represented by 3 dots) and selecting <strong>"Install SproutX"</strong> or <strong>"Add to Home Screen"</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function InstallSidebarButton({ collapsed }: { collapsed?: boolean }) {
  const { isInstalled, hasNativePrompt, triggerPrompt } = usePWAInstall();

  if (isInstalled) {
    return null; // Hide completely when installed to keep sidebar clean
  }

  if (hasNativePrompt) {
    return (
      <button 
        onClick={triggerPrompt}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-lg p-2 transition-colors",
          "bg-primary/10 text-primary hover:bg-primary/20",
          collapsed && "w-10 h-10 justify-center p-0"
        )}
      >
        <Download className="w-4.5 h-4.5 shrink-0" />
        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">Install App</p>
          </div>
        )}
      </button>
    );
  }

  // If no native prompt (iOS or unsupported), link to the about page for instructions
  return (
    <Link href="/settings/platform/about">
      <div className={cn(
        "flex items-center gap-2.5 w-full rounded-lg p-2 transition-colors cursor-pointer",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        collapsed && "w-10 h-10 justify-center p-0"
      )}>
        <Smartphone className="w-4.5 h-4.5 shrink-0" />
        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium truncate">Install App</p>
          </div>
        )}
      </div>
    </Link>
  );
}
