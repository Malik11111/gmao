import { mkdir, writeFile } from "fs/promises";
import path from "path";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

export async function saveUploadedFiles(files: File[], folder: "equipments" | "requests") {
  const validFiles = files.filter((file) => file.size > 0);

  if (validFiles.length === 0) {
    return [];
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(targetDir, { recursive: true });

  const savedPaths: string[] = [];

  for (const file of validFiles) {
    const extension = path.extname(file.name) || ".bin";
    const basename = path.basename(file.name, extension);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeFileName(basename)}${extension}`;
    const absolutePath = path.join(targetDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);
    savedPaths.push(`/uploads/${folder}/${filename}`);
  }

  return savedPaths;
}
