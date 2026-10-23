"use client";

import { Link } from "@/components/console-link";
import { useActionState, useState } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { saveCourseAction } from "@/app/admin/actions";
import type { AdminActionState, Course } from "@/lib/types";

type CourseFormProps = {
  course?: Course;
  action?: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  basePath?: string;
  canPublish?: boolean;
  publishMode?: "admin" | "teacher";
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CourseForm({
  course,
  action: submitAction = saveCourseAction,
  basePath = "/admin/courses",
  canPublish = true,
  publishMode = "admin",
}: CourseFormProps) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(submitAction, {});
  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(course));
  const [gradientStart, setGradientStart] = useState((course?.gradient ?? "#0a84ff,#6d5efc").split(",")[0]?.trim() || "#0a84ff");
  const [gradientEnd, setGradientEnd] = useState((course?.gradient ?? "#0a84ff,#6d5efc").split(",")[1]?.trim() || "#6d5efc");
  const [emoji, setEmoji] = useState(course?.emoji ?? "📘");

  return (
    <form action={action} className="space-y-5">
      {course && <input type="hidden" name="id" value={course.id} />}

      {state.error && (
        <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="field">
            <label htmlFor="title" className="label">Course title</label>
            <input
              id="title"
              name="title"
              className="input"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="slug" className="label">URL slug</label>
            <input
              id="slug"
              name="slug"
              className="input font-mono text-xs"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">Public URL: /courses/{slug || "your-course"}</p>
          </div>
          <div className="field">
            <label htmlFor="description" className="label">Short description</label>
            <textarea
              id="description"
              name="description"
              className="textarea min-h-24"
              defaultValue={course?.description}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="outcomes" className="label">What you will learn (one per line)</label>
            <textarea
              id="outcomes"
              name="outcomes"
              className="textarea min-h-28"
              defaultValue={course?.outcomes.join("\n")}
              placeholder={"Build responsive interfaces\nWork with APIs\nDeploy a live app"}
            />
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-[var(--line)] p-3">
            <div
              className="grid h-28 place-items-center rounded-xl text-4xl"
              style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
            >
              {emoji || "📘"}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Card preview</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="field mb-0">
              <label htmlFor="emoji" className="label">Emoji</label>
              <input
                id="emoji"
                name="emoji"
                className="input text-center text-lg"
                value={emoji}
                onChange={(event) => setEmoji(event.target.value)}
                maxLength={4}
                required
              />
            </div>
            <div className="field mb-0">
              <label htmlFor="level" className="label">Level</label>
              <select id="level" name="level" className="select" defaultValue={course?.level ?? "Beginner"}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gradientStart" className="label">Gradient start</label>
              <input
                id="gradientStart"
                name="gradientStart"
                type="color"
                className="h-10 w-full cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
                value={gradientStart}
                onChange={(event) => setGradientStart(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="gradientEnd" className="label">Gradient end</label>
              <input
                id="gradientEnd"
                name="gradientEnd"
                type="color"
                className="h-10 w-full cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
                value={gradientEnd}
                onChange={(event) => setGradientEnd(event.target.value)}
              />
            </div>
          </div>

          <div className="field mt-3">
            <label htmlFor="category" className="label">Category</label>
            <input
              id="category"
              name="category"
              className="input"
              list="category-options"
              defaultValue={course?.category}
              required
            />
            <datalist id="category-options">
              {["Programming", "Networking", "Security", "Data", "Design", "Hardware", "Business"].map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label htmlFor="priceNaira" className="label">Price (₦)</label>
              <input
                id="priceNaira"
                name="priceNaira"
                type="number"
                min={0}
                step={100}
                className="input"
                defaultValue={course ? course.priceKobo / 100 : 25000}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="hours" className="label">Hours</label>
              <input
                id="hours"
                name="hours"
                type="number"
                min={0}
                step={0.5}
                className="input"
                defaultValue={course?.hours ?? 10}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="rating" className="label">Display rating</label>
            <input
              id="rating"
              name="rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              className="input"
              defaultValue={course?.rating ?? 4.8}
              required
            />
          </div>

          {publishMode === "teacher" ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--line)] p-3 text-sm">
              <input
                type="checkbox"
                name="submitForReview"
                defaultChecked={course?.reviewStatus === "pending"}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <span>
                Submit for review
                <span className="mt-0.5 block text-[11px] font-normal text-[var(--muted)]">
                  An admin publishes the class after review. You can keep editing it while it is in review.
                </span>
              </span>
            </label>
          ) : canPublish ? (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--line)] p-3 text-sm">
              <input
                type="checkbox"
                name="published"
                defaultChecked={course?.published ?? true}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Published (visible in the catalogue)
            </label>
          ) : (
            <p className="rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] p-3 text-xs leading-relaxed text-[var(--muted)]">
              Publishing is reviewed by the master account. Save your course, add the curriculum, then submit it for
              approval.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {course ? "Save changes" : "Create course"}
        </button>
        {course && (
          <Link href={`/courses/${course.slug}`} className="btn" target="_blank">
            <ExternalLink size={15} /> View public page
          </Link>
        )}
        <Link href={basePath} className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
