import { z } from "zod";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function youtubeId(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : trimmed;
}

export const courseInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Course title is required."),
  slug: z.string().trim().min(3, "Slug is required."),
  description: z.string().trim().min(10, "Add a short description."),
  category: z.string().trim().min(2, "Category is required."),
  level: z.string().trim().min(2),
  priceNaira: z.coerce.number().min(0, "Price cannot be negative."),
  hours: z.coerce.number().min(0),
  rating: z.coerce.number().min(0).max(5),
  emoji: z.string().trim().min(1, "Add an emoji."),
  gradientStart: z.string().trim().min(4),
  gradientEnd: z.string().trim().min(4),
  outcomes: z.string().optional(),
  published: z.string().optional(),
});
