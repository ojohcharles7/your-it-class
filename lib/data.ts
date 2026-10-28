import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabasePublicClient } from "./supabase/public";
import { createSupabaseAdminClient } from "./supabase/admin";
import { getAdminClient } from "./supabase/admin-data";
import { isSupabaseAdminConfigured } from "./env";
import { fixtureCourses, fixtureLessons, fixtureReviews } from "./fixtures";
import type {
  Certificate,
  Coupon,
  Course,
  CourseAnnouncement,
  CourseAnswer,
  CourseDetail,
  CourseModule,
  CourseQuestion,
  CourseResource,
  EnrolledCourse,
  Enrollment,
  Exam,
  ExamAttempt,
  ExamQuestion,
  InstructorApplication,
  InstructorEarning,
  InstructorProfile,
  Lesson,
  LessonProgress,
  ManualPaymentDetails,
  Payment,
  PaymentSubmission,
  PayoutRequest,
  Review,
} from "./types";

type Count = { count: number }[] | null;

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  price_kobo: number;
  hours: number | string;
  rating: number | string;
  emoji: string;
  gradient: string;
  outcomes: string[] | null;
  published: boolean;
  instructor_id?: string | null;
  review_status?: string | null;
  review_note?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  lessons?: Count;
  enrollments?: Count;
};

type LessonRow = {
  id: string;
  course_id: string;
  module_id?: string | null;
  position: number;
  title: string;
  youtube_id: string;
  video_path?: string | null;
  video_mime?: string | null;
  video_size?: number | string | null;
  duration_min: number;
  is_free: boolean;
};

type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
};

type QuestionRow = {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  body: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  course_answers?: AnswerRow[] | null;
};

type AnswerRow = {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

type AnnouncementRow = {
  id: string;
  course_id: string;
  created_by: string;
  title: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

type CouponRow = {
  id: string;
  code: string;
  course_id: string | null;
  instructor_id: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_redemptions: number | null;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  courses?: { title: string } | { title: string }[] | null;
  coupon_redemptions?: Count;
};

type PaymentSubmissionRow = {
  id: string;
  user_id: string;
  course_id: string;
  coupon_id: string | null;
  original_amount_kobo: number;
  discount_kobo: number;
  amount_kobo: number;
  sale_channel: "marketplace" | "referral";
  referral_code: string;
  payer_name: string;
  payer_phone: string;
  bank_reference: string;
  note: string;
  proof_path: string;
  status: PaymentSubmission["status"];
  review_note: string;
  reviewed_at: string | null;
  payment_id: string | null;
  created_at: string;
  courses?: { title: string; slug: string } | { title: string; slug: string }[] | null;
  profiles?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  coupons?: { code: string } | { code: string }[] | null;
};

type ResourceRow = {
  id: string;
  course_id: string;
  title: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | string;
  created_at: string;
};

export const COURSE_MATERIALS_BUCKET = "course-materials";
export const COURSE_VIDEOS_BUCKET = "course-videos";

type ReviewRow = {
  id: string;
  course_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "completed";
  amount_kobo: number;
  paystack_ref: string | null;
  created_at: string;
};

type ProgressRow = {
  lesson_id: string;
  completed_at: string;
};

type ExamRow = {
  id: string;
  course_id: string;
  title: string;
  pass_score: number;
  time_limit_min: number;
  created_at?: string;
  exam_questions?: Count;
};

type ExamQuestionRow = {
  id: string;
  exam_id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  position: number;
};

type AttemptRow = {
  id: string;
  exam_id: string;
  user_id: string;
  score: number;
  total: number;
  passed: boolean;
  completed_at: string;
};

type CertificateRow = {
  id: string;
  user_id: string;
  course_id: string;
  serial: string;
  issued_at: string;
};

type PaymentRow = {
  id: string;
  reference: string;
  user_id: string;
  course_id: string;
  amount_kobo: number;
  status: "pending" | "success" | "failed";
  provider: string;
  original_amount_kobo?: number | null;
  discount_kobo?: number | null;
  coupon_id?: string | null;
  sale_channel?: string | null;
  referral_code?: string | null;
  created_at: string;
};

const countOf = (value: Count | undefined) => value?.[0]?.count ?? 0;

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    level: row.level,
    priceKobo: Number(row.price_kobo),
    hours: Number(row.hours),
    rating: Number(row.rating),
    emoji: row.emoji,
    gradient: row.gradient,
    outcomes: row.outcomes ?? [],
    published: row.published,
    instructorId: row.instructor_id ?? null,
    reviewStatus: (row.review_status as Course["reviewStatus"]) ?? (row.published ? "published" : "draft"),
    reviewNote: row.review_note ?? "",
    submittedAt: row.submitted_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
    lessonsCount: countOf(row.lessons),
    studentsCount: countOf(row.enrollments),
  };
}

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id ?? null,
    position: row.position,
    title: row.title,
    youtubeId: row.youtube_id,
    videoPath: row.video_path ?? null,
    videoMime: row.video_mime ?? null,
    videoSize: row.video_size == null ? null : Number(row.video_size),
    hasVideo: Boolean(row.video_path),
    durationMin: row.duration_min,
    isFree: row.is_free,
  };
}

function mapModule(row: ModuleRow): CourseModule {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at,
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    authorName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    status: row.status,
    amountKobo: Number(row.amount_kobo),
    paystackRef: row.paystack_ref,
    createdAt: row.created_at,
  };
}

