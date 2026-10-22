import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Users, Wallet } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { getTeacherCourses } from "@/lib/data";
import { naira, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherOverviewPage() {
  const current = await requireTeacher();
  const classes = await getTeacherCourses(current.id);

  const paidStudents = classes.reduce((sum, course) => sum + course.paidStudents, 0);
  const revenue = classes.reduce((sum, course) => sum + course.revenueKobo, 0);
  const completed = classes.reduce((sum, course) => sum + course.completedStudents, 0);
  const firstName = (current.profile.fullName || "Teacher").split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Teaching desk</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {firstName}.</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          These are the classes assigned to you and the learners who paid for them.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "My classes", value: classes.length, icon: BookOpen, hint: "Assigned by admin" },
          { label: "Paid learners", value: paidStudents, icon: Users, hint: "Across your classes" },
          { label: "Revenue", value: naira(revenue), icon: Wallet, hint: "From your learners" },
          { label: "Completions", value: completed, icon: GraduationCap, hint: "Finished a class" },
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

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">My classes</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Open a class to see the students who applied for it.</p>
        </div>
        <Link href="/teacher/students" className="btn btn-sm">
          All students <ArrowRight size={13} />
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="admin-card px-6 py-14 text-center">
          <BookOpen size={24} className="mx-auto text-[var(--muted)]" />
          <h2 className="mt-3 text-sm font-semibold">No classes assigned yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
            Your admin has not assigned a subject to you yet. Once they do, your classes and the students who paid for
            them will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((course) => (
            <Link
              key={course.id}
              href={`/teacher/students?course=${course.id}`}
              className="admin-card admin-card-hover group p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg"
                  style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
                >
                  {course.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{course.title}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">{course.category} · {course.level}</p>
                </div>
                <ArrowRight size={15} className="shrink-0 text-[var(--muted)] transition group-hover:text-[var(--accent)]" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-3 text-center">
                <div>
                  <p className="text-sm font-bold">{course.paidStudents}</p>
                  <p className="text-[10px] text-[var(--muted)]">Paid students</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{naira(course.revenueKobo)}</p>
                  <p className="text-[10px] text-[var(--muted)]">Revenue</p>
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
    </div>
  );
}
