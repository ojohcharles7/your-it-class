"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [serial, setSerial] = useState(initial);

  return (
    <form
      className="glass flex flex-col gap-2 p-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const value = serial.trim().toUpperCase();
        if (value) router.push(`/verify/${encodeURIComponent(value)}`);
      }}
    >
      <div className="relative flex-1">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          className="input border-0 bg-transparent pl-10 focus:shadow-none"
          placeholder="e.g. LH-CYBER-8KQ2M4"
          value={serial}
          onChange={(event) => setSerial(event.target.value)}
          aria-label="Certificate serial"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Verify certificate <ArrowRight size={15} />
      </button>
    </form>
  );
}
