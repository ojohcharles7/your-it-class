import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCertificates } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const current = await requireUser("/dashboard/certificates");
  const certificates = await getCertificates(current.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Achievements</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Certificates</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Complete a course and pass its final exam to earn a certificate with a unique verification serial.
        </p>
      </div>

      {certificates.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="glass overflow-hidden">
              <div className="relative bg-gradient-to-br from-[#0a84ff] via-[#6d5efc] to-[#ff375f] p-5 text-white">
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <span className="badge bg-white/20 text-white">Certificate</span>
                  <Award size={22} />
                </div>
                <p className="relative mt-6 text-lg font-bold leading-snug">{certificate.courseTitle}</p>
                <p className="relative mt-1 text-xs text-white/80">Issued {formatDate(certificate.issuedAt)}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Serial</p>
                    <p className="font-mono text-xs font-semibold">{certificate.serial}</p>
                  </div>
                  <BadgeCheck size={20} className="text-[var(--success)]" />
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/certificate/${certificate.serial}`} className="btn btn-primary btn-sm flex-1">
                    View &amp; print
                  </Link>
                  <Link href={`/verify/${certificate.serial}`} className="btn btn-sm">
                    <ShieldCheck size={14} /> Verify
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]">
            <Award size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No certificates yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">
            Finish all lessons in a course, then pass the final exam. Your certificate is issued automatically.
          </p>
          <Link href="/dashboard/courses" className="btn btn-primary mt-4">Go to my courses</Link>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <ExternalLink size={13} /> Anyone can confirm a certificate at learnhub.com/verify using its serial.
      </p>
    </div>
  );
}