function mapExam(row: ExamRow): Exam {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    passScore: row.pass_score,
    timeLimitMin: row.time_limit_min,
    questionCount: countOf(row.exam_questions),
  };
}

function mapCertificate(row: CertificateRow): Certificate {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    serial: row.serial,
    issuedAt: row.issued_at,
  };
}

function proxyCourse(course: Course, lessons: Lesson[]): Course {
  return { ...course, lessonsCount: lessons.length };
}

const CATALOG_TTL = 300;

async function loadCourses(): Promise<Course[]> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return fixtureCourses;

  const { data, error } = await supabase
    .from("courses")
    .select("*, lessons(count), enrollments(count)")
    .eq("published", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Could not load courses from Supabase, using fixtures:", error.message);
    return fixtureCourses;
  }
  return ((data ?? []) as CourseRow[]).map(mapCourse);
}

export const getCourses = unstable_cache(loadCourses, ["catalog-courses"], {
  revalidate: CATALOG_TTL,
  tags: ["catalog"],
});

export async function getCategories(): Promise<string[]> {
  const courses = await getCourses();
  return Array.from(new Set(courses.map((course) => course.category))).sort();
}

async function loadCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    const course = fixtureCourses.find((item) => item.slug === slug);
    if (!course) return null;
    return {
      ...proxyCourse(course, fixtureLessons[slug] ?? []),
      lessons: fixtureLessons[slug] ?? [],
      modules: [],
      reviews: fixtureReviews.filter((review) => review.courseId === course.id),
    };
  }

  const { data, error } = await supabase
    .from("courses")
    .select("*, lessons(count), enrollments(count)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.warn("Could not load course, using fixtures:", error.message);
    const course = fixtureCourses.find((item) => item.slug === slug);
    if (!course) return null;
    return {
      ...proxyCourse(course, fixtureLessons[slug] ?? []),
      lessons: fixtureLessons[slug] ?? [],
      modules: [],
      reviews: fixtureReviews.filter((review) => review.courseId === course.id),
    };
  }
  if (!data) return null;

  const course = mapCourse(data as CourseRow);
  const [{ data: lessonRows }, { data: reviewRows }, { data: moduleRows }] = await Promise.all([
    supabase.from("lessons").select("*").eq("course_id", course.id).order("position"),
    supabase.from("reviews").select("*").eq("course_id", course.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("course_modules").select("*").eq("course_id", course.id).order("position"),
  ]);

  const lessons = ((lessonRows ?? []) as LessonRow[]).map(mapLesson);
  return {
    ...course,
    lessonsCount: lessons.length,
    lessons,
    modules: ((moduleRows ?? []) as ModuleRow[]).map(mapModule),
    reviews: ((reviewRows ?? []) as ReviewRow[]).map(mapReview),
  };
}

const getCachedCourseBySlug = unstable_cache(loadCourseBySlug, ["catalog-course-by-slug"], {
  revalidate: CATALOG_TTL,
  tags: ["catalog"],
});

export function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  return getCachedCourseBySlug(slug);
}

async function loadCourseById(id: string): Promise<Course | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return fixtureCourses.find((course) => course.id === id) ?? null;
  const { data } = await supabase.from("courses").select("*, lessons(count), enrollments(count)").eq("id", id).maybeSingle();
  return data ? mapCourse(data as CourseRow) : null;
}

const getCachedCourseById = unstable_cache(loadCourseById, ["catalog-course-by-id"], {
  revalidate: CATALOG_TTL,
  tags: ["catalog"],
});

export function getCourseById(id: string): Promise<Course | null> {
  return getCachedCourseById(id);
}

export async function getEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data: enrollmentRows, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !enrollmentRows?.length) return [];

  const enrollments = (enrollmentRows as EnrollmentRow[]).map(mapEnrollment);
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);

  const [{ data: courseRows }, { data: lessonRows }, { data: progressRows }, { data: examRows }, { data: certificateRows }] =
    await Promise.all([
      supabase.from("courses").select("*, lessons(count), enrollments(count)").in("id", courseIds),
      supabase.from("lessons").select("*").in("course_id", courseIds).order("position"),
      supabase.from("lesson_progress").select("lesson_id, completed_at").eq("user_id", userId),
      supabase.from("exams").select("*, exam_questions(count)").in("course_id", courseIds),
      supabase.from("certificates").select("*").eq("user_id", userId),
    ]);

  const courses = ((courseRows ?? []) as CourseRow[]).map(mapCourse);
  const lessons = ((lessonRows ?? []) as LessonRow[]).map(mapLesson);
  const completed = new Set(((progressRows ?? []) as ProgressRow[]).map((row) => row.lesson_id));
  const exams = ((examRows ?? []) as ExamRow[]).map(mapExam);
  const certificates = ((certificateRows ?? []) as CertificateRow[]).map(mapCertificate);

  const result: EnrolledCourse[] = [];
  for (const enrollment of enrollments) {
    const course = courses.find((item) => item.id === enrollment.courseId);
    if (!course) continue;
    const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
    const completedLessons = courseLessons.filter((lesson) => completed.has(lesson.id)).length;
    result.push({
      ...course,
      lessonsCount: courseLessons.length,
      enrollment,
      completedLessons,
      progress: courseLessons.length ? Math.round((completedLessons / courseLessons.length) * 100) : 0,
      exam: exams.find((exam) => exam.courseId === course.id) ?? null,
      certificate: certificates.find((certificate) => certificate.courseId === course.id) ?? null,
    });
  }
  return result;
}

