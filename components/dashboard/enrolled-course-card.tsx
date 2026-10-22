import Image from "next/image";
import Link from "next/link";
import { Award, ArrowRight, CircleCheck, PlayCircle } from "lucide-react";
import type { EnrolledCourse } from "@/lib/types";
import { getCourseImage } from "@/lib/course-media";

export function EnrolledCourseCard({ course }: { course: EnrolledCourse }) {
  const complete = course.progress === 100;
  const image = getCourseImage(course.slug);

  return (
    <Link href={`/dashboard/courses/${course.slug}`} className="glass card-hover flex items-center gap-4 p-4">
      <span
        className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl"
        style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
      >
        {image ? <Image src={image} alt="" fill sizes="56px" className="object-cover" /> : course.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{course.title}</p>
          {course.certificate ? (
            <span className="badge badge-success shrink-0"><Award size={11} /> Certified</span>
          ) : complete ? (
            <span className="badge badge-accent shrink-0">Exam ready</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {course.completedLessons}/{course.lessonsCount} lessons · {course.progress}% complete
        </p>
        <div className="progress mt-2">
          <span style={{ width: `${course.progress}%` }} />
        </div>
      </div>
      <span className="hidden shrink-0 text-[var(--accent)] sm:block">
        {complete ? <CircleCheck size={20} /> : <PlayCircle size={20} />}
      </span>
      <ArrowRight size={15} className="hidden shrink-0 text-[var(--muted)] sm:block" />
    </Link>
  );
}
