import path from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"]);
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function isAllowedFile(file: File): boolean {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) return false;
  if (file.size > MAX_FILE_SIZE) return false;
  return true;
}

export async function saveUploadedFiles(files: File[], _folder: "equipments" | "requests") {
  const validFiles = files.filter((file) => file.size > 0 && isAllowedFile(file));

  if (validFiles.length === 0) {
    return [];
  }

  const dataUrls: string[] = [];

  for (const file of validFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    dataUrls.push(`data:${mimeType};base64,${base64}`);
  }

  return dataUrls;
}
