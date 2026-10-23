import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { InteractiveBarChart } from "@/components/charts/interactive-bar-chart";
import { InteractiveDonut } from "@/components/charts/interactive-donut";
import { requireInstructor } from "@/lib/auth";
import {
  getInstructorAvailableBalance,
  getInstructorEarnings,
  getInstructorPayouts,
  getInstructorProfile,
  getTeacherCourses,
} from "@/lib/data";
import { naira, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  published: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
  draft: "badge-muted",
};

export default async function InstructorOverviewPage() {
  const current = await requireInstructor();
  const [classes, profile, balance, earnings, payouts] = await Promise.all([
    getTeacherCourses(current.id),
    getInstructorProfile(current.id),
    getInstructorAvailableBalance(current.id),
    getInstructorEarnings(current.id),
    getInstructorPayouts(current.id),
  ]);

  const paidStudents = classes.reduce((sum, course) => sum + course.paidStudents, 0);
  const completed = classes.reduce((sum, course) => sum + course.completedStudents, 0);
  const lifetime = earnings.reduce((sum, row) => sum + row.amountKobo, 0);
  const pendingPayouts = payouts.filter((payout) => payout.status === "pending" || payout.status === "approved").length;
  const completionRate = percent(completed, paidStudents);
  const firstName = (current.profile.fullName || "Instructor").split(/\s+/)[0];
  const pendingCourses = classes.filter((course) => course.reviewStatus === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Instructor studio</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {firstName}.</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Build your courses, grow your learners and keep track of what you have earned.
          </p>
        </div>
        <Link href="/instructor/courses/new" className="btn btn-primary btn-sm self-start sm:self-auto">
          <Plus size={14} /> New course
        </Link>
      </div>

      {!profile && (
        <div className="admin-card flex flex-wrap items-center gap-3 border-amber-300/30 p-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/15 text-amber-500">
            <Clock3 size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Complete your instructor profile</p>
            <p className="text-xs text-[var(--muted)]">
              Add a headline, bio and bank details before submitting a course for approval or requesting a payout.
            </p>
          </div>
          <Link href="/instructor/profile" className="btn btn-sm">
            Set up profile <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "My courses", value: classes.length, icon: BookOpen, hint: `${pendingCourses} awaiting review` },
          { label: "Paid learners", value: paidStudents, icon: Users, hint: "Across your courses" },
          { label: "Available balance", value: naira(balance), icon: Wallet, hint: `${pendingPayouts} payout request${pendingPayouts === 1 ? "" : "s"}` },
          { label: "Lifetime earnings", value: naira(lifetime), icon: TrendingUp, hint: `${profile?.revenueSharePercent ?? 60}% revenue share` },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      {classes.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp size={17} className="text-[var(--accent)]" /> Course performance
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Paid learners, completions and earnings per course</p>
              </div>
              <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-2 py-1 text-[10px] font-bold text-[var(--accent)]">
                {paidStudents} paid learner{paidStudents === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-5">
              <InteractiveBarChart
                labels={classes.map((course) => course.title)}
                series={[
                  { name: "Paid learners", color: "var(--accent)", values: classes.map((course) => course.paidStudents) },
                  { name: "Completed", color: "var(--success)", values: classes.map((course) => course.completedStudents) },
                ]}
                height={200}
              />
            </div>
          </section>

          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <GraduationCap size={17} className="text-[var(--success)]" /> Completion
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Across your paid learners</p>
              </div>
            </div>
            <div className="mt-5">
              <InteractiveDonut
                segments={[
                  { label: "Completed", value: completed, color: "var(--success)" },
                  { label: "In progress", value: Math.max(0, paidStudents - completed), color: "var(--accent)" },
                ]}
                centerValue={`${completionRate}%`}
                centerLabel="Completion"
              />
            </div>
            <p className="mt-4 border-t border-[var(--line)] pt-3 text-[10px] leading-relaxed text-[var(--muted)]">
              Keep lessons practical and add a final exam to help learners finish strongly.
            </p>
          </section>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">My courses</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Manage course details, curriculum and review status.</p>
        </div>
        <Link href="/instructor/courses" className="btn btn-sm">
          All courses <ArrowRight size={13} />
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="admin-card px-6 py-14 text-center">
          <BookOpen size={24} className="mx-auto text-[var(--muted)]" />
          <h2 className="mt-3 text-sm font-semibold">No courses yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
            Create your first course, add lessons and submit it for master approval. Once approved, learners can enrol.
          </p>
          <Link href="/instructor/courses/new" className="btn btn-primary btn-sm mt-4">
            <Plus size={14} /> Create a course
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((course) => (
            <Link key={course.id} href={`/instructor/courses/${course.id}`} className="admin-card admin-card-hover group p-4">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg"
                  style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
                >
                  {course.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{course.title}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">
                    {course.category} · {course.level}
                  </p>
                </div>
                <ArrowRight size={15} className="shrink-0 text-[var(--muted)] transition group-hover:text-[var(--accent)]" />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className={`badge ${statusStyles[course.reviewStatus ?? "draft"] ?? "badge-muted"}`}>
                  {course.reviewStatus ?? "draft"}
                </span>
                {course.isOwner ? (
                  <span className="badge badge-accent">Owner</span>
                ) : (
                  <span className="badge badge-muted">Assistant</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-3 text-center">
                <div>
                  <p className="text-sm font-bold">{course.paidStudents}</p>
                  <p className="text-[10px] text-[var(--muted)]">Learners</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{naira(course.earningsKobo)}</p>
                  <p className="text-[10px] text-[var(--muted)]">Earnings</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{percent(course.completedStudents, course.paidStudents)}%</p>
                  <p className="text-[10px] text-[var(--muted)]">Completed</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {profile && (
        <div className="admin-card flex flex-wrap items-center gap-3 p-4">
          <CheckCircle2 size={18} className="text-[var(--success)]" />
          <p className="min-w-0 flex-1 text-xs text-[var(--muted)]">
            Your public profile is {profile.isPublic ? "live" : "hidden"}. Share it with learners at{" "}
            <span className="font-semibold text-[var(--ink)]">/instructors/{profile.slug}</span>.
          </p>
          <Link href="/instructor/profile" className="btn btn-sm">Edit profile</Link>
        </div>
      )}
    </div>
  );
}
