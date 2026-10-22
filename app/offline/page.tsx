import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="wrap flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
        <WifiOff size={30} />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">You&apos;re offline</h1>
      <p className="mt-3 max-w-md text-[var(--muted)]">
        Your internet connection dropped. Reconnect to keep learning — your progress is saved to your account.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Try again
          <ArrowRight size={15} />
        </Link>
        <Link href="/courses" className="btn">
          Browse courses
        </Link>
      </div>
    </main>
  );
}
