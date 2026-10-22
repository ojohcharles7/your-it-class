import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  BadgeCheck,
  CircleAlert,
  CircleCheck,
  Clock3,
  CreditCard,
  Download,
  GraduationCap,
  Minus,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { CompletionDonut, RevenueAreaChart, Sparkline } from "@/components/admin/charts";
import { LocalAdminOverview } from "@/components/admin/local-overview";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { formatDate, initials, naira, percent, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  emoji: string;
  gradient: string;
  category: string;
  price_kobo: number;
  published: boolean;
  created_at: string;
  lessons: { count: number }[] | null;
  enrollments: { count: number }[] | null;
};

type ProfileRow = { id: string; full_name: string | null; created_at: string };

type PaymentRow = {
  id: string;
  user_id: string;
  course_id: string;
  amount_kobo: number;
  status: "pending" | "success" | "failed";
  provider: string;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "completed";
  created_at: string;
};

type CertificateRow = { id: string; user_id: string; course_id: string; issued_at: string };
type AttemptRow = { passed: boolean };
type ExamRow = { course_id: string };

type RecentEnrollmentJoin = EnrollmentRow & {
  courses: { title: string; emoji: string } | { title: string; emoji: string }[] | null;
};

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function startOfMonth(offset = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function isBetween(value: string, start: Date, end: Date) {
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
        <Minus size={10} /> 0%
      </span>
    );
  }
  const positive = value > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
        positive
          ? "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]"
          : "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
      }`}
    >
      <Icon size={11} />
      {Math.abs(value)}%
    </span>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminOverviewPage() {
  const current = await requireAdmin();

  if (!isSupabaseAdminConfigured) {
    if (current.id === "local-admin") {
      return <LocalAdminOverview name={current.profile.fullName || "Local Admin"} />;
    }

    return (
      <div className="admin-card p-8">
        <h1 className="text-xl font-bold">Admin backend not connected</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to <code className="font-mono">.env.local</code>{" "}
          to enable admin statistics and management.
        </p>
      </div>
    );
  }

  const admin = createSupabaseAdminClient();
  const [
    { data: courseRows },
    { data: profileRows },
    { data: paymentRows },
    { data: enrollmentRows },
    { data: certificateRows },
    { data: attemptRows },
    { data: examRows },
    { data: recentEnrollmentRows },
  ] = await Promise.all([
    admin.from("courses").select("*, lessons(count), enrollments(count)").order("created_at", { ascending: true }),
    admin.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
    admin.from("payments").select("id, user_id, course_id, amount_kobo, status, provider, created_at").order("created_at", { ascending: false }),
    admin.from("enrollments").select("id, user_id, course_id, status, created_at"),
    admin.from("certificates").select("id, user_id, course_id, issued_at"),
    admin.from("exam_attempts").select("passed"),
    admin.from("exams").select("course_id"),
    admin.from("enrollments").select("*, courses(title, emoji)").order("created_at", { ascending: false }).limit(7),
  ]);

  const courses = (courseRows ?? []) as CourseRow[];
  const profiles = (profileRows ?? []) as ProfileRow[];
  const payments = (paymentRows ?? []) as PaymentRow[];
  const enrollments = (enrollmentRows ?? []) as EnrollmentRow[];
  const certificates = (certificateRows ?? []) as CertificateRow[];
  const attempts = (attemptRows ?? []) as AttemptRow[];
  const exams = (examRows ?? []) as ExamRow[];
  const recentEnrollments = (recentEnrollmentRows ?? []) as RecentEnrollmentJoin[];

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.full_name || "Student"]));
  const successful = payments.filter((payment) => payment.status === "success");
  const pending = payments.filter((payment) => payment.status === "pending");
  const revenue = successful.reduce((sum, payment) => sum + Number(payment.amount_kobo), 0);
  const completed = enrollments.filter((enrollment) => enrollment.status === "completed").length;
  const completionRate = percent(completed, enrollments.length);
  const passRate = attempts.length ? percent(attempts.filter((attempt) => attempt.passed).length, attempts.length) : 0;
  const averageOrder = successful.length ? Math.round(revenue / successful.length) : 0;
  const drafts = courses.filter((course) => !course.published);
  const coursesWithExams = new Set(exams.map((exam) => exam.course_id));
  const coursesWithoutExams = courses.filter((course) => !coursesWithExams.has(course.id));
  const coursesWithoutLessons = courses.filter((course) => (course.lessons?.[0]?.count ?? 0) === 0);

  const thisMonthStart = startOfMonth();
  const nextMonthStart = startOfMonth(1);
  const lastMonthStart = startOfMonth(-1);

  const revenueThisMonth = successful
    .filter((payment) => isBetween(payment.created_at, thisMonthStart, nextMonthStart))
    .reduce((sum, payment) => sum + Number(payment.amount_kobo), 0);
  const revenueLastMonth = successful
    .filter((payment) => isBetween(payment.created_at, lastMonthStart, thisMonthStart))
    .reduce((sum, payment) => sum + Number(payment.amount_kobo), 0);
  const studentsThisMonth = profiles.filter((profile) => isBetween(profile.created_at, thisMonthStart, nextMonthStart)).length;
  const studentsLastMonth = profiles.filter((profile) => isBetween(profile.created_at, lastMonthStart, thisMonthStart)).length;
  const enrollmentsThisMonth = enrollments.filter((enrollment) => isBetween(enrollment.created_at, thisMonthStart, nextMonthStart)).length;
  const enrollmentsLastMonth = enrollments.filter((enrollment) => isBetween(enrollment.created_at, lastMonthStart, thisMonthStart)).length;

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-NG", { month: "short" }),
      revenue: 0,
      students: 0,
      enrollments: 0,
      certificates: 0,
    };
  });

  const bucketFor = (value: string) => {
    const date = new Date(value);
    return months.find((month) => month.key === `${date.getFullYear()}-${date.getMonth()}`);
  };

  for (const payment of successful) {
    const bucket = bucketFor(payment.created_at);
    if (bucket) bucket.revenue += Number(payment.amount_kobo);
  }
  for (const profile of profiles) {
    const bucket = bucketFor(profile.created_at);
    if (bucket) bucket.students += 1;
  }
  for (const enrollment of enrollments) {
    const bucket = bucketFor(enrollment.created_at);
    if (bucket) bucket.enrollments += 1;
  }
  for (const certificate of certificates) {
    const bucket = bucketFor(certificate.issued_at);
    if (bucket) bucket.certificates += 1;
  }

  const stats = [
    {
      label: "Total revenue",
      value: naira(revenue),
      sub: `${naira(revenueThisMonth)} this month`,
      delta: change(revenueThisMonth, revenueLastMonth),
      icon: Wallet,
      href: "/admin/payments",
      tone: "text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
      spark: "text-[var(--success)]",
      series: months.map((month) => month.revenue),
    },
    {
      label: "Students",
      value: profiles.length.toLocaleString(),
      sub: `${studentsThisMonth} joined this month`,
      delta: change(studentsThisMonth, studentsLastMonth),
      icon: Users,
      href: "/admin/students",
      tone: "text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]",
      spark: "text-[var(--accent)]",
      series: months.map((month) => month.students),
    },
    {
      label: "Enrolments",
      value: enrollments.length.toLocaleString(),
      sub: `${enrollmentsThisMonth} this month`,
      delta: change(enrollmentsThisMonth, enrollmentsLastMonth),
      icon: GraduationCap,
      href: "/admin/students",
      tone: "text-[var(--accent-2)] bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)]",
      spark: "text-[var(--accent-2)]",
      series: months.map((month) => month.enrollments),
    },
    {
      label: "Completion rate",
      value: `${completionRate}%`,
      sub: `${certificates.length} certificates issued`,
      delta: null,
      icon: Award,
      href: "/admin/certificates",
      tone: "text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
      spark: "text-[var(--warning)]",
      series: months.map((month) => month.certificates),
    },
  ];

  const revenueByCourse = new Map<string, number>();
  for (const payment of successful) {
    revenueByCourse.set(payment.course_id, (revenueByCourse.get(payment.course_id) ?? 0) + Number(payment.amount_kobo));
  }
  const enrollmentByCourse = new Map<string, { total: number; completed: number }>();
  for (const enrollment of enrollments) {
    const entry = enrollmentByCourse.get(enrollment.course_id) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (enrollment.status === "completed") entry.completed += 1;
    enrollmentByCourse.set(enrollment.course_id, entry);
  }

  const topCourses = [...courses]
    .sort((a, b) => (b.enrollments?.[0]?.count ?? 0) - (a.enrollments?.[0]?.count ?? 0))
    .slice(0, 5);

  const attention = [
    {
      label: "Pending payments",
      value: pending.length,
      href: "/admin/payments",
      done: pending.length === 0,
    },
    {
      label: "Draft courses",
      value: drafts.length,
      href: "/admin/courses",
      done: drafts.length === 0,
    },
    {
      label: "Courses without lessons",
      value: coursesWithoutLessons.length,
      href: "/admin/courses",
      done: coursesWithoutLessons.length === 0,
    },
    {
      label: "Courses without exams",
      value: coursesWithoutExams.length,
      href: "/admin/courses",
      done: coursesWithoutExams.length === 0,
    },
  ];

  const firstName = (current.profile.fullName || "Admin").split(/\s+/)[0];
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
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            {today}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--muted)]">
            Here is the pulse of your academy — revenue, learners and course health in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/admin/export?type=payments" className="btn btn-sm">
            <Download size={14} /> Export report
          </a>
          <Link href="/admin/courses/new" className="btn btn-primary btn-sm">
            <Plus size={15} /> New course
          </Link>
        </div>
      </div>

      {pending.length > 0 && (
        <Link
          href="/admin/payments?status=pending"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_9%,transparent)] px-4 py-2.5 text-xs text-[var(--warning)] transition hover:bg-[color-mix(in_srgb,var(--warning)_13%,transparent)]"
        >
          <CircleAlert size={15} />
          <span className="font-semibold">{pending.length} payment{pending.length === 1 ? "" : "s"} awaiting confirmation.</span>
          <span className="inline-flex items-center gap-1 font-medium">Review now <ArrowRight size={13} /></span>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="admin-card admin-card-hover group p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.tone}`}>
                <stat.icon size={18} />
              </span>
              {stat.delta === null ? (
                <span className="rounded-md bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                  All time
                </span>
              ) : (
                <Delta value={stat.delta} />
              )}
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="text-[11px] text-[var(--muted)]">{stat.sub}</p>
              <span className={stat.spark}>
                <Sparkline values={stat.series} />
              </span>
            </div>
          </Link>
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
                <h2 className="text-sm font-semibold">Revenue performance</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Successful payments across the last 6 months</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight">{naira(revenue)}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">{successful.length} successful payment{successful.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <RevenueAreaChart data={months.map((month) => ({ label: month.label, total: month.revenue }))} />

          <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">This month</p>
              <p className="mt-1 text-sm font-bold">{naira(revenueThisMonth)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Average order</p>
              <p className="mt-1 text-sm font-bold">{naira(averageOrder)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Exam pass rate</p>
              <p className="mt-1 text-sm font-bold">{attempts.length ? `${passRate}%` : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Certificates</p>
              <p className="mt-1 text-sm font-bold">{certificates.length}</p>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Learning completion</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">All-time enrolments</p>
              </div>
              <BadgeCheck size={18} className="text-[var(--success)]" />
            </div>
            <div className="mt-5">
              <CompletionDonut percent={completionRate} completed={completed} active={enrollments.length - completed} />
            </div>
          </section>

          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Needs attention</h2>
              <span className="badge badge-muted">{attention.filter((item) => !item.done).length} open</span>
            </div>
            <div className="mt-3 space-y-1">
              {attention.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs transition hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                >
                  {item.done ? (
                    <CircleCheck size={15} className="text-[var(--success)]" />
                  ) : (
                    <Clock3 size={15} className="text-[var(--warning)]" />
                  )}
                  <span className="flex-1 text-[var(--muted)]">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Course performance</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Top courses by enrolment and revenue</p>
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
                  <th>Revenue</th>
                  <th>Completion</th>
                  <th>Status</th>
                  <th className="text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((course) => {
                  const learners = course.enrollments?.[0]?.count ?? 0;
                  const courseProgress = enrollmentByCourse.get(course.id);
                  const courseCompletion = percent(courseProgress?.completed ?? 0, courseProgress?.total ?? 0);
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
                      <td className="font-semibold">{learners}</td>
                      <td className="font-semibold">{naira(revenueByCourse.get(course.id) ?? 0)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress h-1.5 w-16">
                            <span style={{ width: `${courseCompletion}%` }} />
                          </div>
                          <span className="text-[11px] text-[var(--muted)]">{courseCompletion}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${course.published ? "badge-success" : "badge-muted"}`}>
                          {course.published ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <Link href={`/admin/courses/${course.id}`} className="btn btn-sm">Edit</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {topCourses.length === 0 && (
              <div className="px-5 py-10 text-center">
                <BookOpen size={22} className="mx-auto text-[var(--muted)]" />
                <p className="mt-2 text-sm font-medium">No courses yet</p>
                <p className="text-xs text-[var(--muted)]">Create your first course to start tracking performance.</p>
                <Link href="/admin/courses/new" className="btn btn-primary btn-sm mt-3">Create course</Link>
              </div>
            )}
          </div>
        </section>

        <section className="admin-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Latest enrolments</p>
            </div>
            <GraduationCap size={17} className="text-[var(--accent)]" />
          </div>
          <div className="mt-4 space-y-3.5">
            {recentEnrollments.map((enrollment) => {
              const course = relation(enrollment.courses);
              const name = profileMap.get(enrollment.user_id) || "Student";
              return (
                <div key={enrollment.id} className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                    {initials(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{name}</p>
                    <p className="truncate text-[11px] text-[var(--muted)]">
                      Enrolled in {course?.emoji} {course?.title ?? "a course"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[var(--muted)]">{timeAgo(enrollment.created_at)}</span>
                </div>
              );
            })}
            {recentEnrollments.length === 0 && (
              <p className="py-6 text-center text-xs text-[var(--muted)]">No enrolments yet.</p>
            )}
          </div>
          <Link href="/admin/students" className="btn btn-sm mt-4 w-full">
            View all students <ArrowRight size={13} />
          </Link>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Successful payments", value: successful.length, icon: CreditCard, href: "/admin/payments", hint: "Revenue cleared" },
          { label: "Certificates issued", value: certificates.length, icon: Award, href: "/admin/certificates", hint: "Verifiable credentials" },
          { label: "Active courses", value: courses.filter((course) => course.published).length, icon: BookOpen, href: "/admin/courses", hint: "Live in catalogue" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="admin-card admin-card-hover flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <item.icon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[var(--muted)]">{item.label}</p>
              <p className="text-lg font-bold">{item.value.toLocaleString()}</p>
            </div>
            <span className="text-[10px] text-[var(--muted)]">{item.hint}</span>
          </Link>
        ))}
      </div>

      <p className="text-center text-[10px] text-[var(--muted)]">
        Data refreshed {formatDate(new Date())} · Live from Supabase
      </p>
    </div>
  );
}
