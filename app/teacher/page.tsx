import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, GraduationCap, Plus, TrendingUp, Users, Wallet } from "lucide-react";
import { InteractiveBarChart } from "@/components/charts/interactive-bar-chart";
import { InteractiveDonut } from "@/components/charts/interactive-donut";
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
  const completionRate = percent(completed, paidStudents);
  const firstName = (current.profile.fullName || "Teacher").split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Teaching desk</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {firstName}.</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            These are the classes assigned to you and the learners who paid for them.
          </p>
        </div>
        <Link href="/teacher/studio/new" className="btn btn-primary btn-sm self-start sm:self-auto">
          <Plus size={14} /> Add a class
        </Link>
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

      {classes.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp size={17} className="text-[var(--accent)]" /> Class performance
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">Paid learners and completions per class</p>
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
              Hover or tap a slice to inspect how your learners are progressing.
            </p>
          </section>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">My classes</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Open a class to see the students who applied for it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher/studio" className="btn btn-sm">
            <Clapperboard size={13} /> Course studio
          </Link>
          <Link href="/teacher/students" className="btn btn-sm">
            All students <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="admin-card px-6 py-14 text-center">
          <BookOpen size={24} className="mx-auto text-[var(--muted)]" />
          <h2 className="mt-3 text-sm font-semibold">No classes yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
            Create a class in your course studio, or wait for an admin to assign one to you.
          </p>
          <Link href="/teacher/studio/new" className="btn btn-primary btn-sm mt-4">
            <Plus size={14} /> Create a class
          </Link>
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