export type DailyLearningActivity = {
  date: string;
  label: string;
  lessons: number;
};

function buildActivityDays(start: Date, timestamps: string[]): DailyLearningActivity[] {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: date.toISOString(),
      label: date.toLocaleDateString("en-NG", { weekday: "short" }),
      key: date.toDateString(),
      lessons: 0,
    };
  });

  for (const timestamp of timestamps) {
    const key = new Date(timestamp).toDateString();
    const day = days.find((item) => item.key === key);
    if (day) day.lessons += 1;
  }

  return days.map(({ date, label, lessons }) => ({ date, label, lessons }));
}

export async function getLearningActivity(userId: string): Promise<DailyLearningActivity[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return buildActivityDays(start, []);

  const { data } = await supabase
    .from("lesson_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .gte("completed_at", start.toISOString());

  return buildActivityDays(
    start,
    ((data ?? []) as { completed_at: string }[]).map((row) => row.completed_at),
  );
}

export async function getLearningCourse(userId: string, slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: courseRow } = await supabase
    .from("courses")
    .select("*, lessons(count), enrollments(count)")
    .eq("slug", slug)
    .maybeSingle();
  if (!courseRow) return null;

  const course = mapCourse(courseRow as CourseRow);
  const { data: enrollmentRow } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!enrollmentRow) return null;

  const [
    { data: lessonRows },
    { data: progressRows },
    { data: examRow },
    { data: certificateRow },
    { data: moduleRows },
    announcements,
    questions,
  ] = await Promise.all([
    supabase.from("lessons").select("*").eq("course_id", course.id).order("position"),
    supabase.from("lesson_progress").select("lesson_id, completed_at").eq("user_id", userId),
    supabase.from("exams").select("*, exam_questions(count)").eq("course_id", course.id).maybeSingle(),
    supabase.from("certificates").select("*").eq("user_id", userId).eq("course_id", course.id).maybeSingle(),
    supabase.from("course_modules").select("*").eq("course_id", course.id).order("position"),
    getCourseAnnouncements(course.id),
    getCourseQuestions(course.id),
  ]);

  const lessons = ((lessonRows ?? []) as LessonRow[]).map(mapLesson);
  const completedIds = new Set(((progressRows ?? []) as ProgressRow[]).map((row) => row.lesson_id));
  const completed: LessonProgress[] = ((progressRows ?? []) as ProgressRow[]).map((row) => ({
    lessonId: row.lesson_id,
    completedAt: row.completed_at,
  }));

  return {
    course: { ...course, lessonsCount: lessons.length },
    enrollment: mapEnrollment(enrollmentRow as EnrollmentRow),
    lessons,
    modules: ((moduleRows ?? []) as ModuleRow[]).map(mapModule),
    announcements,
    questions,
    resources: await getCourseResources(course.id),
    completedIds,
    completed,
    exam: examRow ? mapExam(examRow as ExamRow) : null,
    certificate: certificateRow ? mapCertificate(certificateRow as CertificateRow) : null,
    progress: lessons.length ? Math.round((lessons.filter((lesson) => completedIds.has(lesson.id)).length / lessons.length) * 100) : 0,
  };
}

export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  if (!courseId) return [];
  const supabase = await getAdminClient();
  const { data, error } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("position");
  if (error) {
    console.warn("Could not load lessons:", error.message);
    return [];
  }
  return ((data ?? []) as LessonRow[]).map(mapLesson);
}

export type CourseResourceLink = CourseResource & { url: string | null };

export async function getCourseResources(courseId: string): Promise<CourseResourceLink[]> {
  if (!courseId) return [];

  try {
    const supabase = await getAdminClient();
    const { data, error } = await supabase
      .from("course_resources")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    return await Promise.all(
      (data as ResourceRow[]).map(async (row) => {
        const { data: signed } = await supabase.storage
          .from(COURSE_MATERIALS_BUCKET)
          .createSignedUrl(row.storage_path, 60 * 60);
        return {
          id: row.id,
          courseId: row.course_id,
          title: row.title,
          fileName: row.file_name,
          mimeType: row.mime_type,
          sizeBytes: Number(row.size_bytes),
          storagePath: row.storage_path,
          createdAt: row.created_at,
          url: signed?.signedUrl ?? null,
        };
      }),
    );
  } catch {
    return [];
  }
}

export async function getExamForCourse(courseId: string): Promise<{ exam: Exam; questions: ExamQuestion[] } | null> {
  if (!isSupabaseAdminConfigured) return null;
  const supabase = createSupabaseAdminClient();
  const { data: examRow } = await supabase
    .from("exams")
    .select("*, exam_questions(count)")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!examRow) return null;
  const exam = mapExam(examRow as ExamRow);
  const { data: questionRows } = await supabase
    .from("exam_questions")
    .select("id, exam_id, prompt, options, position")
    .eq("exam_id", exam.id)
    .order("position");
  return {
    exam,
    questions: ((questionRows ?? []) as ExamQuestionRow[]).map((row) => ({
      id: row.id,
      examId: row.exam_id,
      prompt: row.prompt,
      options: row.options,
      position: row.position,
    })),
  };
}

