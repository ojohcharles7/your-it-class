import { existsSync } from "node:fs";

async function main() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      break;
    }
  }

  const { createClient } = await import("@supabase/supabase-js");
  const { fixtureCourses, fixtureLessons, fixtureExams } = await import("../lib/fixtures");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding Your IT Class catalogue…");

  for (const course of fixtureCourses) {
    const { data, error } = await supabase
      .from("courses")
      .upsert(
        {
          slug: course.slug,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price_kobo: course.priceKobo,
          hours: course.hours,
          rating: course.rating,
          emoji: course.emoji,
          gradient: course.gradient,
          outcomes: course.outcomes,
          published: course.published,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data) {
      console.error(`Failed to upsert ${course.slug}:`, error?.message);
      process.exit(1);
    }

    const courseId = data.id as string;

    await supabase.from("lessons").delete().eq("course_id", courseId);
    const lessons = (fixtureLessons[course.slug] ?? []).map((lesson) => ({
      course_id: courseId,
      position: lesson.position,
      title: lesson.title,
      youtube_id: lesson.youtubeId,
      duration_min: lesson.durationMin,
      is_free: lesson.isFree,
    }));
    const { error: lessonError } = await supabase.from("lessons").insert(lessons);
    if (lessonError) {
      console.error(`Failed to seed lessons for ${course.slug}:`, lessonError.message);
      process.exit(1);
    }

    const exam = fixtureExams[course.slug];
    await supabase.from("exams").delete().eq("course_id", courseId);
    if (exam) {
      const { data: examRow, error: examError } = await supabase
        .from("exams")
        .insert({
          course_id: courseId,
          title: exam.title,
          pass_score: exam.passScore,
          time_limit_min: exam.timeLimitMin,
        })
        .select("id")
        .single();
      if (examError || !examRow) {
        console.error(`Failed to seed exam for ${course.slug}:`, examError?.message);
        process.exit(1);
      }

      const questions = exam.questions.map((question, index) => ({
        exam_id: examRow.id as string,
        prompt: question.prompt,
        options: question.options,
        correct_index: question.correctIndex,
        position: index + 1,
      }));
      const { error: questionError } = await supabase.from("exam_questions").insert(questions);
      if (questionError) {
        console.error(`Failed to seed questions for ${course.slug}:`, questionError.message);
        process.exit(1);
      }
    }

    console.log(`  ✓ ${course.title} — ${lessons.length} lessons${exam ? `, ${exam.questions.length} exam questions` : ""}`);
  }

  console.log("\nDone. Visit /courses to see the seeded catalogue.");
  console.log("Next: create an account, then run `npm run grant-admin you@email.com`.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
