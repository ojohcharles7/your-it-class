import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { Award, Download, ExternalLink, Printer, Search, ShieldCheck } from "lucide-react";
import { CopyButton } from "@/components/admin/copy-button";
import { LocalEmptyPage } from "@/components/admin/local-empty-page";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

type CertificateRow = {
  id: string;
  serial: string;
  user_id: string;
  course_id: string;
  issued_at: string;
};

type Filters = { q?: string };

export default async function AdminCertificatesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!isSupabaseAdminConfigured) {
    return (
      <LocalEmptyPage
        eyebrow="Credentials"
        title="Certificates"
        description="Every verified credential issued by the academy."
        banner="Certificates are issued after a server-scored exam and stored in Supabase. Connect your project to build the live registry."
        stats={[
          { label: "Issued", value: 0, hint: "No live credentials", icon: Award },
          { label: "This month", value: 0, hint: "Awaiting Supabase", icon: ShieldCheck },
          { label: "Unique graduates", value: 0, hint: "No local records", icon: Award },
        ]}
        columns={["Serial", "Student", "Course", "Issued", "Actions"]}
        emptyTitle="No certificates in local mode"
        emptyDescription="Once learners complete every lesson and pass the final exam, their verifiable certificate serials appear here."
      />
    );
  }

  const admin = createSupabaseAdminClient();
  const [{ data: certificateRows }, { data: profileRows }, { data: courseRows }] = await Promise.all([
    admin.from("certificates").select("*").order("issued_at", { ascending: false }),
    admin.from("profiles").select("id, full_name"),
    admin.from("courses").select("id, title, emoji"),
  ]);

  const certificates = (certificateRows ?? []) as CertificateRow[];
  const names = new Map((profileRows ?? []).map((profile) => [profile.id, profile.full_name as string | null]));
  const courses = new Map((courseRows ?? []).map((course) => [course.id, course as { title: string; emoji: string }]));

  const filtered = certificates.filter((certificate) => {
    const name = names.get(certificate.user_id) || "Student";
    const course = courses.get(certificate.course_id);
    return `${certificate.serial} ${name} ${course?.title ?? ""}`.toLowerCase().includes(query.toLowerCase());
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = certificates.filter((certificate) => new Date(certificate.issued_at) >= monthStart).length;
  const uniqueStudents = new Set(certificates.map((certificate) => certificate.user_id)).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Credentials</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Certificates</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Every verified credential issued by the academy.</p>
        </div>
        <Link href="/admin/export?type=certificates" className="btn btn-sm self-start sm:self-auto">
          <Download size={14} /> Export registry
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Issued", value: certificates.length, hint: "Verifiable credentials", icon: Award },
          { label: "This month", value: thisMonth, hint: "New certificates", icon: ShieldCheck },
          { label: "Unique graduates", value: uniqueStudents, hint: "Students certified", icon: Award },
        ].map((stat) => (
          <div key={stat.label} className="admin-card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]">
              <stat.icon size={17} />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">{stat.value.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
              <p className="text-[10px] text-[var(--muted)]">{stat.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="px-1 text-xs font-semibold text-[var(--muted)]">
            {filtered.length} certificate{filtered.length === 1 ? "" : "s"}
          </p>
          <form action="/admin/certificates" className="flex w-full gap-2 sm:w-auto">
            <label className="relative flex-1 sm:w-72">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search serial, student or course…"
                className="input h-9 py-0 pl-8 text-xs"
                aria-label="Search certificates"
              />
            </label>
            <button type="submit" className="btn btn-sm">Search</button>
            {query && <Link href="/admin/certificates" className="btn btn-ghost btn-sm">Clear</Link>}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[820px]">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Student</th>
                <th>Course</th>
                <th>Issued</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((certificate) => {
                const name = names.get(certificate.user_id) || "Student";
                const course = courses.get(certificate.course_id);
                return (
                  <tr key={certificate.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold">{certificate.serial}</span>
                        <CopyButton value={certificate.serial} label="Copy serial" />
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                          {initials(name)}
                        </span>
                        <span className="font-semibold">{name}</span>
                      </div>
                    </td>
                    <td>{course ? `${course.emoji} ${course.title}` : "Course"}</td>
                    <td className="text-[var(--muted)]">{formatDate(certificate.issued_at)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/verify/${certificate.serial}`} target="_blank" className="btn btn-sm">
                          <ShieldCheck size={13} /> Verify
                        </Link>
                        <Link href={`/certificate/${certificate.serial}`} target="_blank" className="btn icon-btn btn-sm" title="Open certificate">
                          <ExternalLink size={13} />
                        </Link>
                        <Link href={`/certificate/${certificate.serial}`} target="_blank" className="btn icon-btn btn-sm" title="Print certificate">
                          <Printer size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Award size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">{certificates.length === 0 ? "No certificates issued yet" : "No matching certificates"}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {certificates.length === 0
                ? "Certificates appear here when students pass their final exam and complete every lesson."
                : "Try a different serial, student or course name."}
            </p>
            {certificates.length > 0 && <Link href="/admin/certificates" className="btn btn-sm mt-4">Reset search</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
