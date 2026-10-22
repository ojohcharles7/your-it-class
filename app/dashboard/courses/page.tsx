import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass } from "lucide-react";
import { EnrolledCourseCard } from "@/components/dashboard/enrolled-course-card";
import { requireUser } from "@/lib/auth";
import { getEnrolledCourses } from "@/lib/data";

export const metadata: Metadata = { title: "My courses" };
export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const current = await requireUser("/dashboard/courses");
  const courses = await getEnrolledCourses(current.id);
  const completed = courses.filter((course) => course.progress === 100).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Library</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight">My courses</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {courses.length} enrolled · {completed} completed · {courses.length - completed} in progress
          </p>
        </div>
        <Link href="/courses" className="btn">
          <Compass size={15} /> Find another course
        </Link>
      </div>

      {courses.length ? (
        <div className="grid gap-3">
          {courses.map((course) => (
            <EnrolledCourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="glass p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <BookOpen size={26} />
          </span>
          <h2 className="mt-4 text-xl font-semibold">No courses yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Browse the catalogue and enrol in your first course to see it here.
          </p>
          <Link href="/courses" className="btn btn-primary mt-5">Browse courses</Link>
        </div>
      )}
    </div>
  );
}
