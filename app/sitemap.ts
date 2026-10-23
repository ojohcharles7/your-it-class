import type { MetadataRoute } from "next";
import { getCourses, getInstructors } from "@/lib/data";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, instructors] = await Promise.all([
    getCourses(),
    isSupabaseConfigured ? getInstructors() : Promise.resolve([]),
  ]);
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/instructors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/become-an-instructor`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/verify`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/refunds`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...courses.map((course) => ({
      url: `${siteUrl}/courses/${course.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...instructors
      .filter((instructor) => instructor.isPublic)
      .map((instructor) => ({
        url: `${siteUrl}/instructors/${instructor.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
