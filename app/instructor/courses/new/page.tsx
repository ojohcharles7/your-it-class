import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { saveInstructorCourseAction } from "@/app/instructor/actions";
import { requireInstructor } from "@/lib/auth";

export const metadata: Metadata = { title: "New course" };
export const dynamic = "force-dynamic";

export default async function NewInstructorCoursePage() {
  await requireInstructor();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/instructor/courses" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
          <ChevronLeft size={14} /> Back to my courses
        </Link>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Studio</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Create a course</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Save the course first, then add lessons, handouts and a final exam.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="admin-card p-5 sm:p-6">
          <CourseForm
            action={saveInstructorCourseAction}
            basePath="/instructor/courses"
            canPublish={false}
          />
        </div>
        <aside className="admin-card h-fit p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <Sparkles size={18} />
          </span>
          <h2 className="mt-3 text-sm font-semibold">Publishing checklist</h2>
          <ol className="mt-3 space-y-3 text-xs text-[var(--muted)]">
            {[
              "Add a clear title, description and at least three outcomes.",
              "Choose a category, level and price in naira.",
              "Save, then upload at least one lesson.",
              "Create the final exam and add questions.",
              "Submit the course for admin approval.",
            ].map((item, index) => (
              <li key={item} className="flex gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[10px] font-bold text-[var(--accent)]">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
