import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"]);
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

function isAllowedFile(file: File): boolean {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) return false;
  if (file.size > MAX_FILE_SIZE) return false;
  return true;
}

export async function saveUploadedFiles(files: File[], folder: "equipments" | "requests") {
  const validFiles = files.filter((file) => file.size > 0 && isAllowedFile(file));

  if (validFiles.length === 0) {
    return [];
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(targetDir, { recursive: true });

  const savedPaths: string[] = [];

  for (const file of validFiles) {
    const ext = path.extname(file.name).toLowerCase();
    const basename = path.basename(file.name, ext);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeFileName(basename)}${ext}`;
    const absolutePath = path.join(targetDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);
    savedPaths.push(`/uploads/${folder}/${filename}`);
  }

  return savedPaths;
}
