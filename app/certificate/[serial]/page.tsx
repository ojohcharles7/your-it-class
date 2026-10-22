import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, ChevronLeft, ShieldCheck } from "lucide-react";
import { PrintButton } from "@/components/certificate/print-button";
import { getCertificateBySerial } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

type PageProps = { params: Promise<{ serial: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serial } = await params;
  return {
    title: `Certificate ${serial.toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const { serial } = await params;
  const certificate = await getCertificateBySerial(serial.toUpperCase());

  if (!certificate) {
    return (
      <div className="wrap py-16">
        <div className="glass mx-auto max-w-lg p-8 text-center">
          <Award size={30} className="mx-auto text-[var(--warning)]" />
          <h1 className="mt-4 text-xl font-bold">Certificate not found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No certificate matches the serial <span className="font-mono">{serial}</span>. Check the serial and try
            again.
          </p>
          <Link href="/verify" className="btn btn-primary mt-5">Verify a certificate</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/certificates" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          <ChevronLeft size={15} /> My certificates
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/verify/${certificate.serial}`} className="btn">
            <ShieldCheck size={15} /> Verify online
          </Link>
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-[0_20px_70px_rgba(20,30,60,0.25)] sm:p-3">
        <div className="rounded-xl border-2 border-[#c9a227] p-1">
          <div className="relative overflow-hidden rounded-lg border border-[#e8dfc4] bg-[#fffdf7] px-6 py-8 text-center text-[#12161f] sm:px-12 sm:py-12">
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#0a84ff]/5" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[#6d5efc]/5" />

            <div className="relative flex items-center justify-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0a84ff] to-[#6d5efc] text-sm font-bold text-white">
                IT
              </span>
              <div className="text-left">
                <p className="text-sm font-bold tracking-tight">Your IT Class</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a7468]">Charitech Concepts &amp; Services</p>
              </div>
            </div>

            <p className="relative mt-9 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#9b8446]">
              Certificate of Completion
            </p>
            <p className="relative mt-4 text-xs text-[#7a7468]">This certifies that</p>
            <h1 className="relative mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{certificate.studentName}</h1>
            <p className="relative mt-4 text-xs text-[#7a7468]">has successfully completed the course</p>
            <h2 className="relative mx-auto mt-2 max-w-xl text-xl font-semibold leading-snug text-[#0a4a99] sm:text-2xl">
              {certificate.courseTitle}
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-[#7a7468]">
              including all structured lessons, practical exercises and the final assessment required by Your IT Class.
            </p>

            <div className="relative mt-9 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
              <div className="text-center sm:text-left">
                <p className="font-mono text-[10px] text-[#7a7468]">{certificate.serial}</p>
                <div className="mt-1 h-px w-40 bg-[#c9a227]" />
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[#7a7468]">Certificate serial</p>
              </div>

              <div className="grid h-20 w-20 place-items-center rounded-full border border-[#c9a227] bg-[#faf3dc] text-[#9b8446]">
                <div className="text-center">
                  <Award size={22} className="mx-auto" />
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wider">Verified</p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <p className="font-[cursive] text-lg text-[#0a4a99]">Charitech</p>
                <div className="mt-1 h-px w-40 bg-[#c9a227]" />
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[#7a7468]">Programme director</p>
              </div>
            </div>

            <div className="relative mt-7 flex flex-col items-center justify-center gap-1 border-t border-[#e8dfc4] pt-4 text-[9px] text-[#9a9488] sm:flex-row sm:gap-3">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck size={11} /> Issued {formatDate(certificate.issuedAt)}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>
                Verify at <span className="font-mono">{siteUrl.replace(/^https?:\/\//, "")}/verify</span>
              </span>
            </div>
          </div>
        </div>
      </article>

      <p className="no-print mx-auto mt-4 max-w-3xl text-center text-xs leading-relaxed text-[var(--muted)]">
        Tip: use “Print / Save as PDF” and choose “Save as PDF” to download a shareable copy. The serial above can be
        checked by anyone at <Link href={`/verify/${certificate.serial}`} className="text-[var(--accent)] hover:underline">the verification page</Link>.
      </p>
    </div>
  );
}
