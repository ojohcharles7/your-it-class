import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Lock,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { EnrollForm } from "@/components/course/enroll-form";
import { getCourseImage } from "@/lib/course-media";
import { ReviewForm } from "@/components/course/review-form";
import { getCourseBySlug, isEnrolled } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { paymentsProvider, siteUrl } from "@/lib/env";
import { formatDate, naira } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: `${course.title} · Your IT Class`,
      description: course.description,
      url: `${siteUrl}/courses/${course.slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [course, current] = await Promise.all([getCourseBySlug(slug), getCurrentUser()]);
  if (!course) notFound();

  const enrolled = current ? await isEnrolled(current.id, course.id) : false;
  const image = getCourseImage(course.slug);
  const previewLesson = course.lessons.find((lesson) => lesson.isFree);
  const reviewCount = course.reviews.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: { "@type": "Organization", name: "Your IT Class", sameAs: siteUrl },
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
                {enrolled && <span className="rounded-lg bg-white/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">Enrolled</span>}
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

          {previewLesson && (
            <section className="mt-6" id="preview">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Free preview</h2>
                <span className="badge badge-success">Lesson {previewLesson.position} · free</span>
              </div>
              <div className="glass overflow-hidden p-2">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${previewLesson.youtubeId}?rel=0`}
                    title={previewLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
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
            <div className="glass mt-4 overflow-hidden">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-0"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-xs font-bold text-[var(--accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lesson.title}</p>
                    <p className="text-xs text-[var(--muted)]">{lesson.durationMin} min · video lesson</p>
                  </div>
                  {lesson.isFree ? (
                    <Link href="#preview" className="badge badge-success">Free</Link>
                  ) : enrolled ? (
                    <Link href={`/dashboard/courses/${course.slug}`} className="text-[var(--accent)]" aria-label={`Open ${lesson.title}`}>
                      <PlayCircle size={18} />
                    </Link>
                  ) : (
                    <Lock size={15} className="text-[var(--muted)]" />
                  )}
                </div>
              ))}
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
            {enrolled ? (
              <div className="mt-4">
                <ReviewForm courseId={course.id} slug={course.slug} />
              </div>
            ) : (
              <p className="mt-4 text-xs text-[var(--muted)]">Only enrolled learners can leave a review.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="glass p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">One-time payment</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{naira(course.priceKobo)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Lifetime access · no subscription</p>

            <div className="mt-4">
              {enrolled ? (
                <Link href={`/dashboard/courses/${course.slug}`} className="btn btn-primary btn-lg w-full">
                  Continue learning <ArrowRight size={16} />
                </Link>
              ) : (
                <EnrollForm
                  courseId={course.id}
                  slug={course.slug}
                  priceKobo={course.priceKobo}
                  loggedIn={Boolean(current)}
                  mock={paymentsProvider === "mock"}
                />
              )}
            </div>

            <div className="divider my-4" />
            <ul className="space-y-2.5 text-sm">
              {[
                { icon: BookOpen, text: `${course.lessonsCount} structured video lessons` },
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

          <div className="glass mt-4 p-4">
            <p className="text-sm font-semibold">Not sure yet?</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Watch the free first lesson above. Create an account to save your progress.
            </p>
            {!current && (
              <Link href="/signup" className="btn mt-3 w-full">
                Create free account
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
