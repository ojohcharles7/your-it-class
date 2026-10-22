import { Link } from "@/components/console-link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  CloudOff,
  DatabaseZap,
  KeyRound,
  Layers,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { RevenueAreaChart, Sparkline } from "@/components/admin/charts";
import { InteractiveBarChart } from "@/components/charts/interactive-bar-chart";
import { InteractiveDonut } from "@/components/charts/interactive-donut";
import { fixtureCourses, fixtureReviews } from "@/lib/fixtures";
import { formatDate, initials, naira, timeAgo } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const completionByCourse = [82, 71, 64, 58, 73, 66, 54, 79];
const monthlyShare = [0.08, 0.1, 0.12, 0.15, 0.2, 0.35];
const studentsShare = [0.07, 0.09, 0.11, 0.14, 0.21, 0.38];
const certificatesShare = [0.04, 0.06, 0.08, 0.11, 0.16, 0.55];

export function LocalAdminOverview({ name }: { name: string }) {
  const totalLearners = fixtureCourses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0);
  const totalLessons = fixtureCourses.reduce((sum, course) => sum + (course.lessonsCount ?? 0), 0);
  const demoRevenue = fixtureCourses.reduce(
    (sum, course) => sum + course.priceKobo * (course.studentsCount ?? 0),
    0,
  );
  const completion = 68;
  const firstName = (name || "Admin").split(/\s+/)[0];

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return {
      label: date.toLocaleDateString("en-NG", { month: "short" }),
      revenue: Math.round(demoRevenue * monthlyShare[index]),
      students: Math.round(totalLearners * studentsShare[index]),
      enrollments: Math.round(totalLearners * monthlyShare[index] * 1.35),
      certificates: Math.round(146 * certificatesShare[index]),
    };
  });

  const stats = [
    {
      label: "Demo revenue",
      value: naira(demoRevenue),
      sub: `${naira(months[5].revenue)} this month`,
      icon: Wallet,
      tone: "text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
      spark: "text-[var(--success)]",
      series: months.map((month) => month.revenue),
    },
    {
      label: "Learners",
      value: totalLearners.toLocaleString(),
      sub: `${months[5].students} joined this month`,
      icon: Users,
      tone: "text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]",
      spark: "text-[var(--accent)]",
      series: months.map((month) => month.students),
    },
    {
      label: "Courses",
      value: fixtureCourses.length.toLocaleString(),
      sub: `${totalLessons} lessons in catalogue`,
      icon: BookOpen,
      tone: "text-[var(--accent-2)] bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)]",
      spark: "text-[var(--accent-2)]",
      series: [2, 3, 4, 5, 7, 8],
    },
    {
      label: "Completion rate",
      value: `${completion}%`,
      sub: "146 certificates issued",
      icon: Award,
      tone: "text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
      spark: "text-[var(--warning)]",
      series: months.map((month) => month.certificates),
    },
  ];

  const topCourses = [...fixtureCourses]
    .sort((a, b) => (b.studentsCount ?? 0) - (a.studentsCount ?? 0))
    .slice(0, 5);

  const today = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
            {today} · local preview
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            This is the full control-center experience running on sample data. Connect Supabase when you are ready
            to go live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/courses" className="btn btn-sm">
            <BookOpen size={14} /> Preview catalogue
          </Link>
          <Link href="/admin/courses" className="btn btn-primary btn-sm">
            Explore admin <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-4 sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]">
          <CloudOff size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Local preview mode is active</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
            Analytics below are illustrative and course records come from the bundled fixtures. No database is
            connected, so management actions are read-only.
          </p>
        </div>
        <span className="badge badge-warning self-start sm:self-auto">Demo data</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.tone}`}>
                <stat.icon size={18} />
              </span>
              <span className="rounded-md bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                Demo
              </span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="text-[11px] text-[var(--muted)]">{stat.sub}</p>
              <span className={stat.spark}>
                <Sparkline values={stat.series} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="admin-card p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]">
                <TrendingUp size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Illustrative revenue</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Sample performance across the last 6 months</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight">{naira(demoRevenue)}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">Based on fixture enrolments</p>
            </div>
          </div>

          <RevenueAreaChart data={months.map((month) => ({ label: month.label, total: month.revenue }))} />

          <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">This month</p>
              <p className="mt-1 text-sm font-bold">{naira(months[5].revenue)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Lessons</p>
              <p className="mt-1 text-sm font-bold">{totalLessons}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Courses</p>
              <p className="mt-1 text-sm font-bold">{fixtureCourses.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Certificates</p>
              <p className="mt-1 text-sm font-bold">146</p>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Learning completion</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Sample cohort</p>
              </div>
              <Award size={18} className="text-[var(--success)]" />
            </div>
            <div className="mt-5">
              <InteractiveDonut
                segments={[
                  { label: "Completed", value: 146, color: "var(--success)" },
                  { label: "In progress", value: 68, color: "var(--accent)" },
                ]}
                centerValue={`${completion}%`}
                centerLabel="Completion"
              />
            </div>
            <p className="mt-4 border-t border-[var(--line)] pt-3 text-[10px] leading-relaxed text-[var(--muted)]">
              Illustrative cohort. Hover a slice to inspect the sample breakdown.
            </p>
          </section>

          <section className="admin-card p-5">
            <div className="flex items-center gap-2">
              <DatabaseZap size={17} className="text-[var(--accent)]" />
              <h2 className="text-sm font-semibold">Go live checklist</h2>
            </div>
            <ol className="mt-3 space-y-3">
              {[
                { title: "Create a Supabase project", detail: "Copy the project URL and anon key." },
                { title: "Add server keys", detail: "Set the service-role key in .env.local." },
                { title: "Run the migration", detail: "Apply the SQL in supabase/migrations." },
                { title: "Seed the catalogue", detail: "Run npm run db:seed." },
                { title: "Grant your admin account", detail: "Sign up, then run npm run grant-admin." },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[10px] font-bold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">{step.title}</span>
                    <span className="block text-[10px] text-[var(--muted)]">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-2.5 py-2 text-[10px] font-medium text-[var(--success)]">
              <CheckCircle2 size={12} /> Local mode turns off automatically after setup
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="admin-card p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                <TrendingUp size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Illustrative momentum</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Sample learners, enrolments and certificates over 6 months</p>
              </div>
            </div>
            <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-2 py-1 text-[10px] font-bold text-[var(--accent)]">
              Demo data
            </span>
          </div>

          <div className="mt-5">
            <InteractiveBarChart
              labels={months.map((month) => month.label)}
              series={[
                { name: "Learners", color: "var(--accent)", values: months.map((month) => month.students) },
                { name: "Enrolments", color: "var(--accent-2)", values: months.map((month) => month.enrollments) },
                { name: "Certificates", color: "var(--success)", values: months.map((month) => month.certificates) },
              ]}
            />
          </div>
        </section>

        <section className="admin-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Sample outcomes</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Illustrative exam passing mix</p>
            </div>
            <Award size={18} className="text-[var(--warning)]" />
          </div>
          <div className="mt-5">
            <InteractiveDonut
              segments={[
                { label: "Passed", value: 118, color: "var(--success)" },
                { label: "Needs retry", value: 28, color: "var(--warning)" },
              ]}
              centerValue="81%"
              centerLabel="Pass rate"
            />
          </div>
          <p className="mt-4 border-t border-[var(--line)] pt-3 text-[10px] leading-relaxed text-[var(--muted)]">
            Sample outcomes only. Connect Supabase to replace this with live exam results.
          </p>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Course catalogue</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Sample courses and enrolment performance</p>
            </div>
            <Link href="/admin/courses" className="btn btn-sm">
              All courses <ArrowRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Learners</th>
                  <th>Demo revenue</th>
                  <th>Completion</th>
                  <th>Status</th>
                  <th className="text-right">Preview</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((course, index) => {
                  const learners = course.studentsCount ?? 0;
                  return (
                    <tr key={course.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base"
                            style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
                          >
                            {course.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold">{course.title}</p>
                            <p className="truncate text-[11px] text-[var(--muted)]">{course.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold">{learners.toLocaleString()}</td>
                      <td className="font-semibold">{naira(course.priceKobo * learners)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress h-1.5 w-16">
                            <span style={{ width: `${completionByCourse[index] ?? 60}%` }} />
                          </div>
                          <span className="text-[11px] text-[var(--muted)]">{completionByCourse[index] ?? 60}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${course.published ? "badge-success" : "badge-muted"}`}>
                          {course.published ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-sm">
                            View <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recent learner love</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Sample reviews</p>
            </div>
            <Star size={17} className="fill-amber-400 text-amber-400" />
          </div>
          <div className="mt-4 space-y-4">
            {fixtureReviews.slice(0, 3).map((review) => {
              const course = fixtureCourses.find((item) => item.id === review.courseId);
              return (
                <div key={review.id} className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                    {initials(review.authorName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold">{review.authorName}</p>
                      <span className="shrink-0 text-[10px] text-[var(--muted)]">{timeAgo(review.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">{course?.emoji} {course?.title ?? "Course"}</p>
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, star) => (
                        <Star key={star} size={10} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { href: "/admin/courses", label: "Courses", icon: Layers },
              { href: "/admin/students", label: "Students", icon: Users },
              { href: "/admin/payments", label: "Payments", icon: Wallet },
              { href: "/admin/certificates", label: "Certificates", icon: Award },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-2.5 py-2 text-[11px] font-semibold transition hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
                <item.icon size={13} className="text-[var(--muted)]" /> {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[11px] text-[var(--muted)] sm:flex-row">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={13} className="text-[var(--accent)]" />
          Demo metrics use bundled fixtures and illustrative trends.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <KeyRound size={12} /> Connect Supabase to replace this with live data.
        </span>
      </div>

      <p className="text-center text-[10px] text-[var(--muted)]">
        Preview generated {formatDate(new Date())} · Local admin session
      </p>
    </div>
  );
}
