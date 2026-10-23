import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Check, ExternalLink, X } from "lucide-react";
import { reviewCourseAction } from "@/app/master/actions";
import { requireSuperAdmin } from "@/lib/auth";
import { getPendingCourseApprovals } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate, naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Course approvals" };
export const dynamic = "force-dynamic";

export default async function MasterApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const current = await requireSuperAdmin({ login: "/masteruser" });
  const params = await searchParams;
  const localMode = current.id === "local-admin";
  const courses = !localMode && isSupabaseConfigured ? await getPendingCourseApprovals() : [];
  const pending = courses.filter((course) => course.reviewStatus === "pending");
  const rejected = courses.filter((course) => course.reviewStatus === "rejected");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Master</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Course approvals</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Approving a course publishes it. Rejecting sends it back to the instructor with a note.
        </p>
      </div>

      {params.ok && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          {params.ok}
        </p>
      )}
      {params.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {params.error}
        </p>
      )}

      {localMode && (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-4 text-xs leading-relaxed text-[var(--warning)]">
          Local preview mode. Instructor-submitted courses will appear here once Supabase is connected.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Awaiting review", value: pending.length },
          { label: "Sent back", value: rejected.length },
          { label: "In queue", value: courses.length },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        {courses.map((course) => (
          <article key={course.id} className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl"
                  style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
                >
                  {course.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{course.title}</h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {course.instructorName || "Unassigned"} · {course.category} · {course.level}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    Submitted {formatDate(course.submittedAt)} · {course.lessonsCount ?? 0} lessons
                  </p>
                </div>
              </div>
              <span className={`badge ${course.reviewStatus === "pending" ? "badge-warning" : "badge-danger"}`}>
                {course.reviewStatus}
              </span>
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">{course.description}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <span className="text-[var(--muted)]">Price: <strong className="text-[var(--ink)]">{naira(course.priceKobo)}</strong></span>
              <span className="text-[var(--muted)]">Students: <strong className="text-[var(--ink)]">{course.studentsCount ?? 0}</strong></span>
              <span className="text-[var(--muted)]">Rating: <strong className="text-[var(--ink)]">{course.rating.toFixed(1)}</strong></span>
            </div>

            {course.reviewNote && (
              <p className="mt-3 rounded-lg bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
                Previous note: {course.reviewNote}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <form action={reviewCourseAction}>
                <input type="hidden" name="id" value={course.id} />
                <input type="hidden" name="decision" value="approve" />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Check size={14} /> Approve &amp; publish
                </button>
              </form>
              <details className="group">
                <summary className="btn btn-ghost btn-sm cursor-pointer list-none text-[var(--danger)]">
                  <X size={14} /> Send back
                </summary>
                <form action={reviewCourseAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={course.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input name="reviewNote" className="input h-9 text-xs sm:w-80" placeholder="What should the instructor fix?" required />
                  <button type="submit" className="btn btn-sm text-[var(--danger)]">Confirm</button>
                </form>
              </details>
              <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-ghost btn-sm">
                <ExternalLink size={13} /> Preview
              </Link>
            </div>
          </article>
        ))}
        {courses.length === 0 && (
          <div className="admin-card px-6 py-14 text-center">
            <BookOpenCheck size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">Nothing waiting for review</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Courses submitted by instructors will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
