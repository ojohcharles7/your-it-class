import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { VerifyForm } from "@/components/verify/verify-form";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Confirm the authenticity of a Your IT Class certificate using its unique serial number.",
};

export default function VerifyPage() {
  return (
    <div className="wrap py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
            <ShieldCheck size={27} />
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Verify a certificate</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Every Your IT Class certificate has a unique serial number. Enter it below to confirm the holder, course
            and issue date.
          </p>
        </div>

        <div className="mt-7">
          <VerifyForm />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { title: "Unique serial", text: "Each certificate is issued once per learner and course." },
            { title: "Instant check", text: "Results are pulled directly from our records." },
            { title: "Shareable", text: "Send the verification link with your CV or portfolio." },
          ].map((item) => (
            <div key={item.title} className="glass p-4">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Are you a graduate?{" "}
          <Link href="/dashboard/certificates" className="text-[var(--accent)] hover:underline">
            Find your certificate serial
          </Link>
        </p>
      </div>
    </div>
  );
}
