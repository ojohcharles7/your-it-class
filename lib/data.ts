import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabasePublicClient } from "./supabase/public";
import { createSupabaseAdminClient } from "./supabase/admin";
import { getAdminClient } from "./supabase/admin-data";
import { isSupabaseAdminConfigured } from "./env";
import { fixtureCourses, fixtureLessons, fixtureReviews } from "./fixtures";
import type {
  Certificate,
  Course,
  CourseDetail,
  CourseResource,
  EnrolledCourse,
  Enrollment,
  Exam,
  ExamAttempt,
  ExamQuestion,
  Lesson,
  LessonProgress,
  Payment,
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
  lessons?: Count;
  enrollments?: Count;
};

type LessonRow = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  youtube_id: string;
  duration_min: number;
  is_free: boolean;
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
    lessonsCount: countOf(row.lessons),
    studentsCount: countOf(row.enrollments),
  };
}

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    position: row.position,
    title: row.title,
    youtubeId: row.youtube_id,
    durationMin: row.duration_min,
    isFree: row.is_free,
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
      reviews: fixtureReviews.filter((review) => review.courseId === course.id),
    };
  }
  if (!data) return null;

  const course = mapCourse(data as CourseRow);
  const [{ data: lessonRows }, { data: reviewRows }] = await Promise.all([
    supabase.from("lessons").select("*").eq("course_id", course.id).order("position"),
    supabase.from("reviews").select("*").eq("course_id", course.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const lessons = ((lessonRows ?? []) as LessonRow[]).map(mapLesson);
  return {
    ...course,
    lessonsCount: lessons.length,
    lessons,
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

  const [{ data: lessonRows }, { data: progressRows }, { data: examRow }, { data: certificateRow }] = await Promise.all([
    supabase.from("lessons").select("*").eq("course_id", course.id).order("position"),
    supabase.from("lesson_progress").select("lesson_id, completed_at").eq("user_id", userId),
    supabase.from("exams").select("*, exam_questions(count)").eq("course_id", course.id).maybeSingle(),
    supabase.from("certificates").select("*").eq("user_id", userId).eq("course_id", course.id).maybeSingle(),
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
    studentName: profile?.full_name || "Your IT Class Graduate",
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
// Teaching workspace
// =========================================================
export type TeacherClass = Course & {
  paidStudents: number;
  completedStudents: number;
  revenueKobo: number;
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

export async function getTeacherCourses(teacherId: string): Promise<TeacherClass[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("course_teachers")
    .select("course_id, teacher_id")
    .eq("teacher_id", teacherId);
  if (assignmentError || !assignmentRows?.length) return [];

  const courseIds = (assignmentRows as AssignmentRow[]).map((row) => row.course_id);
  const [{ data: courseRows }, { data: enrollmentRows }, { data: paymentRows }] = await Promise.all([
    supabase.from("courses").select("*, lessons(count), enrollments(count)").in("id", courseIds),
    supabase.from("enrollments").select("course_id, user_id, status").in("course_id", courseIds),
    supabase.from("payments").select("course_id, amount_kobo, status").in("course_id", courseIds).eq("status", "success"),
  ]);

  const courses = ((courseRows ?? []) as CourseRow[]).map(mapCourse);
  const enrollments = (enrollmentRows ?? []) as { course_id: string; user_id: string; status: string }[];
  const payments = (paymentRows ?? []) as { course_id: string; amount_kobo: number }[];

  return courses.map((course) => {
    const courseEnrollments = enrollments.filter((row) => row.course_id === course.id);
    const paidStudents = new Set(courseEnrollments.map((row) => row.user_id)).size;
    return {
      ...course,
      paidStudents,
      completedStudents: courseEnrollments.filter((row) => row.status === "completed").length,
      revenueKobo: payments
        .filter((row) => row.course_id === course.id)
        .reduce((sum, row) => sum + Number(row.amount_kobo), 0),
    };
  });
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
};

export async function getAdminTeachers(): Promise<AdminTeacher[]> {
  const admin = await getAdminClient();
  const [{ data: profileRows }, { data: assignmentRows }] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, created_at").eq("role", "teacher").order("created_at", { ascending: false }),
    admin.from("course_teachers").select("course_id, teacher_id"),
  ]);

  const profiles = (profileRows ?? []) as { id: string; full_name: string | null; created_at: string }[];
  const assignments = (assignmentRows ?? []) as AssignmentRow[];
  const emails = await getAdminUserEmails();

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name || "Teacher",
    email: emails.get(profile.id) ?? "—",
    createdAt: profile.created_at,
    courseIds: assignments.filter((row) => row.teacher_id === profile.id).map((row) => row.course_id),
  }));
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
