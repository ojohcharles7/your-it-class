import Link from "next/link";
import {
  ArrowRight,
  Award,
  CreditCard,
  FileCheck2,
  GraduationCap,
  MonitorPlay,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
} from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { getCourses } from "@/lib/data";
import { fixtureReviews } from "@/lib/fixtures";
import { siteUrl } from "@/lib/env";

const features = [
  {
    icon: MonitorPlay,
    title: "Structured video lessons",
    text: "Follow a clear path from fundamentals to real projects, on any device.",
  },
  {
    icon: FileCheck2,
    title: "Exams & certificates",
    text: "Pass a timed final exam and earn a certificate anyone can verify online.",
  },
  {
    icon: CreditCard,
    title: "Secure Naira payments",
    text: "Pay with Paystack in Naira and unlock your course instantly.",
  },
  {
    icon: TrendingUp,
    title: "Progress that follows you",
    text: "Every completed lesson is saved so you always know what comes next.",
  },
  {
    icon: ShieldCheck,
    title: "Practical & current",
    text: "Curriculum built around tools and skills employers actually use today.",
  },
  {
    icon: Smartphone,
    title: "Learn anywhere",
    text: "Your dashboard works on phones, tablets and laptops — 24/7 access.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Choose your path",
    text: "Browse focused courses in programming, security, networking, data, design and business.",
  },
  {
    icon: MonitorPlay,
    title: "Learn by doing",
    text: "Watch short lessons and complete hands-on projects at your own pace.",
  },
  {
    icon: Award,
    title: "Get certified",
    text: "Finish the lessons, pass the final exam, and share a verifiable certificate.",
  },
];

const faqs = [
  {
    q: "Do I need any experience to start?",
    a: "No. Most courses are beginner-friendly and assume zero prior experience. Intermediate courses are clearly labelled so you can choose the right level.",
  },
  {
    q: "How long do I have access to a course?",
    a: "Once enrolled, you have unlimited 24/7 access to the course lessons, updates and your progress history.",
  },
  {
    q: "How do payments work?",
    a: "Payments are handled securely by Paystack in Nigerian Naira. Your course unlocks automatically as soon as payment is confirmed.",
  },
  {
    q: "Are the certificates recognised?",
    a: "You receive a certificate with a unique serial number and a public verification page you can attach to your CV, LinkedIn or portfolio.",
  },
  {
    q: "Can I learn on my phone?",
    a: "Yes. The entire learning experience — videos, lessons, exams and certificates — is responsive and works on mobile data.",
  },
];

export const revalidate = 300;

export default async function HomePage() {
  const courses = await getCourses();
  const featured = [...courses].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const totalLessons = courses.reduce((sum, course) => sum + (course.lessonsCount ?? 0), 0);
  const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount ?? 0), 0);
  const averageRating = courses.length
    ? (courses.reduce((sum, course) => sum + course.rating, 0) / courses.length).toFixed(1)
    : "4.8";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "LearnHub",
    url: siteUrl,
    description: "Practical IT courses for Nigerian learners with video lessons, exams and verifiable certificates.",
    sameAs: [],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero-glow relative overflow-hidden pb-14 pt-4 sm:pt-8">
        <div className="wrap-wide">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="reveal delay-1 text-[2.7rem] font-bold leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Describe your goal.
              <br />
              We map the path in <span className="font-editorial gradient-text">minutes.</span>
            </h1>

            <p className="reveal delay-1 mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              Tell us where you want to be. LearnHub turns it into a practical learning plan — video lessons,
              hands-on projects, timed exams and a verifiable certificate. Start free, no card required.
            </p>
          </div>

          <div className="reveal delay-3 mt-12 sm:mt-16">
            <HeroCarousel courses={courses} />
          </div>

          <div className="mx-auto mt-12 grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { value: `${courses.length}`, label: "Career paths" },
              { value: `${totalLessons}`, label: "Video lessons" },
              { value: `${totalStudents.toLocaleString()}+`, label: "Learners" },
              { value: "100%", label: "Online & practical" },
            ].map((stat) => (
              <div key={stat.label} className="glass px-4 py-5 text-center sm:py-6">
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap-wide py-16" id="courses">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Explore courses</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Pick a path. Start today.</h2>
            <p className="mt-3 text-base text-[var(--muted)] sm:text-lg">Focused, practical courses with projects you can show employers.</p>
          </div>
          <Link href="/courses" className="btn">
            View all courses <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="wrap-wide py-16" id="why">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Why LearnHub</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">A complete learning workspace</h2>
          <p className="mt-3 text-base text-[var(--muted)] sm:text-lg">
            Everything you need to go from curious beginner to confident, certified practitioner — in one place.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const wide = index === 0 || index === 3;
            return (
              <div
                key={feature.title}
                className={`glass card-hover relative overflow-hidden p-6 ${wide ? "sm:col-span-2" : ""}`}
              >
                <span className="pointer-events-none absolute -right-2 -top-5 text-[92px] font-bold leading-none tracking-tighter text-[color-mix(in_srgb,var(--ink)_5%,transparent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                  <feature.icon size={20} />
                </span>
                <h3 className={`relative mt-4 font-semibold ${wide ? "text-lg sm:text-xl" : "text-base"}`}>{feature.title}</h3>
                <p className={`relative mt-1.5 leading-relaxed text-[var(--muted)] ${wide ? "max-w-md text-sm sm:text-base" : "text-sm"}`}>
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wrap-wide py-14">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Three steps to a new skill</h2>
            <p className="mt-3 text-base text-[var(--muted)] sm:text-lg">
              No complicated onboarding. Pick a course, learn consistently, and prove what you know with an exam and
              certificate.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Create free account <ArrowRight size={15} />
            </Link>
            <Link href="/courses" className="btn">See curriculum</Link>
          </div>
        </div>
        <div className="relative mt-9 grid gap-4 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-[var(--accent)]/35 to-transparent md:block" />
          {steps.map((step, index) => (
            <div key={step.title} className="glass relative p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white">
                  <step.icon size={20} />
                </span>
                <span className="text-4xl font-bold tracking-tighter text-[color-mix(in_srgb,var(--ink)_8%,transparent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Step {index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap-wide py-16">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Learner stories</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Real people, real progress</h2>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <strong className="text-[var(--ink)]">{averageRating}</strong> from learner reviews
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {fixtureReviews.slice(0, 3).map((review, index) => (
            <figure key={review.id} className="glass flex flex-col p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, star) => (
                  <Star key={star} size={15} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-base leading-relaxed">“{review.comment}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5 border-t border-[var(--line)] pt-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${["#0a84ff,#5e5ce6", "#30d158,#0a84ff", "#ff9f0a,#ff375f"][index]})` }}
                >
                  {review.authorName.split(" ").map((part) => part[0]).join("")}
                </span>
                <div>
                  <p className="text-sm font-semibold">{review.authorName}</p>
                  <p className="text-xs text-[var(--muted)]">Verified learner</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wrap-wide py-16" id="faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Questions, answered</h2>
            <p className="mt-3 text-base text-[var(--muted)]">
              Still unsure? Create an account and explore the free first lesson of every course.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <GraduationCap className="text-[var(--accent)]" size={20} />
              <p className="text-sm text-[var(--muted)]">Start with any course and upgrade when you are ready.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {faqs.map((faq) => (
              <details key={faq.q} className="glass group p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {faq.q}
                  <span className="text-lg leading-none text-[var(--muted)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
