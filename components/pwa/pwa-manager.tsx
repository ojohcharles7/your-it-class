"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "yitc-install-dismissed";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaManager() {
  const pathname = usePathname();
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const iosTimer = isIos() ? window.setTimeout(() => setVisible(true), 4500) : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
    setPromptEvent(null);
  };

  if (!visible || pathname.startsWith("/admin") || pathname.startsWith("/payment")) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Your IT Class"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md pb-[env(safe-area-inset-bottom)] sm:bottom-5"
    >
      <div className="glass-strong flex items-center gap-3 rounded-2xl p-3 shadow-2xl">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Your IT Class</p>
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            {promptEvent ? "Learn on the go, straight from your home screen." : "Tap Share, then Add to Home Screen."}
          </p>
        </div>
        {promptEvent ? (
          <button type="button" onClick={install} className="btn btn-primary shrink-0 px-3 text-xs">
            <Download size={14} />
            Install
          </button>
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]" aria-hidden>
            <Share size={16} />
          </span>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="btn btn-ghost icon-btn shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
