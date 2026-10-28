export type Role = "student" | "teacher" | "admin" | "master";

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
  bio?: string;
  avatarUrl?: string | null;
};

export type CourseReviewStatus = "draft" | "pending" | "published" | "rejected";

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
  instructorId?: string | null;
  reviewStatus?: CourseReviewStatus;
  reviewNote?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  lessonsCount?: number;
  studentsCount?: number;
};

export type InstructorProfile = {
  userId: string;
  slug: string;
  headline: string;
  bio: string;
  phone: string;
  website: string;
  avatarUrl: string | null;
  expertise: string[];
  isPublic: boolean;
  revenueSharePercent: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  createdAt: string;
  updatedAt: string;
  marketplaceSharePercent: number;
  referralSharePercent: number;
  fullName?: string;
  email?: string;
  courseCount?: number;
  studentCount?: number;
};

export type InstructorApplication = {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string;
  courseTopic: string;
  experience: string;
  additionalInfo: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type InstructorEarning = {
  id: string;
  paymentId: string;
  instructorId: string;
  courseId: string;
  courseTitle?: string;
  studentName?: string;
  grossKobo: number;
  sharePercent: number;
  amountKobo: number;
  saleChannel: "marketplace" | "referral";
  platformAmountKobo: number;
  createdAt: string;
};

export type PayoutRequest = {
  id: string;
  instructorId: string;
  instructorName?: string;
  amountKobo: number;
  status: "pending" | "approved" | "rejected" | "paid";
  bankName: string;
  accountName: string;
  accountNumber: string;
  note: string;
  reviewNote: string;
  reference: string;
  createdAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
};

export type Lesson = {
  id: string;
  courseId: string;
  moduleId?: string | null;
  position: number;
  title: string;
  youtubeId: string;
  videoPath?: string | null;
  videoMime?: string | null;
  videoSize?: number | null;
  hasVideo?: boolean;
  durationMin: number;
  isFree: boolean;
};

export type CourseModule = {
  id: string;
  courseId: string;
  title: string;
  position: number;
  createdAt: string;
};

export type CourseQuestion = {
  id: string;
  courseId: string;
  lessonId: string | null;
  userId: string;
  authorName?: string;
  body: string;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  answers: CourseAnswer[];
};

export type CourseAnswer = {
  id: string;
  questionId: string;
  userId: string;
  authorName?: string;
  body: string;
  createdAt: string;
};

export type CourseAnnouncement = {
  id: string;
  courseId: string;
  createdBy: string;
  authorName?: string;
  title: string;
  body: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  courseId: string | null;
  courseTitle?: string;
  instructorId: string | null;
  discountType: "percent" | "amount";
  discountValue: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export type ManualPaymentDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
};

export type PaymentSubmissionStatus = "pending" | "approved" | "rejected";

export type PaymentSubmission = {
  id: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  courseId: string;
  courseTitle?: string;
  courseSlug?: string;
  couponId: string | null;
  couponCode?: string | null;
  originalAmountKobo: number;
  discountKobo: number;
  amountKobo: number;
  saleChannel: "marketplace" | "referral";
  referralCode: string;
  payerName: string;
  payerPhone: string;
  bankReference: string;
  note: string;
  proofPath: string;
  proofUrl?: string | null;
  status: PaymentSubmissionStatus;
  reviewNote: string;
  reviewedAt: string | null;
  paymentId: string | null;
  createdAt: string;
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
  originalAmountKobo: number;
  discountKobo: number;
  couponId: string | null;
  saleChannel: "marketplace" | "referral";
  referralCode: string;
  createdAt: string;
  courseTitle?: string;
  studentName?: string;
};

export type CourseDetail = Course & {
  lessons: Lesson[];
  modules: CourseModule[];
  reviews: Review[];
  announcements?: CourseAnnouncement[];
};

export type EnrolledCourse = Course & {
  enrollment: Enrollment;
  completedLessons: number;
  progress: number;
  exam?: Exam | null;
  certificate?: Certificate | null;
};
