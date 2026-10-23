const courseImages: Record<string, string> = {
  "full-stack-web-development": "/images/courses/course-full-stack.webp",
  "python-for-everyone": "/images/courses/course-python.webp",
  "networking-cctv-installation": "/images/courses/course-networking.webp",
  "cybersecurity-essentials": "/images/courses/course-security.webp",
  "data-analysis-excel-sql": "/images/courses/course-data.webp",
  "ui-ux-design-masterclass": "/images/courses/course-design.webp",
  "computer-repair-maintenance": "/images/courses/course-hardware.webp",
  "digital-marketing-freelancing": "/images/courses/course-marketing.webp",
};

export function getCourseImage(slug: string) {
  return courseImages[slug] ?? null;
}
