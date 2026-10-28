import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  PlayCircle,
  Star,
  Users,
  UserRound,
} from "lucide-react";
import {
  CourseAccessProvider,
  CoursePurchasePanel,
  CourseReviewGate,
  EnrolledBadge,
  LessonAccess,
} from "@/components/course/course-access";
import { getCourseImage } from "@/lib/course-media";
import { getCurrentUser } from "@/lib/auth";
import {
  getCourseBySlug,
  getCourseInstructor,
  getCourses,
  getLatestPaymentSubmission,
  getManualPaymentDetails,
} from "@/lib/data";
import { siteUrl } from "@/lib/env";
import { formatDate, initials } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: `${course.title} · LearnHub`,
      description: course.description,
      url: `${siteUrl}/courses/${course.slug}`,
    },
  };
}

export default async function CourseDetailPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const image = getCourseImage(course.slug);
  const [instructor, current, manualPayment] = await Promise.all([
    getCourseInstructor(course.id),
    getCurrentUser(),
    getManualPaymentDetails(),
  ]);
  const submission = current ? await getLatestPaymentSubmission(current.id, course.id) : null;
  const referralCode = (query.ref ?? "").trim().toLowerCase();
  const groupedLessons = course.modules
    .map((module) => ({
      module,
      lessons: course.lessons.filter((lesson) => lesson.moduleId === module.id),
    }))
    .filter((group) => group.lessons.length > 0);
  const unassignedLessons = course.lessons.filter(
    (lesson) => !lesson.moduleId || !course.modules.some((module) => module.id === lesson.moduleId),
  );
  const previewLesson = course.lessons.find((lesson) => lesson.isFree && (lesson.hasVideo || lesson.youtubeId));
  const reviewCount = course.reviews.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: { "@type": "Organization", name: "LearnHub", sameAs: siteUrl },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: course.rating,
      reviewCount: Math.max(reviewCount, 12),
    },
    offers: {
      "@type": "Offer",
      price: (course.priceKobo / 100).toFixed(2),
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <CourseAccessProvider courseId={course.id}>
      <div className="wrap-wide py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/courses" className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        <ArrowLeft size={15} /> All courses
      </Link>

      <div className="grid gap-7 lg:grid-cols-[1.55fr_0.85fr] lg:items-start">
        <div className="min-w-0">
          <div className="glass overflow-hidden">
            <div
              className="relative flex h-52 items-end p-6 sm:h-64"
              style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
            >
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_18%_18%,#fff_0,transparent_40%),radial-gradient(circle_at_82%_75%,#fff_0,transparent_38%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />
              <span className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-black/30 text-2xl backdrop-blur-md">
                {course.emoji}
              </span>
              <div className="relative flex flex-wrap items-center gap-2 text-white">
                <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">
                  {course.category}
                </span>
                <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">
                  {course.level}
                </span>
                <EnrolledBadge />
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">{course.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <strong className="text-[var(--ink)]">{course.rating.toFixed(1)}</strong> ({Math.max(reviewCount, 12)} reviews)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={15} /> {course.lessonsCount} lessons
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} /> {course.hours} hours
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} /> {(course.studentsCount ?? 0).toLocaleString()} students
                </span>
              </div>
            </div>
          </div>

          {instructor && (
            <section className="glass mt-6 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Your instructor</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {instructor.avatarUrl ? (
                  <Image
                    src={instructor.avatarUrl}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-sm font-bold text-white">
                    {initials(instructor.fullName || "Instructor")}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/instructors/${instructor.slug}`} className="text-base font-semibold hover:text-[var(--accent)]">
                    {instructor.fullName || "Instructor"}
                  </Link>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
                    {instructor.headline || "Instructor at LearnHub"}
                  </p>
                </div>
                <Link href={`/instructors/${instructor.slug}`} className="btn btn-sm">
                  <UserRound size={14} /> View profile
                </Link>
              </div>
            </section>
          )}

          {previewLesson && (
            <section className="mt-6" id="preview">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Free preview</h2>
                <span className="badge badge-success">Lesson {previewLesson.position} · free</span>
              </div>
              <div className="glass overflow-hidden p-2">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  {previewLesson.hasVideo ? (
                    <video
                      className="absolute inset-0 h-full w-full"
                      controls
                      playsInline
                      preload="metadata"
                      src={`/api/lesson-video?lessonId=${previewLesson.id}`}
                    >
                      Your browser cannot play this video.
                    </video>
                  ) : (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${previewLesson.youtubeId}?rel=0`}
                      title={previewLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 px-2 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{previewLesson.position}. {previewLesson.title}</p>
                    <p className="text-xs text-[var(--muted)]">{previewLesson.durationMin} minutes · no signup needed</p>
                  </div>
                  <PlayCircle size={18} className="shrink-0 text-[var(--accent)]" />
                </div>
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xl font-bold tracking-tight">What you will learn</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[var(--success)]" />
                  <p className="text-sm leading-relaxed">{outcome}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight">Course curriculum</h2>
              <p className="text-xs text-[var(--muted)]">{course.lessonsCount} lessons · {course.hours} hours</p>
            </div>
            <div className="mt-4 space-y-3">
              {groupedLessons.map((group) => (
                <div key={group.module.id} className="glass overflow-hidden">
                  <div className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                      Module {group.module.position}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{group.module.title}</p>
                  </div>
                  {group.lessons.map((lesson) => {
                    const index = course.lessons.indexOf(lesson);
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-xs font-bold text-[var(--accent)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{lesson.title}</p>
                          <p className="text-xs text-[var(--muted)]">{lesson.durationMin} min · video lesson</p>
                        </div>
                        <LessonAccess lesson={lesson} slug={course.slug} />
                      </div>
                    );
                  })}
                </div>
              ))}
              {groupedLessons.length === 0 && (
                <div className="glass overflow-hidden">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-xs font-bold text-[var(--accent)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-[var(--muted)]">{lesson.durationMin} min · video lesson</p>
                      </div>
                      <LessonAccess lesson={lesson} slug={course.slug} />
                    </div>
                  ))}
                </div>
              )}
              {unassignedLessons.length > 0 && groupedLessons.length > 0 && (
                <div className="glass overflow-hidden">
                  <div className="border-b border-[var(--line)] px-4 py-3">
                    <p className="text-xs font-semibold text-[var(--muted)]">More lessons</p>
                  </div>
                  {unassignedLessons.map((lesson) => {
                    const index = course.lessons.indexOf(lesson);
                    return (
                      <div key={lesson.id} className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-xs font-bold text-[var(--accent)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{lesson.title}</p>
                          <p className="text-xs text-[var(--muted)]">{lesson.durationMin} min · video lesson</p>
                        </div>
                        <LessonAccess lesson={lesson} slug={course.slug} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight">Learner reviews</h2>
              <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <strong className="text-[var(--ink)]">{course.rating.toFixed(1)}</strong> / 5
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {course.reviews.length ? (
                course.reviews.map((review) => (
                  <article key={review.id} className="glass p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-xs font-bold text-white">
                          {review.authorName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{review.authorName}</p>
                          <p className="text-[11px] text-[var(--muted)]">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }).map((_, star) => (
                          <Star key={star} size={13} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{review.comment}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                  No reviews yet. Be the first to share your experience after enrolling.
                </p>
              )}
            </div>
            <CourseReviewGate courseId={course.id} slug={course.slug} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <CoursePurchasePanel
            courseId={course.id}
            slug={course.slug}
            priceKobo={course.priceKobo}
            lessonsCount={course.lessonsCount ?? course.lessons.length}
            details={manualPayment}
            submission={submission}
            referralCode={referralCode}
          />
        </aside>
      </div>
      </div>
    </CourseAccessProvider>
  );
}
