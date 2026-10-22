import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { ChevronLeft, CloudOff } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { LocalModeBanner } from "@/components/admin/local-mode-banner";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "New course" };
export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  await requireAdmin();

  if (!isSupabaseAdminConfigured) {
    return (
      <div className="space-y-5">
        <div>
          <Link href="/admin/courses" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
            <ChevronLeft size={14} /> Back to courses
          </Link>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Catalogue</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Create a course</h1>
        </div>

        <LocalModeBanner message="Course creation writes to Supabase, so the editor is disabled in local preview. Explore the sample catalogue or connect your project to start building." />

        <div className="admin-card mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--warning)_13%,transparent)] text-[var(--warning)]">
            <CloudOff size={22} />
          </span>
          <h2 className="mt-4 text-lg font-bold">Connect Supabase to create courses</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[var(--muted)]">
            Add your project URL, anon key and service-role key to <code className="font-mono">.env.local</code>, run
            the migration and restart the server. Local preview switches off automatically.
          </p>
          <Link href="/admin/courses" className="btn btn-primary btn-sm mt-5">Browse sample courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
          <ChevronLeft size={14} /> Back to courses
        </Link>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Catalogue</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Create a course</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Save the course first, then add lessons and the final exam.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="admin-card p-5 sm:p-6">
          <CourseForm />
        </div>
        <aside className="admin-card h-fit p-5">
          <h2 className="text-sm font-semibold">Publishing checklist</h2>
          <ol className="mt-3 space-y-3 text-xs text-[var(--muted)]">
            {[
              "Add a clear title, description and at least three outcomes.",
              "Choose a category, level and price in naira.",
              "Save, then add lessons with YouTube video IDs.",
              "Create the final exam and add pass-mark questions.",
              "Publish when the course is ready for students.",
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