export async function getExamEditorData(courseId: string): Promise<{
  exam: Exam | null;
  questions: { id: string; examId: string; prompt: string; options: string[]; correctIndex: number; position: number }[];
}> {
  const admin = await getAdminClient();
  const { data: examRow } = await admin
    .from("exams")
    .select("*, exam_questions(count)")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!examRow) return { exam: null, questions: [] };

  const exam = mapExam(examRow as ExamRow);
  const { data: questionRows } = await admin
    .from("exam_questions")
    .select("id, exam_id, prompt, options, correct_index, position")
    .eq("exam_id", exam.id)
    .order("position");

  return {
    exam,
    questions: ((questionRows ?? []) as ExamQuestionRow[]).map((row) => ({
      id: row.id,
      examId: row.exam_id,
      prompt: row.prompt,
      options: row.options,
      correctIndex: row.correct_index,
      position: row.position,
    })),
  };
}

export async function getExamWithCourse(examId: string) {
  if (!isSupabaseAdminConfigured) return null;
  const supabase = createSupabaseAdminClient();
  const { data: examRow } = await supabase
    .from("exams")
    .select("*, courses(*)")
    .eq("id", examId)
    .maybeSingle();
  if (!examRow) return null;

  const courseRow = Array.isArray(examRow.courses) ? examRow.courses[0] : examRow.courses;
  if (!courseRow) return null;

  const { data: questionRows } = await supabase
    .from("exam_questions")
    .select("*")
    .eq("exam_id", examId)
    .order("position");

  return {
    exam: mapExam(examRow as ExamRow),
    course: mapCourse(courseRow as CourseRow),
    questions: ((questionRows ?? []) as ExamQuestionRow[]).map((row) => ({
      id: row.id,
      examId: row.exam_id,
      prompt: row.prompt,
      options: row.options,
      correctIndex: row.correct_index,
      position: row.position,
    })),
  };
}

export async function getExamAttempts(userId: string): Promise<ExamAttempt[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("exam_attempts")
    .select("*, exams(course_id, title, courses(title))")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(30);

  type JoinedAttempt = AttemptRow & {
    exams: { course_id: string; title: string; courses: { title: string } | { title: string }[] | null } | null;
  };

  return ((data ?? []) as JoinedAttempt[]).map((row) => {
    const course = Array.isArray(row.exams?.courses) ? row.exams?.courses[0] : row.exams?.courses;
    return {
      id: row.id,
      examId: row.exam_id,
      courseId: row.exams?.course_id ?? "",
      score: row.score,
      total: row.total,
      passed: row.passed,
      completedAt: row.completed_at,
      courseTitle: course?.title ?? row.exams?.title,
    };
  });
}

export async function getPayments(userId: string): Promise<Payment[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("*, courses(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  type JoinedPayment = PaymentRow & { courses: { title: string } | { title: string }[] | null };
  return ((data ?? []) as JoinedPayment[]).map((row) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return {
      id: row.id,
      reference: row.reference,
      userId: row.user_id,
      courseId: row.course_id,
      amountKobo: Number(row.amount_kobo),
      status: row.status,
      provider: row.provider,
      originalAmountKobo: Number(row.original_amount_kobo ?? row.amount_kobo),
      discountKobo: Number(row.discount_kobo ?? 0),
      couponId: row.coupon_id ?? null,
      saleChannel: (row.sale_channel as Payment["saleChannel"]) ?? "marketplace",
      referralCode: row.referral_code ?? "",
      createdAt: row.created_at,
      courseTitle: course?.title,
    };
  });
}

export async function getCertificates(userId: string): Promise<Certificate[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificates")
    .select("*, courses(title, slug)")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  type JoinedCertificate = CertificateRow & {
    courses: { title: string; slug: string } | { title: string; slug: string }[] | null;
  };
  return ((data ?? []) as JoinedCertificate[]).map((row) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return {
      ...mapCertificate(row),
      courseTitle: course?.title,
      courseSlug: course?.slug,
    };
  });
}

export async function getCertificateBySerial(serial: string) {
  if (!isSupabaseAdminConfigured) return null;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("certificates")
    .select("*, courses(title, slug), profiles(full_name)")
    .eq("serial", serial)
    .maybeSingle();
  if (!data) return null;

  type JoinedCertificate = CertificateRow & {
    courses: { title: string; slug: string } | { title: string; slug: string }[] | null;
    profiles: { full_name: string } | { full_name: string }[] | null;
  };
  const row = data as JoinedCertificate;
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    ...mapCertificate(row),
    studentName: profile?.full_name || "LearnHub Graduate",
    courseTitle: course?.title,
    courseSlug: course?.slug,
  } satisfies Certificate;
}

export async function isEnrolled(userId: string, courseId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return Boolean(data);
}

// =========================================================
// Instructor / teaching workspace
// =========================================================
export type TeacherClass = Course & {
  paidStudents: number;
  completedStudents: number;
  revenueKobo: number;
  earningsKobo: number;
  isOwner: boolean;
};

export type TeacherStudent = {
  userId: string;
  fullName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  enrolledAt: string;
  amountKobo: number;
  paymentStatus: "pending" | "success" | "failed" | string;
  enrollmentStatus: "active" | "completed" | string;
};

type TeacherStudentRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  course_id: string;
  course_title: string;
  course_slug: string;
  enrolled_at: string;
  amount_kobo: number;
  payment_status: string;
  enrollment_status: string;
};

type AssignmentRow = { course_id: string; teacher_id: string };

type InstructorProfileRow = {
  user_id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  website: string | null;
  avatar_url: string | null;
  expertise: string[] | null;
  is_public: boolean;
  revenue_share_percent: number;
  marketplace_share_percent: number;
  referral_share_percent: number;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  created_at: string;
  updated_at: string;
};

type InstructorApplicationRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  course_topic: string;
  experience: string;
  additional_info: string;
  status: "pending" | "approved" | "rejected";
  review_note: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type InstructorEarningRow = {
  id: string;
  payment_id: string;
  instructor_id: string;
  course_id: string;
  gross_kobo: number;
  share_percent: number;
  amount_kobo: number;
  sale_channel: "marketplace" | "referral";
  platform_amount_kobo: number;
  created_at: string;
  courses?: { title: string } | { title: string }[] | null;
};

type PayoutRequestRow = {
  id: string;
  instructor_id: string;
  amount_kobo: number;
  status: PayoutRequest["status"];
  bank_name: string;
  account_name: string;
  account_number: string;
  note: string;
  review_note: string;
  reference: string;
  created_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
};

function joinedTitle(value: { title: string } | { title: string }[] | null | undefined) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0]?.title : value.title;
}

function joinedName(value: { full_name: string | null } | { full_name: string | null }[] | null | undefined) {
  if (!value) return undefined;
  const row = Array.isArray(value) ? value[0] : value;
  return row?.full_name ?? undefined;
}

export function mapInstructorProfile(row: InstructorProfileRow): InstructorProfile {
  return {
    userId: row.user_id,
    slug: row.slug,
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    avatarUrl: row.avatar_url ?? null,
    expertise: row.expertise ?? [],
    isPublic: row.is_public,
    revenueSharePercent: Number(row.revenue_share_percent),
    marketplaceSharePercent: Number(row.marketplace_share_percent),
    referralSharePercent: Number(row.referral_share_percent),
    bankName: row.bank_name ?? "",
    accountName: row.account_name ?? "",
    accountNumber: row.account_number ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapInstructorApplication(row: InstructorApplicationRow): InstructorApplication {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    courseTopic: row.course_topic,
    experience: row.experience,
    additionalInfo: row.additional_info,
    status: row.status,
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

function mapPayout(row: PayoutRequestRow): PayoutRequest {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    instructorName: joinedName(row.profiles),
    amountKobo: Number(row.amount_kobo),
    status: row.status,
    bankName: row.bank_name,
    accountName: row.account_name,
    accountNumber: row.account_number,
    note: row.note,
    reviewNote: row.review_note,
    reference: row.reference,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    paidAt: row.paid_at,
  };
}

export async function getTeacherCourses(teacherId: string): Promise<TeacherClass[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const [{ data: assignmentRows }, { data: ownedRows }] = await Promise.all([
    supabase.from("course_teachers").select("course_id, teacher_id").eq("teacher_id", teacherId),
    supabase.from("courses").select("id").eq("instructor_id", teacherId),
  ]);

  const courseIds = Array.from(
    new Set([
      ...((assignmentRows ?? []) as AssignmentRow[]).map((row) => row.course_id),
      ...((ownedRows ?? []) as { id: string }[]).map((row) => row.id),
    ]),
  );
  if (!courseIds.length) return [];

  const [{ data: courseRows }, { data: enrollmentRows }, { data: paymentRows }, { data: earningRows }] = await Promise.all([
    supabase.from("courses").select("*, lessons(count), enrollments(count)").in("id", courseIds),
    supabase.from("enrollments").select("course_id, user_id, status").in("course_id", courseIds),
    supabase.from("payments").select("course_id, amount_kobo, status").in("course_id", courseIds).eq("status", "success"),
    supabase.from("instructor_earnings").select("course_id, amount_kobo").eq("instructor_id", teacherId),
  ]);

  const courses = ((courseRows ?? []) as CourseRow[]).map(mapCourse);
  const enrollments = (enrollmentRows ?? []) as { course_id: string; user_id: string; status: string }[];
  const payments = (paymentRows ?? []) as { course_id: string; amount_kobo: number }[];
  const earnings = (earningRows ?? []) as { course_id: string; amount_kobo: number }[];

  return courses.map((course) => {
    const courseEnrollments = enrollments.filter((row) => row.course_id === course.id);
    const paidStudents = new Set(courseEnrollments.map((row) => row.user_id)).size;
    return {
      ...course,
      isOwner: course.instructorId === teacherId,
      paidStudents,
      completedStudents: courseEnrollments.filter((row) => row.status === "completed").length,
      revenueKobo: payments
        .filter((row) => row.course_id === course.id)
        .reduce((sum, row) => sum + Number(row.amount_kobo), 0),
      earningsKobo: earnings
        .filter((row) => row.course_id === course.id)
        .reduce((sum, row) => sum + Number(row.amount_kobo), 0),
    };
  });
}

export const getInstructorCourses = getTeacherCourses;

export type TeacherStudioCourse = {
  course: Course;
  lessons: Lesson[];
  modules: CourseModule[];
};

export async function getTeacherStudioCourse(teacherId: string, courseId: string): Promise<TeacherStudioCourse | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: owned }, { data: assignment }] = await Promise.all([
    supabase.from("courses").select("id").eq("id", courseId).eq("instructor_id", teacherId).maybeSingle(),
    supabase.from("course_teachers").select("course_id").eq("teacher_id", teacherId).eq("course_id", courseId).maybeSingle(),
  ]);
  if (!owned && !assignment) return null;

  const [{ data: courseRow }, { data: lessonRows }, { data: moduleRows }] = await Promise.all([
    supabase.from("courses").select("*, lessons(count), enrollments(count)").eq("id", courseId).maybeSingle(),
    supabase.from("lessons").select("*").eq("course_id", courseId).order("position"),
    supabase.from("course_modules").select("*").eq("course_id", courseId).order("position"),
  ]);
  if (!courseRow) return null;

  const course = mapCourse(courseRow as CourseRow);
  const lessons = ((lessonRows ?? []) as LessonRow[]).map(mapLesson);
  return {
    course: { ...course, lessonsCount: lessons.length },
    lessons,
    modules: ((moduleRows ?? []) as ModuleRow[]).map(mapModule),
  };
}

