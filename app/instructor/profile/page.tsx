import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserRound } from "lucide-react";
import { InstructorProfileForm } from "@/components/instructor/profile-form";
import { requireInstructor } from "@/lib/auth";
import { getInstructorProfile } from "@/lib/data";
import { slugify } from "@/lib/course-input";

export const metadata: Metadata = { title: "Instructor profile" };
export const dynamic = "force-dynamic";

export default async function InstructorProfilePage() {
  const current = await requireInstructor();
  const profile = await getInstructorProfile(current.id);
  const fallbackName = current.profile.fullName || current.email.split("@")[0] || "Instructor";
  const fallbackSlug = slugify(fallbackName) || `instructor-${current.id.slice(0, 6)}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Studio</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Instructor profile</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This is what learners see when they visit your public instructor page.
          </p>
        </div>
        {profile?.isPublic && (
          <Link href={`/instructors/${profile.slug}`} target="_blank" className="btn btn-sm self-start sm:self-auto">
            <ExternalLink size={14} /> View public profile
          </Link>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <section className="admin-card p-5 sm:p-6">
          <InstructorProfileForm
            profile={profile ? { ...profile, fullName: fallbackName } : null}
            fallbackName={fallbackName}
            fallbackSlug={fallbackSlug}
          />
        </section>

        <aside className="admin-card h-fit p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
            <UserRound size={19} />
          </span>
          <h2 className="mt-3 text-sm font-semibold">Profile tips</h2>
          <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[var(--muted)]">
            <li>Use a clear headline that says what you teach.</li>
            <li>Mention real projects, tools and years of experience.</li>
            <li>Publish at least one course so learners can see your teaching.</li>
            <li>Keep bank details accurate before requesting a payout.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
