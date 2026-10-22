"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { submitReviewAction, type ReviewState } from "@/app/actions/reviews";

export function ReviewForm({ courseId, slug }: { courseId: string; slug: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReviewAction, {});

  if (state.message) {
    return (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-3 text-sm text-[var(--success)]">
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-solid)_45%,transparent)] p-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-3">
        <label htmlFor="rating" className="text-sm font-semibold">Your rating</label>
        <select id="rating" name="rating" className="select w-auto" defaultValue="5">
          <option value="5">★★★★★ Excellent</option>
          <option value="4">★★★★☆ Good</option>
          <option value="3">★★★☆☆ Okay</option>
          <option value="2">★★☆☆☆ Poor</option>
          <option value="1">★☆☆☆☆ Bad</option>
        </select>
      </div>
      <textarea
        name="comment"
        className="textarea min-h-24 resize-y"
        placeholder="What did you find most useful? Keep it helpful for other learners."
        maxLength={600}
        required
      />
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Publish review
        </button>
      </div>
    </form>
  );
}
