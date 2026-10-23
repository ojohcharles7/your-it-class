import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp, Wallet } from "lucide-react";
import { InteractiveBarChart } from "@/components/charts/interactive-bar-chart";
import { requireInstructor } from "@/lib/auth";
import {
  getInstructorAvailableBalance,
  getInstructorEarnings,
  getInstructorProfile,
  getTeacherCourses,
} from "@/lib/data";
import { formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function InstructorEarningsPage() {
  const current = await requireInstructor();
  const [profile, balance, earnings, classes] = await Promise.all([
    getInstructorProfile(current.id),
    getInstructorAvailableBalance(current.id),
    getInstructorEarnings(current.id),
    getTeacherCourses(current.id),
  ]);

  const lifetime = earnings.reduce((sum, row) => sum + row.amountKobo, 0);
  const gross = earnings.reduce((sum, row) => sum + row.grossKobo, 0);
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthEarnings = earnings
    .filter((row) => new Date(row.createdAt) >= thisMonth)
    .reduce((sum, row) => sum + row.amountKobo, 0);

  const byCourse = classes
    .filter((course) => course.isOwner)
    .map((course) => ({
      label: course.title,
      value: earnings.filter((row) => row.courseId === course.id).reduce((sum, row) => sum + row.amountKobo, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Studio</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Earnings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Your share of every successful course payment, recorded automatically.
          </p>
        </div>
        <Link href="/instructor/payouts" className="btn btn-primary btn-sm self-start sm:self-auto">
          Request a payout <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Available balance", value: naira(balance), hint: "Ready to request" },
          { label: "Lifetime earnings", value: naira(lifetime), hint: `${profile?.revenueSharePercent ?? 60}% share` },
          { label: "This month", value: naira(monthEarnings), hint: "Instructor share" },
          { label: "Gross course sales", value: naira(gross), hint: "Before your share" },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <Wallet size={16} />
            </span>
            <p className="mt-3 text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      {!profile && (
        <div className="admin-card flex flex-wrap items-center gap-3 p-4">
          <p className="min-w-0 flex-1 text-xs text-[var(--muted)]">
            Add your instructor profile and bank details before requesting a payout.
          </p>
          <Link href="/instructor/profile" className="btn btn-sm">Set up profile</Link>
        </div>
      )}

      {byCourse.length > 0 && (
        <section className="admin-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={17} className="text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold">Earnings by course</h2>
              <p className="text-[11px] text-[var(--muted)]">Your share, not gross sales.</p>
            </div>
          </div>
          <div className="mt-5">
            <InteractiveBarChart
              labels={byCourse.map((row) => row.label)}
              series={[{ name: "Instructor earnings", color: "var(--accent)", values: byCourse.map((row) => row.value) }]}
              height={220}
            />
          </div>
        </section>
      )}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[var(--line)] p-4">
          <h2 className="text-sm font-semibold">Earnings ledger</h2>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">One row per successful payment. Share percentages are snapshotted.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[760px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Gross sale</th>
                <th>Share</th>
                <th>Your earning</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((row) => (
                <tr key={row.id}>
                  <td className="text-[11px] text-[var(--muted)]">{formatDate(row.createdAt)}</td>
                  <td className="font-medium">{row.courseTitle ?? "Course"}</td>
                  <td>{naira(row.grossKobo)}</td>
                  <td><span className="badge badge-accent">{row.sharePercent}%</span></td>
                  <td className="font-semibold">{naira(row.amountKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {earnings.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Wallet size={22} className="mx-auto text-[var(--muted)]" />
            <p className="mt-2 text-sm font-semibold">No earnings yet</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Successful course payments will appear here automatically.</p>
          </div>
        )}
      </section>
    </div>
  );
}
