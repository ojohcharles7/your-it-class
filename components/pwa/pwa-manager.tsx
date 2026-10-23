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
const INSTALL_PROMPT_ENABLED = process.env.NODE_ENV === "production";
const SERVICE_WORKER_ENABLED = process.env.NODE_ENV === "production";

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

    if (!SERVICE_WORKER_ENABLED) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    if (!INSTALL_PROMPT_ENABLED || isStandalone()) return;

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
    <>
      <div aria-hidden className="h-24 sm:h-20" />
      <div
        role="dialog"
        aria-label="Install Your IT Class"
        className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md pb-[env(safe-area-inset-bottom)] sm:bottom-5"
      >
        <div className="glass-strong flex items-center gap-2.5 rounded-2xl p-3 shadow-2xl">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Install Your IT Class</p>
            <p className="truncate text-[11px] leading-relaxed text-[var(--muted)]">
              {promptEvent ? "Learn on the go" : "Tap Share, then Add to Home Screen"}
            </p>
          </div>
          {promptEvent ? (
            <button type="button" onClick={install} className="btn btn-primary shrink-0 px-2.5 py-2 text-[11px]">
              <Download size={13} />
              Install
            </button>
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]" aria-hidden>
              <Share size={15} />
            </span>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] hover:text-[var(--ink)]"
            aria-label="Dismiss install prompt"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
