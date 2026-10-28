import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Layers, ListChecks, Users, Wallet } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { LessonStudio } from "@/components/teacher/lesson-studio";
import { ModuleManager } from "@/components/admin/module-manager";
import {
  deleteAdminLessonAction,
  deleteModuleAction,
  prepareAdminVideoUploadAction,
  saveAdminLessonAction,
  saveModuleAction,
} from "@/app/admin/actions";
import { ExamEditor } from "@/components/admin/exam-editor";
import { LocalModeBanner } from "@/components/admin/local-mode-banner";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { fixtureCourses } from "@/lib/fixtures";
import type { Course, CourseModule, Exam, ExamQuestion, Lesson } from "@/lib/types";
import { naira } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit course" };
export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price_kobo: number;
  hours: number;
  rating: number;
  emoji: string;
  gradient: string;
  outcomes: string[];
  published: boolean;
  lessons: { count: number }[] | null;
  enrollments: { count: number }[] | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  module_id?: string | null;
  position: number;
  title: string;
  youtube_id: string;
  video_path?: string | null;
  duration_min: number;
  is_free: boolean;
};

type ExamRow = {
  id: string;
  course_id: string;
  title: string;
  pass_score: number;
  time_limit_min: number;
};

type QuestionRow = {
  id: string;
  exam_id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  position: number;
};

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);

  if (!isSupabaseAdminConfigured) {
    const sample = fixtureCourses.find((course) => course.id === id);
    return (
      <div className="space-y-5">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
          <ChevronLeft size={14} /> Back to courses
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Catalogue</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {sample ? sample.title : "Course editor"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Lesson, exam and pricing management.</p>
        </div>
        <LocalModeBanner message="Course editing writes to Supabase, so this editor is read-only in local preview. The public course page is still fully explorable." />
        <div className="admin-card p-8 text-center">
          <h2 className="text-lg font-bold">Editing needs a database connection</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--muted)]">
            Add your Supabase keys to <code className="font-mono">.env.local</code>, apply the migration and seed the
            catalogue. Local preview turns off automatically once Supabase is configured.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {sample && (
              <Link href={`/courses/${sample.slug}`} target="_blank" className="btn btn-sm">
                <ExternalLink size={13} /> Preview public course
              </Link>
            )}
            <Link href="/admin/courses" className="btn btn-primary btn-sm">Back to catalogue</Link>
          </div>
        </div>
      </div>
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: courseRow } = await admin
    .from("courses")
    .select("*, lessons(count), enrollments(count)")
    .eq("id", id)
    .maybeSingle();
  if (!courseRow) notFound();

  const row = courseRow as CourseRow;
  const [{ data: lessonRows }, { data: examRow }, { data: moduleRows }] = await Promise.all([
    admin.from("lessons").select("*").eq("course_id", id).order("position"),
    admin.from("exams").select("*").eq("course_id", id).maybeSingle(),
    admin.from("course_modules").select("*").eq("course_id", id).order("position"),
  ]);

  let questionRows: QuestionRow[] = [];
  if (examRow) {
    const { data } = await admin.from("exam_questions").select("*").eq("exam_id", (examRow as ExamRow).id).order("position");
    questionRows = (data ?? []) as QuestionRow[];
  }

  const course: Course = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    level: row.level,
    priceKobo: Number(row.price_kobo),
    hours: Number(row.hours),
    rating: Number(row.rating),
    emoji: row.emoji,
    gradient: row.gradient,
    outcomes: row.outcomes ?? [],
    published: row.published,
    lessonsCount: row.lessons?.[0]?.count ?? 0,
    studentsCount: row.enrollments?.[0]?.count ?? 0,
  };

  const modules: CourseModule[] = ((moduleRows ?? []) as { id: string; course_id: string; title: string; position: number; created_at: string }[]).map((module) => ({
    id: module.id,
    courseId: module.course_id,
    title: module.title,
    position: module.position,
    createdAt: module.created_at,
  }));

  const lessons: Lesson[] = ((lessonRows ?? []) as LessonRow[]).map((lesson) => ({
    id: lesson.id,
    courseId: lesson.course_id,
    moduleId: lesson.module_id ?? null,
    position: lesson.position,
    title: lesson.title,
    youtubeId: lesson.youtube_id,
    hasVideo: Boolean(lesson.video_path),
    durationMin: lesson.duration_min,
    isFree: lesson.is_free,
  }));

  const exam: Exam | null = examRow
    ? {
        id: (examRow as ExamRow).id,
        courseId: (examRow as ExamRow).course_id,
        title: (examRow as ExamRow).title,
        passScore: (examRow as ExamRow).pass_score,
        timeLimitMin: (examRow as ExamRow).time_limit_min,
        questionCount: questionRows.length,
      }
    : null;

  const questions: ExamQuestion[] = questionRows.map((question) => ({
    id: question.id,
    examId: question.exam_id,
    prompt: question.prompt,
    options: question.options,
    position: question.position,
  }));

  const stats = [
    { label: "Lessons", value: lessons.length, icon: Layers },
    { label: "Students", value: course.studentsCount, icon: Users },
    { label: "Price", value: naira(course.priceKobo), icon: Wallet },
    { label: "Exam questions", value: questions.length, icon: ListChecks },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
          <ChevronLeft size={14} /> Back to courses
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-sm"
              style={{ background: `linear-gradient(135deg, ${course.gradient})` }}
            >
              {course.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
                <span className={`badge ${course.published ? "badge-success" : "badge-muted"}`}>
                  {course.published ? "Live" : "Draft"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {course.category} · {course.level} · /courses/{course.slug}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Link href={`/admin/content?course=${course.id}`} className="btn btn-sm">
              <Layers size={14} /> Books &amp; documents
            </Link>
            <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-sm">
              <ExternalLink size={14} /> View public page
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <stat.icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight">{stat.value}</p>
              <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {created && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          Course created. Add lessons and the final exam below.
        </p>
      )}

      <section className="admin-card p-5">
        <h2 className="mb-4 text-base font-semibold">Course details</h2>
        <CourseForm course={course} />
      </section>

      <ModuleManager
        courseId={course.id}
        modules={modules}
        saveAction={saveModuleAction}
        deleteAction={deleteModuleAction}
      />

      <LessonStudio
        courseId={course.id}
        lessons={lessons}
        modules={modules}
        actions={{
          prepare: prepareAdminVideoUploadAction,
          save: saveAdminLessonAction,
          delete: deleteAdminLessonAction,
        }}
      />

      <ExamEditor
        courseId={course.id}
        exam={exam}
        questions={questions.map((question, index) => ({
          ...question,
          correctIndex: questionRows[index]?.correct_index ?? 0,
        }))}
      />
    </div>
  );
}
