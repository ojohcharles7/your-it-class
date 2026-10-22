import type { Metadata } from "next";
import Link from "next/link";
import { Award, CheckCircle2, Clock, FileText, Lock, PlayCircle, Timer } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getEnrolledCourses, getExamAttempts } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Exams" };
export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const current = await requireUser("/dashboard/exams");
  const [courses, attempts] = await Promise.all([getEnrolledCourses(current.id), getExamAttempts(current.id)]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Assessment</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight">Exams &amp; results</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Finish every lesson to unlock a final exam. Pass it to earn a verifiable certificate.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="glass p-10 text-center">
          <FileText size={28} className="mx-auto text-[var(--accent)]" />
          <h2 className="mt-3 text-lg font-semibold">No exams available yet</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Enrol in a course to unlock its final exam.</p>
          <Link href="/courses" className="btn btn-primary mt-4">Browse courses</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map((course) => {
            const best = attempts
              .filter((attempt) => attempt.courseId === course.id)
              .sort((a, b) => b.score / b.total - a.score / a.total)[0];
            const ready = course.progress === 100;
            return (
              <div key={course.id} className="glass flex flex-wrap items-center gap-4 p-4">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl"
                  style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
                >
                  {course.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{course.title}</p>
                    {course.certificate ? (
                      <span className="badge badge-success"><Award size={11} /> Certified</span>
                    ) : ready ? (
                      <span className="badge badge-accent">Unlocked</span>
                    ) : (
                      <span className="badge badge-muted"><Lock size={11} /> Locked</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    {course.exam ? (
                      <>
                        <span className="inline-flex items-center gap-1"><FileText size={12} /> {course.exam.questionCount} questions</span>
                        <span className="inline-flex items-center gap-1"><Clock size={12} /> {course.exam.timeLimitMin} min</span>
                        <span className="inline-flex items-center gap-1"><Timer size={12} /> Pass mark {course.exam.passScore}%</span>
                      </>
                    ) : (
                      <span>Final exam coming soon</span>
                    )}
                    {best && (
                      <span className="text-[var(--success)]">Best: {Math.round((best.score / best.total) * 100)}%</span>
                    )}
                  </div>
                  {!ready && (
                    <div className="progress mt-2 max-w-sm">
                      <span style={{ width: `${course.progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/courses/${course.slug}`} className="btn btn-sm">
                    <PlayCircle size={14} /> Course
                  </Link>
                  {ready && course.exam ? (
                    <Link href={`/dashboard/exams/${course.exam.id}`} className="btn btn-primary btn-sm">
                      {best ? "Retake exam" : "Start exam"}
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-sm" disabled>
                      <Lock size={13} /> Locked
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight">Attempt history</h2>
        {attempts.length ? (
          <div className="table-wrap glass">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="font-medium">{attempt.courseTitle ?? "Final exam"}</td>
                    <td className="text-[var(--muted)]">{formatDate(attempt.completedAt)}</td>
                    <td className="font-semibold">{Math.round((attempt.score / attempt.total) * 100)}%</td>
                    <td>
                      <span className={`badge ${attempt.passed ? "badge-success" : "badge-warning"}`}>
                        {attempt.passed ? <><CheckCircle2 size={11} /> Passed</> : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="glass p-5 text-sm text-[var(--muted)]">No attempts yet. Your results will appear here.</p>
        )}
      </section>
    </div>
  );
}