export async function getTeacherStudents(): Promise<TeacherStudent[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("teacher_students");
  if (error) {
    console.warn("Could not load teacher roster:", error.message);
    return [];
  }

  return ((data ?? []) as TeacherStudentRow[]).map((row) => ({
    userId: row.user_id,
    fullName: row.full_name || "Student",
    email: row.email || "—",
    courseId: row.course_id,
    courseTitle: row.course_title,
    courseSlug: row.course_slug,
    enrolledAt: row.enrolled_at,
    amountKobo: Number(row.amount_kobo),
    paymentStatus: row.payment_status,
    enrollmentStatus: row.enrollment_status,
  }));
}

export async function getInstructorProfile(userId: string): Promise<InstructorProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("instructor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? mapInstructorProfile(data as InstructorProfileRow) : null;
}

export async function getInstructorBySlug(slug: string): Promise<{ instructor: InstructorProfile; courses: Course[] } | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("instructor_profiles")
    .select("*, profiles(full_name)")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;

  const row = data as InstructorProfileRow & {
    profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  };
  const { data: courseRows } = await supabase
    .from("courses")
    .select("*, lessons(count), enrollments(count)")
    .eq("instructor_id", row.user_id)
    .eq("published", true)
    .order("created_at", { ascending: false });

  return {
    instructor: {
      ...mapInstructorProfile(row),
      fullName: joinedName(row.profiles) ?? "Instructor",
    },
    courses: ((courseRows ?? []) as CourseRow[]).map(mapCourse),
  };
}

export async function getCourseInstructor(courseId: string): Promise<InstructorProfile | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return null;
  const { data: course } = await supabase
    .from("courses")
    .select("instructor_id")
    .eq("id", courseId)
    .maybeSingle();
  const instructorId = (course as { instructor_id?: string | null } | null)?.instructor_id;
  if (!instructorId) return null;

  const { data } = await supabase
    .from("instructor_profiles")
    .select("*, profiles(full_name)")
    .eq("user_id", instructorId)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;
  const row = data as InstructorProfileRow & {
    profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  };
  return {
    ...mapInstructorProfile(row),
    fullName: joinedName(row.profiles) ?? "Instructor",
  };
}

export async function getInstructors(): Promise<InstructorProfile[]> {
  const admin = await getAdminClient();
  const [{ data: profileRows }, { data: courseRows }, { data: enrollmentRows }] = await Promise.all([
    admin
      .from("instructor_profiles")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false }),
    admin.from("courses").select("id, instructor_id"),
    admin.from("enrollments").select("course_id"),
  ]);
  const emails = await getAdminUserEmails();
  const courses = (courseRows ?? []) as { id: string; instructor_id: string | null }[];
  const enrollments = (enrollmentRows ?? []) as { course_id: string }[];

  return ((profileRows ?? []) as (InstructorProfileRow & {
    profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  })[]).map((row) => {
    const owned = courses.filter((course) => course.instructor_id === row.user_id);
    const ownedIds = new Set(owned.map((course) => course.id));
    return {
      ...mapInstructorProfile(row),
      fullName: joinedName(row.profiles) ?? "Instructor",
      email: emails.get(row.user_id) ?? "—",
      courseCount: owned.length,
      studentCount: enrollments.filter((enrollment) => ownedIds.has(enrollment.course_id)).length,
    };
  });
}

export async function getInstructorEarnings(instructorId: string): Promise<InstructorEarning[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("instructor_earnings")
    .select("*, courses(title)")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as InstructorEarningRow[]).map((row) => ({
    id: row.id,
    paymentId: row.payment_id,
    instructorId: row.instructor_id,
    courseId: row.course_id,
    courseTitle: joinedTitle(row.courses),
    grossKobo: Number(row.gross_kobo),
    sharePercent: Number(row.share_percent),
    amountKobo: Number(row.amount_kobo),
    saleChannel: row.sale_channel ?? "marketplace",
    platformAmountKobo: Number(row.platform_amount_kobo ?? 0),
    createdAt: row.created_at,
  }));
}

export async function getInstructorAvailableBalance(instructorId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("instructor_available_balance", {
    target_instructor: instructorId,
  });
  if (error) return 0;
  return Number(data ?? 0);
}

