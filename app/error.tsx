"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl">⚠️</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-[var(--muted)]">
        We hit an unexpected error. Try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
        <a href="/dashboard" className="btn">Dashboard</a>
      </div>
    </div>
  );
}
