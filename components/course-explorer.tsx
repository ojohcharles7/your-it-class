"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import type { Course } from "@/lib/types";

const levels = ["All", "Beginner", "Intermediate", "Advanced"];

export function CourseExplorer({
  courses,
  categories,
  initialQuery = "",
}: {
  courses: Course[];
  categories: string[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("popular");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const result = courses.filter((course) => {
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q);
      const matchesCategory = category === "All" || course.category === category;
      const matchesLevel = level === "All" || course.level === level;
      return matchesQuery && matchesCategory && matchesLevel;
    });

    return result.sort((a, b) => {
      if (sort === "price-low") return a.priceKobo - b.priceKobo;
      if (sort === "price-high") return b.priceKobo - a.priceKobo;
      if (sort === "rating") return b.rating - a.rating;
      return (b.studentsCount ?? 0) - (a.studentsCount ?? 0);
    });
  }, [courses, deferredQuery, category, level, sort]);

  const hasFilters = Boolean(query || category !== "All" || level !== "All");

  function reset() {
    setQuery("");
    setCategory("All");
    setLevel("All");
  }

  return (
    <div>
      <div className="glass mb-6 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="input pl-10"
              placeholder="Search courses, topics or categories…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search courses"
            />
            {query && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[var(--muted)]" />
            <select className="select w-auto" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort courses">
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] sm:w-16">
              Category
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {["All", ...categories].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip"
                  data-active={category === item}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] sm:w-16">
              Level
            </span>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by level">
              {levels.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip"
                  data-active={level === item}
                  aria-pressed={level === item}
                  onClick={() => setLevel(item)}
                >
                  {item}
                </button>
              ))}
              {hasFilters && (
                <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={reset}>
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          <span className="font-semibold text-[var(--ink)]">{filtered.length}</span> course
          {filtered.length === 1 ? "" : "s"} found
        </p>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="glass p-10 text-center">
          <p className="text-4xl">🔍</p>
          <h3 className="mt-3 text-lg font-semibold">No courses match your filters</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Try a different search term or reset the filters.</p>
          <button type="button" className="btn btn-primary mt-4" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
