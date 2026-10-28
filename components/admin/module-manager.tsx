import { ChevronDown, FolderPlus, Layers, Save, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { CourseModule } from "@/lib/types";

export function ModuleManager({
  courseId,
  modules,
  saveAction,
  deleteAction,
}: {
  courseId: string;
  modules: CourseModule[];
  saveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <section className="admin-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Layers size={17} className="text-[var(--accent-2)]" /> Modules
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Group lessons into sections. Lessons without a module still appear in the curriculum.
          </p>
        </div>
        <span className="badge badge-muted">{modules.length} modules</span>
      </div>

      <div className="mt-4 space-y-2">
        {modules.map((module) => (
          <details key={module.id} className="group rounded-xl border border-[var(--line)]">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)] text-[11px] font-bold text-[var(--accent-2)]">
                {module.position}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{module.title}</span>
              <ChevronDown size={15} className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-[var(--line)] p-3">
              <form action={saveAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="id" value={module.id} />
                <div className="field mb-0 w-20">
                  <label className="label">Order</label>
                  <input name="position" type="number" min={1} defaultValue={module.position} className="input h-9" required />
                </div>
                <div className="field mb-0 min-w-40 flex-1">
                  <label className="label">Module title</label>
                  <input name="title" defaultValue={module.title} className="input h-9" required maxLength={160} />
                </div>
                <button type="submit" className="btn btn-sm">
                  <Save size={13} /> Save
                </button>
              </form>
              <form action={deleteAction} className="mt-3 flex justify-end border-t border-[var(--line)] pt-3">
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="id" value={module.id} />
                <ConfirmButton message={`Delete “${module.title}”? Its lessons stay in the course without a module.`}>
                  <Trash2 size={13} /> Delete module
                </ConfirmButton>
              </form>
            </div>
          </details>
        ))}
        {modules.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-xs text-[var(--muted)]">
            No modules yet. Add one to structure the course.
          </p>
        )}
      </div>

      <form action={saveAction} className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent-2)_5%,transparent)] p-3">
        <input type="hidden" name="courseId" value={courseId} />
        <div className="field mb-0 w-20">
          <label className="label">Order</label>
          <input name="position" type="number" min={1} defaultValue={modules.length + 1} className="input h-9" required />
        </div>
        <div className="field mb-0 min-w-40 flex-1">
          <label className="label">New module title</label>
          <input name="title" placeholder="e.g. Getting started" className="input h-9" required maxLength={160} />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          <FolderPlus size={14} /> Add module
        </button>
      </form>
    </section>
  );
}
