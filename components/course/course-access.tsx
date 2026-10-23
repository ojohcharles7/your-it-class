"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import { ArrowRight, Award, BookOpen, Clock, GraduationCap, Lock, PlayCircle, ShieldCheck } from "lucide-react";
import { EnrollForm } from "@/components/course/enroll-form";
import { ReviewForm } from "@/components/course/review-form";
import { useEnrollmentStatus } from "@/components/course/use-enrollment-status";
import { naira } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

type CourseAccess = ReturnType<typeof useEnrollmentStatus>;

const CourseAccessContext = createContext<CourseAccess>({
  authenticated: false,
  enrolled: false,
  loading: true,
});

export function CourseAccessProvider({ courseId, children }: { courseId: string; children: ReactNode }) {
  const status = useEnrollmentStatus(courseId);
  return <CourseAccessContext.Provider value={status}>{children}</CourseAccessContext.Provider>;
}

function useCourseAccess() {
  return useContext(CourseAccessContext);
}

export function EnrolledBadge() {
  const { enrolled } = useCourseAccess();
  if (!enrolled) return null;

  return (
    <span className="rounded-lg bg-white/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">
      Enrolled
    </span>
  );
}

export function LessonAccess({ lesson, slug }: { lesson: Lesson; slug: string }) {
  const { enrolled, loading } = useCourseAccess();

  if (lesson.isFree) {
    return (
      <Link href="#preview" className="badge badge-success">
        Free
      </Link>
    );
  }

  if (loading) {
    return <span aria-hidden className="skeleton h-4 w-4 rounded-full" />;
  }

  if (enrolled) {
    return (
      <Link href={`/dashboard/courses/${slug}`} className="text-[var(--accent)]" aria-label={`Open ${lesson.title}`}>
        <PlayCircle size={18} />
      </Link>
    );
  }

  return <Lock size={15} className="text-[var(--muted)]" />;
}

export function CoursePurchasePanel({
  courseId,
  slug,
  priceKobo,
  lessonsCount,
  mock,
}: {
  courseId: string;
  slug: string;
  priceKobo: number;
  lessonsCount: number;
  mock: boolean;
}) {
  const { authenticated, enrolled, loading } = useCourseAccess();

  return (
    <>
      <div className="glass p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">One-time payment</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{naira(priceKobo)}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Lifetime access · no subscription</p>

        <div className="mt-4">
          {enrolled ? (
            <Link href={`/dashboard/courses/${slug}`} className="btn btn-primary btn-lg w-full">
              Continue learning <ArrowRight size={16} />
            </Link>
          ) : loading ? (
            <span aria-hidden className="skeleton block h-12 w-full rounded-xl" />
          ) : (
            <EnrollForm courseId={courseId} slug={slug} priceKobo={priceKobo} loggedIn={authenticated} mock={mock} />
          )}
        </div>

        <div className="divider my-4" />
        <ul className="space-y-2.5 text-sm">
          {[
            { icon: BookOpen, text: `${lessonsCount} structured video lessons` },
            { icon: Award, text: "Certificate after passing the exam" },
            { icon: ShieldCheck, text: "Verifiable certificate serial" },
            { icon: Clock, text: "Lifetime access, learn at your pace" },
            { icon: GraduationCap, text: "Projects you can add to your portfolio" },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-2.5 text-[var(--muted)]">
              <item.icon size={15} className="shrink-0 text-[var(--accent)]" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      {!loading && !authenticated && (
        <div className="glass mt-4 p-4">
          <p className="text-sm font-semibold">Not sure yet?</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Watch the free first lesson above. Create an account to save your progress.
          </p>
          <Link href={`/signup?next=${encodeURIComponent(`/courses/${slug}`)}`} className="btn mt-3 w-full">
            Create free account
          </Link>
        </div>
      )}
    </>
  );
}

export function CourseReviewGate({ courseId, slug }: { courseId: string; slug: string }) {
  const { enrolled, loading } = useCourseAccess();

  if (loading) {
    return <span aria-hidden className="skeleton mt-4 block h-10 w-full rounded-xl" />;
  }

  if (enrolled) {
    return (
      <div className="mt-4">
        <ReviewForm courseId={courseId} slug={slug} />
      </div>
    );
  }

  return <p className="mt-4 text-xs text-[var(--muted)]">Only enrolled learners can leave a review.</p>;
}
