import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Search, UserCheck, Users, Wallet } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { getTeacherCourses, getTeacherStudents } from "@/lib/data";
import { formatDate, initials, naira, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "My students" };
export const dynamic = "force-dynamic";

type Filters = { course?: string; q?: string };

const paymentBadge = (status: string) =>
  status === "success" ? "badge-success" : status === "failed" ? "badge-warning" : "badge-muted";

export default async function TeacherStudentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const current = await requireTeacher();
  const filters = await searchParams;
  const query = (filters.q ?? "").trim();

  const [classes, students] = await Promise.all([getTeacherCourses(current.id), getTeacherStudents()]);
  const courseFilter = classes.some((course) => course.id === filters.course) ? filters.course! : "all";

  const filtered = students.filter((student) => {
    const matchesCourse = courseFilter === "all" || student.courseId === courseFilter;
    const haystack = `${student.fullName} ${student.email} ${student.courseTitle}`.toLowerCase();
    return matchesCourse && haystack.includes(query.toLowerCase());
  });

  const paid = students.filter((student) => student.paymentStatus === "success");
  const uniqueStudents = new Set(students.map((student) => student.userId)).size;
  const revenue = paid.reduce((sum, student) => sum + student.amountKobo, 0);

  const hrefFor = (nextCourse: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextCourse !== "all") params.set("course", nextCourse);
    const suffix = params.toString();
    return `/teacher/students${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Teaching</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">My students</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everyone who applied and paid for the classes assigned to you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Learners", value: uniqueStudents, icon: Users, hint: "Unique students" },
          { label: "Paid entries", value: paid.length, icon: UserCheck, hint: `${percent(paid.length, students.length)}% paid` },
          { label: "Revenue", value: naira(revenue), icon: Wallet, hint: "Your classes" },
          { label: "My classes", value: classes.length, icon: BookOpen, hint: "Assigned subjects" },
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

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            <Link href={hrefFor("all")} className="admin-tab" data-active={courseFilter === "all"}>
              All classes
              <span className="rounded bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-bold">
                {students.length}
              </span>
            </Link>
            {classes.map((course) => (
              <Link key={course.id} href={hrefFor(course.id)} className="admin-tab" data-active={courseFilter === course.id}>
                {course.emoji} {course.title}
              </Link>
            ))}
          </div>

          <form action="/teacher/students" className="flex w-full gap-2 lg:w-auto">
            {courseFilter !== "all" && <input type="hidden" name="course" value={courseFilter} />}
            <label className="relative flex-1 lg:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search student or class…"
                className="input h-9 py-0 pl-8 text-xs"
                aria-label="Search students"
              />
            </label>
            <button type="submit" className="btn btn-sm">Search</button>
            {query && <Link href={hrefFor(courseFilter)} className="btn btn-ghost btn-sm">Clear</Link>}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[860px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Amount paid</th>
                <th>Payment</th>
                <th>Applied</th>
                <th>Learning status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={`${student.userId}-${student.courseId}`}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[11px] font-bold text-white">
                        {initials(student.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{student.fullName}</p>
                        <p className="truncate text-[10px] text-[var(--muted)]">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link href={`/courses/${student.courseSlug}`} className="font-medium hover:text-[var(--accent)]">
                      {student.courseTitle}
                    </Link>
                  </td>
                  <td className="font-semibold">{naira(student.amountKobo)}</td>
                  <td>
                    <span className={`badge ${paymentBadge(student.paymentStatus)}`}>{student.paymentStatus}</span>
                  </td>
                  <td className="text-[11px] text-[var(--muted)]">{formatDate(student.enrolledAt)}</td>
                  <td>
                    <span className={`badge ${student.enrollmentStatus === "completed" ? "badge-success" : "badge-accent"}`}>
                      {student.enrollmentStatus === "completed" ? "Completed" : "Learning"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Users size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">
              {students.length === 0 ? "No students yet" : "No matching students"}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {students.length === 0
                ? "Students who pay for your classes will appear here automatically."
                : "Try a different class or search term."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
