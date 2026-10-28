import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LearnHub — Learn tech skills that pay",
    short_name: "LearnHub",
    description:
      "Practical IT courses for Nigerian learners: programming, networking, cybersecurity, data, design and more. Video lessons, projects, exams and verifiable certificates.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#eef2fc",
    theme_color: "#0a84ff",
    lang: "en-NG",
    dir: "ltr",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Browse courses",
        short_name: "Courses",
        description: "Explore all LearnHub courses",
        url: "/courses",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "My dashboard",
        short_name: "Dashboard",
        description: "Continue learning where you left off",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Verify a certificate",
        short_name: "Verify",
        description: "Check a LearnHub certificate",
        url: "/verify",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
