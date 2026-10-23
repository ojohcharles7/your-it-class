import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Sparkles, Users } from "lucide-react";
import { getInstructors } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Instructors",
  description: "Meet the practitioners teaching practical technology courses on Your IT Class.",
};
export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const instructors = isSupabaseConfigured ? await getInstructors() : [];
  const visible = instructors.filter((instructor) => instructor.isPublic);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-2xl">
        <span className="badge badge-accent">
          <Sparkles size={11} /> Learn from practitioners
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Our instructors</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
          Working professionals who teach the tools, workflows and thinking behind real technology work.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((instructor) => (
          <Link
            key={instructor.userId}
            href={`/instructors/${instructor.slug}`}
            className="admin-card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
          >
            <div className="flex items-start gap-3">
              {instructor.avatarUrl ? (
                <Image
                  src={instructor.avatarUrl}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-base font-bold text-white">
                  {initials(instructor.fullName || "Instructor")}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold group-hover:text-[var(--accent)]">
                  {instructor.fullName || "Instructor"}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                  {instructor.headline || "Instructor at Your IT Class"}
                </p>
              </div>
            </div>

            {instructor.expertise.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {instructor.expertise.slice(0, 4).map((skill) => (
                  <span key={skill} className="badge badge-muted">{skill}</span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center gap-4 pt-5 text-[11px] text-[var(--muted)]">
              <span className="flex items-center gap-1"><BookOpen size={12} /> {instructor.courseCount ?? 0} courses</span>
              <span className="flex items-center gap-1"><Users size={12} /> {instructor.studentCount ?? 0} students</span>
              <ArrowRight size={13} className="ml-auto text-[var(--accent)] transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="admin-card mt-10 px-6 py-16 text-center">
          <GraduationCap size={28} className="mx-auto text-[var(--muted)]" />
          <h2 className="mt-3 text-lg font-semibold">Instructor profiles are coming soon</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">
            Approved instructors will appear here. If you teach technology, apply to join the catalog.
          </p>
          <Link href="/become-an-instructor" className="btn btn-primary mt-5">Apply to teach</Link>
        </div>
      )}

      <div className="admin-card mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Know something worth teaching?</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">We review applications manually and help you shape the course.</p>
        </div>
        <Link href="/become-an-instructor" className="btn btn-primary">
          Become an instructor <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
