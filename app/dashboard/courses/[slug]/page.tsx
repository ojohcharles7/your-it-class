import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LessonPlayer } from "@/components/dashboard/lesson-player";
import { requireUser } from "@/lib/auth";
import { getLearningCourse } from "@/lib/data";

export const metadata: Metadata = { title: "Course player" };
export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const current = await requireUser(`/dashboard/courses/${slug}`);
  const data = await getLearningCourse(current.id, slug);
  if (!data) redirect(`/courses/${slug}`);

  return (
    <LessonPlayer
      course={data.course}
      lessons={data.lessons}
      modules={data.modules}
      announcements={data.announcements}
      questions={data.questions}
      currentUserId={current.id}
      resources={data.resources}
      completedIds={Array.from(data.completedIds)}
      progress={data.progress}
      exam={data.exam}
      certificate={data.certificate ? { serial: data.certificate.serial } : null}
    />
  );
}
