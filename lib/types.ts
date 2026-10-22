export type Role = "student" | "teacher" | "admin" | "super_admin";

export type AdminActionState = {
  error?: string;
  message?: string;
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced" | string;
  priceKobo: number;
  hours: number;
  rating: number;
  emoji: string;
  gradient: string;
  outcomes: string[];
  published: boolean;
  lessonsCount?: number;
  studentsCount?: number;
};

export type Lesson = {
  id: string;
  courseId: string;
  position: number;
  title: string;
  youtubeId: string;
  durationMin: number;
  isFree: boolean;
};

export type CourseResource = {
  id: string;
  courseId: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
};

export type Review = {
  id: string;
  courseId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  status: "active" | "completed";
  amountKobo: number;
  paystackRef: string | null;
  createdAt: string;
};

export type LessonProgress = {
  lessonId: string;
  completedAt: string;
};

export type Exam = {
  id: string;
  courseId: string;
  title: string;
  passScore: number;
  timeLimitMin: number;
  questionCount?: number;
};

export type ExamQuestion = {
  id: string;
  examId: string;
  prompt: string;
  options: string[];
  position: number;
};

export type ExamAttempt = {
  id: string;
  examId: string;
  courseId: string;
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
  courseTitle?: string;
};

export type Certificate = {
  id: string;
  userId: string;
  courseId: string;
  serial: string;
  issuedAt: string;
  studentName?: string;
  courseTitle?: string;
  courseSlug?: string;
};

export type Payment = {
  id: string;
  reference: string;
  userId: string;
  courseId: string;
  amountKobo: number;
  status: "pending" | "success" | "failed";
  provider: string;
  createdAt: string;
  courseTitle?: string;
  studentName?: string;
};

export type CourseDetail = Course & {
  lessons: Lesson[];
  reviews: Review[];
};

export type EnrolledCourse = Course & {
  enrollment: Enrollment;
  completedLessons: number;
  progress: number;
  exam?: Exam | null;
  certificate?: Certificate | null;
};