export async function getInstructorPayouts(instructorId: string): Promise<PayoutRequest[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as PayoutRequestRow[]).map(mapPayout);
}

export async function getPayoutRequests(): Promise<PayoutRequest[]> {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("payout_requests")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
  return ((data ?? []) as PayoutRequestRow[]).map(mapPayout);
}

export async function getInstructorApplications(): Promise<InstructorApplication[]> {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("instructor_applications")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data ?? []) as InstructorApplicationRow[]).map(mapInstructorApplication);
}

export async function getPendingCourseApprovals(): Promise<(Course & { instructorName?: string })[]> {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("courses")
    .select("*, lessons(count), enrollments(count), profiles(full_name)")
    .in("review_status", ["pending", "rejected"])
    .order("submitted_at", { ascending: false });
  return ((data ?? []) as (CourseRow & {
    profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
  })[]).map((row) => ({
    ...mapCourse(row),
    instructorName: joinedName(row.profiles),
  }));
}

export async function getAdminCourses(): Promise<Course[]> {
  const admin = await getAdminClient();
  const { data, error } = await admin
    .from("courses")
    .select("*, lessons(count), enrollments(count)")
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("Could not load admin courses:", error.message);
    return [];
  }
  return ((data ?? []) as CourseRow[]).map(mapCourse);
}

export type AdminTeacher = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  courseIds: string[];
  ownedCourseIds: string[];
  slug: string | null;
  revenueSharePercent: number;
  isPublic: boolean;
};

export async function getAdminTeachers(): Promise<AdminTeacher[]> {
  const admin = await getAdminClient();
  const [{ data: profileRows }, { data: assignmentRows }, { data: ownedRows }, { data: instructorRows }] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, created_at").eq("role", "teacher").order("created_at", { ascending: false }),
    admin.from("course_teachers").select("course_id, teacher_id"),
    admin.from("courses").select("id, instructor_id").not("instructor_id", "is", null),
    admin.from("instructor_profiles").select("user_id, slug, revenue_share_percent, is_public"),
  ]);

  const profiles = (profileRows ?? []) as { id: string; full_name: string | null; created_at: string }[];
  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const owned = (ownedRows ?? []) as { id: string; instructor_id: string }[];
  const instructorProfiles = (instructorRows ?? []) as {
    user_id: string;
    slug: string;
    revenue_share_percent: number;
    is_public: boolean;
  }[];
  const emails = await getAdminUserEmails();

  return profiles.map((profile) => {
    const instructor = instructorProfiles.find((row) => row.user_id === profile.id);
    return {
      id: profile.id,
      fullName: profile.full_name || "Instructor",
      email: emails.get(profile.id) ?? "—",
      createdAt: profile.created_at,
      courseIds: assignments.filter((row) => row.teacher_id === profile.id).map((row) => row.course_id),
      ownedCourseIds: owned.filter((row) => row.instructor_id === profile.id).map((row) => row.id),
      slug: instructor?.slug ?? null,
      revenueSharePercent: Number(instructor?.revenue_share_percent ?? 60),
      isPublic: instructor?.is_public ?? false,
    };
  });
}

export async function getAdminUserEmails(): Promise<Map<string, string>> {
  const emails = new Map<string, string>();

  if (isSupabaseAdminConfigured) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of data?.users ?? []) {
      if (user.email) emails.set(user.id, user.email);
    }
    if (emails.size) return emails;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return emails;

  const { data } = await supabase.rpc("admin_user_directory");
  for (const row of (data ?? []) as { id: string; email: string }[]) {
    if (row.email) emails.set(row.id, row.email);
  }
  return emails;
}

// =========================================================
// Modules, Q&A and announcements
// =========================================================
export async function getCourseModules(courseId: string): Promise<CourseModule[]> {
  try {
    const supabase = await getAdminClient();
    const { data } = await supabase.from("course_modules").select("*").eq("course_id", courseId).order("position");
    return ((data ?? []) as ModuleRow[]).map(mapModule);
  } catch {
    return [];
  }
}

