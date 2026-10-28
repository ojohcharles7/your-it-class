import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Globe, Star, Users } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { getInstructorBySlug } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = isSupabaseConfigured ? await getInstructorBySlug(slug) : null;
  const instructor = data?.instructor;
  if (!instructor) return { title: "Instructor not found" };
  return {
    title: instructor.fullName || "Instructor",
    description: instructor.headline || instructor.bio.slice(0, 150),
  };
}

export default async function InstructorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = isSupabaseConfigured ? await getInstructorBySlug(slug) : null;
  if (!data) notFound();

  const { instructor, courses } = data;
  const students = courses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0);
  const rating =
    courses.length > 0
      ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="admin-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent)] sm:h-40" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            {instructor.avatarUrl ? (
              <Image
                src={instructor.avatarUrl}
                alt=""
                width={112}
                height={112}
                unoptimized
                className="h-24 w-24 rounded-3xl border-4 border-[var(--surface-solid)] object-cover shadow-xl sm:h-28 sm:w-28"
              />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-3xl border-4 border-[var(--surface-solid)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-2xl font-bold text-white shadow-xl sm:h-28 sm:w-28">
                {initials(instructor.fullName || "Instructor")}
              </span>
            )}
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{instructor.fullName}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {instructor.headline || "Instructor at LearnHub"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              {instructor.website && (
                <a href={instructor.website} target="_blank" rel="noreferrer" className="btn btn-sm">
                  <Globe size={14} /> Website
                </a>
              )}
              <Link href="/courses" className="btn btn-ghost btn-sm">
                Browse courses <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { label: "Courses", value: courses.length, icon: BookOpen },
              { label: "Students", value: students, icon: Users },
              { label: "Avg rating", value: rating ? rating.toFixed(1) : "—", icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  <stat.icon size={11} /> {stat.label}
                </span>
                <p className="mt-1 text-lg font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <section>
          <h2 className="text-lg font-bold tracking-tight">About {instructor.fullName?.split(" ")[0] || "the instructor"}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
            {instructor.bio || "This instructor has not added a bio yet."}
          </p>

          {instructor.expertise.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {instructor.expertise.map((skill) => (
                <span key={skill} className="badge badge-muted">{skill}</span>
              ))}
            </div>
          )}
        </section>

        <aside className="admin-card p-5">
          <h2 className="text-sm font-semibold">Teaching on LearnHub</h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Every course is reviewed before it goes live. Learn at your own pace, keep lifetime access and earn a
            certificate when you finish.
          </p>
          <Link href="/become-an-instructor" className="btn btn-sm mt-4 w-full">Apply to teach</Link>
        </aside>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Courses by {instructor.fullName?.split(" ")[0] || "this instructor"}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Published courses you can start today.</p>
          </div>
          <Link href="/courses" className="text-xs font-semibold text-[var(--accent)] hover:underline">All courses</Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="admin-card mt-5 px-6 py-12 text-center">
            <BookOpen size={24} className="mx-auto text-[var(--muted)]" />
            <p className="mt-2 text-sm font-semibold">No published courses yet</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Check back soon for this instructor&apos;s first course.</p>
          </div>
        )}
      </section>
    </div>
  );
}
