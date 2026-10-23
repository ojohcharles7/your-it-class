export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_RESOURCE_BYTES = 50 * 1024 * 1024;

export const VIDEO_ACCEPT = ".mp4,.webm,.ogg,.mov,.m4v,video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v";
export const RESOURCE_ACCEPT = ".pdf,.doc,.docx,.epub,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip";

export const allowedVideoExtensions = new Set(["mp4", "webm", "ogg", "mov", "m4v"]);
export const allowedVideoTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
]);

export const allowedResourceExtensions = new Set(["pdf", "doc", "docx", "epub"]);

export function resourceContentType(fileName: string, fileType?: string) {
  if (fileType && fileType !== "application/octet-stream") return fileType;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "doc") return "application/msword";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "epub") return "application/epub+zip";
  return "application/pdf";
}

export function videoContentType(fileName: string, fileType?: string) {
  if (fileType) return fileType;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "webm") return "video/webm";
  if (ext === "ogg") return "video/ogg";
  if (ext === "mov") return "video/quicktime";
  if (ext === "m4v") return "video/x-m4v";
  return "video/mp4";
}