function mapAnswer(row: AnswerRow): CourseAnswer {
  return {
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    authorName: joinedName(row.profiles) ?? "Learner",
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapQuestion(row: QuestionRow): CourseQuestion {
  return {
    id: row.id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    userId: row.user_id,
    authorName: joinedName(row.profiles) ?? "Learner",
    body: row.body,
    resolved: row.resolved,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    answers: (row.course_answers ?? []).map(mapAnswer).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export async function getCourseQuestions(courseId: string, lessonId?: string): Promise<CourseQuestion[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase
    .from("course_questions")
    .select("*, profiles(full_name), course_answers(*, profiles(full_name))")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (lessonId) query = query.eq("lesson_id", lessonId);
  const { data, error } = await query;
  if (error) {
    console.warn("Could not load course questions:", error.message);
    return [];
  }
  return ((data ?? []) as QuestionRow[]).map(mapQuestion);
}

function mapAnnouncement(row: AnnouncementRow): CourseAnnouncement {
  return {
    id: row.id,
    courseId: row.course_id,
    createdBy: row.created_by,
    authorName: joinedName(row.profiles) ?? "Instructor",
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getCourseAnnouncements(courseId: string): Promise<CourseAnnouncement[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("course_announcements")
    .select("*, profiles(full_name)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("Could not load announcements:", error.message);
    return [];
  }
  return ((data ?? []) as AnnouncementRow[]).map(mapAnnouncement);
}

// =========================================================
// Coupons
// =========================================================
function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    courseId: row.course_id,
    courseTitle: joinedTitle(row.courses),
    instructorId: row.instructor_id,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    maxRedemptions: row.max_redemptions == null ? null : Number(row.max_redemptions),
    redeemedCount: countOf(row.coupon_redemptions),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function getCoupons(options?: { instructorId?: string; courseId?: string }): Promise<Coupon[]> {
  const admin = await getAdminClient();
  let query = admin
    .from("coupons")
    .select("*, courses(title), coupon_redemptions(count)")
    .order("created_at", { ascending: false });
  if (options?.instructorId) query = query.eq("instructor_id", options.instructorId);
  if (options?.courseId) query = query.eq("course_id", options.courseId);
  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as CouponRow[]).map(mapCoupon);
}

// =========================================================
// Manual payments
// =========================================================
export const EMPTY_MANUAL_PAYMENT_DETAILS: ManualPaymentDetails = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  instructions: "",
};

export async function getManualPaymentDetails(): Promise<ManualPaymentDetails> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return EMPTY_MANUAL_PAYMENT_DETAILS;
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "manual_payment_details")
    .maybeSingle();
  if (error || !data?.value) return EMPTY_MANUAL_PAYMENT_DETAILS;
  const value = data.value as Record<string, unknown>;
  return {
    bankName: String(value.bank_name ?? ""),
    accountName: String(value.account_name ?? ""),
    accountNumber: String(value.account_number ?? ""),
    instructions: String(value.instructions ?? ""),
  };
}

export type PlatformFinanceSettings = {
  marketplaceSharePercent: number;
  referralSharePercent: number;
  minimumPayoutKobo: number;
  manualPaymentDetails: ManualPaymentDetails;
};

export async function getPlatformFinanceSettings(): Promise<PlatformFinanceSettings> {
  const fallback: PlatformFinanceSettings = {
    marketplaceSharePercent: 50,
    referralSharePercent: 80,
    minimumPayoutKobo: 0,
    manualPaymentDetails: EMPTY_MANUAL_PAYMENT_DETAILS,
  };
  if (!isSupabaseAdminConfigured) return fallback;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("key, value")
    .in("key", ["marketplace_share_percent", "referral_share_percent", "minimum_payout_kobo", "manual_payment_details"]);
  if (!data) return fallback;

  const map = new Map(data.map((row) => [row.key as string, row.value]));
  const details = (map.get("manual_payment_details") ?? {}) as Record<string, unknown>;
  const numberFor = (key: string, fallbackValue: number) => {
    const value = map.get(key);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallbackValue;
  };

  return {
    marketplaceSharePercent: numberFor("marketplace_share_percent", fallback.marketplaceSharePercent),
    referralSharePercent: numberFor("referral_share_percent", fallback.referralSharePercent),
    minimumPayoutKobo: numberFor("minimum_payout_kobo", fallback.minimumPayoutKobo),
    manualPaymentDetails: {
      bankName: String(details.bank_name ?? ""),
      accountName: String(details.account_name ?? ""),
      accountNumber: String(details.account_number ?? ""),
      instructions: String(details.instructions ?? ""),
    },
  };
}

function mapPaymentSubmission(row: PaymentSubmissionRow): PaymentSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    studentName: joinedName(row.profiles),
    studentEmail: row.profiles
      ? Array.isArray(row.profiles)
        ? row.profiles[0]?.email ?? undefined
        : row.profiles.email ?? undefined
      : undefined,
    courseId: row.course_id,
    courseTitle: joinedTitle(row.courses),
    courseSlug: row.courses
      ? Array.isArray(row.courses)
        ? row.courses[0]?.slug
        : row.courses.slug
      : undefined,
    couponId: row.coupon_id,
    couponCode: row.coupons ? (Array.isArray(row.coupons) ? row.coupons[0]?.code : row.coupons.code) : null,
    originalAmountKobo: Number(row.original_amount_kobo),
    discountKobo: Number(row.discount_kobo),
    amountKobo: Number(row.amount_kobo),
    saleChannel: row.sale_channel,
    referralCode: row.referral_code,
    payerName: row.payer_name,
    payerPhone: row.payer_phone,
    bankReference: row.bank_reference,
    note: row.note,
    proofPath: row.proof_path,
    status: row.status,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    paymentId: row.payment_id,
    createdAt: row.created_at,
  };
}

export async function getPaymentSubmissions(userId: string): Promise<PaymentSubmission[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("*, courses(title, slug), coupons(code)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return ((data ?? []) as PaymentSubmissionRow[]).map(mapPaymentSubmission);
}

export async function getLatestPaymentSubmission(userId: string, courseId: string): Promise<PaymentSubmission | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("payment_submissions")
    .select("*, courses(title, slug), coupons(code)")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapPaymentSubmission(data as PaymentSubmissionRow) : null;
}

export async function getPaymentSubmissionsForReview(): Promise<PaymentSubmission[]> {
  if (!isSupabaseAdminConfigured) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("payment_submissions")
    .select("*, courses(title, slug), profiles(full_name, email), coupons(code)")
    .order("created_at", { ascending: false });
  if (error) return [];
  return ((data ?? []) as PaymentSubmissionRow[]).map(mapPaymentSubmission);
}
