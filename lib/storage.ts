import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDir();
  const fullPath = path.join(DATA_DIR, fileName);

  try {
    const content = await fs.readFile(fullPath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    const isMissing =
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT";

    if (!isMissing) {
      throw error;
    }

    await fs.writeFile(fullPath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
  await ensureDir();
  const fullPath = path.join(DATA_DIR, fileName);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
}
