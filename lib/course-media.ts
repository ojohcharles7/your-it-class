const courseImages: Record<string, string> = {
  "full-stack-web-development": "/images/courses/course-full-stack.jpg",
  "python-for-everyone": "/images/courses/course-python.jpg",
  "networking-cctv-installation": "/images/courses/course-networking.jpg",
  "cybersecurity-essentials": "/images/courses/course-security.jpg",
  "data-analysis-excel-sql": "/images/courses/course-data.jpg",
  "ui-ux-design-masterclass": "/images/courses/course-design.jpg",
  "computer-repair-maintenance": "/images/courses/course-hardware.jpg",
  "digital-marketing-freelancing": "/images/courses/course-marketing.jpg",
};

export function getCourseImage(slug: string) {
  return courseImages[slug] ?? null;
}
