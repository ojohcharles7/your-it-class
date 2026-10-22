import type { Metadata } from "next";
import { CourseExplorer } from "@/components/course-explorer";
import { getCategories, getCourses } from "@/lib/data";

export const metadata: Metadata = {
  title: "All courses",
  description:
    "Explore practical IT courses in programming, networking, cybersecurity, data analysis, design, hardware and digital marketing.",
};

export const revalidate = 300;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, courses, categories] = await Promise.all([searchParams, getCourses(), getCategories()]);

  return (
    <div className="wrap-wide py-12">
      <div className="mb-9 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Course catalogue</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Find your next skill</h1>
        <p className="mt-3 text-base text-[var(--muted)] sm:text-lg">
          Every course includes structured video lessons, hands-on practice, a final exam and a verifiable certificate.
        </p>
      </div>
      <CourseExplorer courses={courses} categories={categories} initialQuery={q ?? ""} />
    </div>
  );
}
