import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import {
  getAdminCourses,
  getInstructorApplications,
  getInstructors,
  getPayoutRequests,
  getPendingCourseApprovals,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function MasterOverviewPage() {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const localMode = current.id === "local-admin";

  const configured = !localMode && isSupabaseConfigured;
  const [applications, approvals, payouts, instructors, courses] = configured
    ? await Promise.all([
        getInstructorApplications(),
        getPendingCourseApprovals(),
        getPayoutRequests(),
        getInstructors(),
        getAdminCourses(),
      ])
    : [[], [], [], [], []];

  const pendingApplications = applications.filter((row) => row.status === "pending");
  const pendingApprovals = approvals.filter((row) => row.reviewStatus === "pending");
  const pendingPayouts = payouts.filter((row) => row.status === "pending" || row.status === "approved");
  const payoutValue = pendingPayouts.reduce((sum, row) => sum + row.amountKobo, 0);
  const publishedCourses = courses.filter((course) => course.published);
  const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0);

  const stats = [
    { label: "Pending applications", value: pendingApplications.length, icon: ClipboardCheck, href: "/master/applications" },
    { label: "Courses awaiting review", value: pendingApprovals.length, icon: BookOpenCheck, href: "/master/approvals" },
    { label: "Instructors", value: instructors.length, icon: UserCog, href: "/master/instructors" },
    { label: "Learners", value: totalStudents, icon: Users, href: "/master/users" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Platform overview</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Approve instructors and courses, keep revenue shares fair, and settle payouts.
          </p>
        </div>
        <Link href="/master/applications" className="btn btn-primary btn-sm self-start sm:self-auto">
          Review applications <ArrowRight size={14} />
        </Link>
      </div>

      {localMode && (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-4 text-xs leading-relaxed text-[var(--warning)]">
          You are viewing the local master preview. Connect Supabase and sign in with a super admin account to manage
          real applications, course approvals and payouts.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="admin-card p-4 transition hover:border-[var(--line-strong)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] xl:items-start">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
            <div>
              <h2 className="text-sm font-semibold">Applications</h2>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">People waiting to teach on the platform.</p>
            </div>
            <Link href="/master/applications" className="text-[11px] font-semibold text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {applications.slice(0, 5).map((application) => (
              <div key={application.id} className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[11px] font-bold text-[var(--accent)]">
                  {application.fullName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{application.fullName}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">{application.courseTopic}</p>
                </div>
                <span className={`badge ${application.status === "pending" ? "badge-warning" : application.status === "approved" ? "badge-success" : "badge-danger"}`}>
                  {application.status}
                </span>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="px-6 py-10 text-center text-xs text-[var(--muted)]">No instructor applications yet.</div>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="admin-card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]">
              <Wallet size={17} />
            </span>
            <h2 className="mt-3 text-sm font-semibold">Payouts to settle</h2>
            <p className="mt-1 text-2xl font-bold tracking-tight">{naira(payoutValue)}</p>
            <p className="text-[11px] text-[var(--muted)]">{pendingPayouts.length} request(s) need attention.</p>
            <Link href="/master/payouts" className="btn btn-sm mt-4 w-full">Open payouts</Link>
          </section>

          <section className="admin-card p-5">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-semibold">Catalog</h2>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Published courses</dt>
                <dd className="font-semibold">{publishedCourses.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Total courses</dt>
                <dd className="font-semibold">{courses.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Pending approvals</dt>
                <dd className="font-semibold">{pendingApprovals.length}</dd>
              </div>
            </dl>
            <Link href="/master/approvals" className="btn btn-sm mt-4 w-full">Review courses</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
