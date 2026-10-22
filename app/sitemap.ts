import type { MetadataRoute } from "next";
import { getCourses } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getCourses();
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
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
  ];
}
