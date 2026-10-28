import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarDays, GraduationCap, ShieldCheck, ShieldX, UserRound } from "lucide-react";
import { VerifyForm } from "@/components/verify/verify-form";
import { getCertificateBySerial } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type PageProps = { params: Promise<{ serial: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serial } = await params;
  return { title: `Verification — ${serial.toUpperCase()}` };
}

export default async function VerifySerialPage({ params }: PageProps) {
  const { serial } = await params;
  const normalized = decodeURIComponent(serial).toUpperCase();
  const certificate = await getCertificateBySerial(normalized);

  return (
    <div className="wrap py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${
            certificate
              ? "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]"
              : "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
          }`}>
            {certificate ? <ShieldCheck size={27} /> : <ShieldX size={27} />}
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {certificate ? "Certificate verified" : "Certificate not found"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Serial: <span className="font-mono font-semibold text-[var(--ink)]">{normalized}</span>
          </p>
        </div>

        {certificate ? (
          <div className="glass mt-6 overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--success)] to-[var(--accent)] p-5 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck size={19} /> This is a valid LearnHub certificate.
              </div>
              <p className="mt-1 text-xs text-white/80">Recorded in our certificate registry.</p>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {[
                { icon: UserRound, label: "Awarded to", value: certificate.studentName ?? "Graduate" },
                { icon: GraduationCap, label: "Course", value: certificate.courseTitle ?? "Course" },
                { icon: CalendarDays, label: "Issued", value: formatDate(certificate.issuedAt) },
                { icon: ShieldCheck, label: "Serial", value: certificate.serial },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                    <row.icon size={16} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{row.label}</p>
                    <p className="text-sm font-semibold">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[var(--line)] p-4">
              <Link href={`/certificate/${certificate.serial}`} className="btn btn-primary flex-1">
                View full certificate
              </Link>
              <Link href="/verify" className="btn">Verify another</Link>
            </div>
          </div>
        ) : (
          <div className="glass mt-6 p-6 text-center">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              We could not find a certificate with that serial. Check for typos — serials usually look like{" "}
              <span className="font-mono">LH-PYTHON-XXXXXXXX</span>. If you believe this is an error, contact the
              learner who shared it.
            </p>
            <div className="mt-5">
              <VerifyForm initial={normalized} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
