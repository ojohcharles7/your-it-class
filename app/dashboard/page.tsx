import Link from "next/link";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { EnrolledCourseCard } from "@/components/dashboard/enrolled-course-card";
import { InteractiveBarChart } from "@/components/charts/interactive-bar-chart";
import { InteractiveDonut } from "@/components/charts/interactive-donut";
import { requireUser } from "@/lib/auth";
import { getCertificates, getEnrolledCourses, getExamAttempts, getLearningActivity } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const paymentMessages: Record<string, string> = {
  failed: "That payment was not successful. You have not been charged again — try enrolling once more.",
  amount_mismatch: "The amount paid did not match the course price. Please contact support.",
  unverified: "We could not verify that payment belonged to your account.",
  not_configured: "Payments are not configured on this environment yet.",
  missing: "No payment reference was provided.",
  error: "We could not verify the payment. If you were charged, contact support with your reference.",
};

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ payment }, current] = await Promise.all([searchParams, requireUser()]);
  const [courses, attempts, certificates, activity] = await Promise.all([
    getEnrolledCourses(current.id),
    getExamAttempts(current.id),
    getCertificates(current.id),
    getLearningActivity(current.id),
  ]);

  const averageProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
    : 0;
  const completed = courses.filter((course) => course.progress === 100).length;
  const inProgress = courses.filter((course) => course.progress > 0 && course.progress < 100);
  const notStarted = courses.filter((course) => course.progress === 0).length;
  const firstName = (current.profile.fullName || "there").split(" ")[0];

  const activityDays = activity.map((day) => ({
    ...day,
    exams: attempts.filter(
      (attempt) => new Date(attempt.completedAt).toDateString() === new Date(day.date).toDateString(),
    ).length,
  }));
  const weeklyLessons = activityDays.reduce((sum, day) => sum + day.lessons, 0);

  const kpis = [
    { label: "Enrolled courses", value: courses.length, icon: BookOpen, tone: "text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" },
    { label: "Average progress", value: `${averageProgress}%`, icon: TrendingUp, tone: "text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]" },
    { label: "Courses completed", value: completed, icon: CheckCircle2, tone: "text-[var(--accent-2)] bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)]" },
    { label: "Certificates", value: certificates.length, icon: Award, tone: "text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]" },
  ];

  return (
    <div className="space-y-6">
      <div className="glass relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] blur-2xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Dashboard</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {firstName} 👋</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Pick up where you left off and keep your momentum going.</p>
            <div className="mt-4 flex gap-2">
              <Link href="/courses" className="btn">Browse courses</Link>
              {courses.length > 0 && (
                <Link href="/dashboard/courses" className="btn btn-primary">
                  My courses <ChevronRight size={15} />
                </Link>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface-solid))] p-4">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] blur-2xl" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Workspace</p>
                <p className="mt-1 text-sm font-semibold">Your learning workspace</p>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-lg">
                <GraduationCap size={17} />
              </span>
            </div>

            <p className="relative mt-3 text-[11px] text-[var(--muted)]">Lessons, exams &amp; certificates</p>

            <div className="relative mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[var(--muted)]">Course progress</span>
                <span>{averageProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                  style={{ width: `${averageProgress}%` }}
                />
              </div>
            </div>

            <div className="relative mt-3 grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[var(--accent)]" /> Secure access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} className="text-[var(--accent)]" /> 24/7 online
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[var(--success)]" /> Certified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck size={12} className="text-[var(--success)]" /> Verifiable
              </span>
            </div>
          </div>
        </div>
      </div>

      {payment && paymentMessages[payment] && (
        <div role="alert" className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_32%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3.5 text-sm text-[var(--warning)]">
          {paymentMessages[payment]}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass p-4">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpi.tone}`}>
              <kpi.icon size={17} />
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="glass p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <GraduationCap size={26} />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Your learning journey starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            You have not enrolled in a course yet. Browse the catalogue, watch a free first lesson and choose the path
            that fits your goals.
          </p>
          <Link href="/courses" className="btn btn-primary mt-5">Explore courses</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
            <section className="glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <TrendingUp size={17} className="text-[var(--accent)]" /> Learning activity
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Lessons and exams over the last 7 days</p>
                </div>
                <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-2 py-1 text-[10px] font-bold text-[var(--accent)]">
                  {weeklyLessons} lesson{weeklyLessons === 1 ? "" : "s"} this week
                </span>
              </div>
              <div className="mt-5">
                <InteractiveBarChart
                  labels={activityDays.map((day) => day.label)}
                  series={[
                    { name: "Lessons", color: "var(--accent)", values: activityDays.map((day) => day.lessons) },
                    { name: "Exams", color: "var(--accent-2)", values: activityDays.map((day) => day.exams) },
                  ]}
                  height={180}
                />
              </div>
            </section>

            <section className="glass p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Award size={17} className="text-[var(--warning)]" /> Course progress
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">Where you are across your library</p>
                </div>
              </div>
              <div className="mt-5">
                <InteractiveDonut
                  segments={[
                    { label: "Completed", value: completed, color: "var(--success)" },
                    { label: "In progress", value: inProgress.length, color: "var(--accent)" },
                    { label: "Not started", value: notStarted, color: "var(--muted)" },
                  ]}
                  centerValue={`${averageProgress}%`}
                  centerLabel="Avg progress"
                />
              </div>
              <p className="mt-4 border-t border-[var(--line)] pt-3 text-[10px] leading-relaxed text-[var(--muted)]">
                Hover or tap a slice to inspect your course mix.
              </p>
            </section>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Continue learning</h2>
              <Link href="/dashboard/courses" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {(inProgress.length ? inProgress : courses).slice(0, 4).map((course) => (
                <EnrolledCourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="glass p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <FileText size={17} className="text-[var(--accent)]" /> Recent exams
                </h2>
                <Link href="/dashboard/exams" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                  All exams
                </Link>
              </div>
              {attempts.length ? (
                <div className="space-y-2.5">
                  {attempts.slice(0, 4).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{attempt.courseTitle ?? "Final exam"}</p>
                        <p className="text-[11px] text-[var(--muted)]">{formatDate(attempt.completedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{attempt.score}/{attempt.total}</p>
                        <span className={`badge ${attempt.passed ? "badge-success" : "badge-warning"}`}>
                          {attempt.passed ? "Passed" : "Retry"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                  No exam attempts yet. Finish a course to unlock its final exam.
                </p>
              )}
            </section>

            <section className="glass p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Award size={17} className="text-[var(--warning)]" /> Certificates
                </h2>
                <Link href="/dashboard/certificates" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                  View all
                </Link>
              </div>
              {certificates.length ? (
                <div className="space-y-2.5">
                  {certificates.slice(0, 3).map((certificate) => (
                    <Link
                      key={certificate.id}
                      href={`/certificate/${certificate.serial}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3 transition-colors hover:border-[var(--accent)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{certificate.courseTitle}</p>
                        <p className="font-mono text-[11px] text-[var(--muted)]">{certificate.serial}</p>
                      </div>
                      <Award size={18} className="shrink-0 text-[var(--warning)]" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                  Complete all lessons and pass the final exam to earn your first certificate.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
