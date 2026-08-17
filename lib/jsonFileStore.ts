import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/** A tiny JSON-file-backed store with writes serialized to avoid clobbering. */
export function createJsonFileStore<T>(fileName: string, empty: T) {
  const dataDir = process.env.KB_DATA_DIR ?? path.join(process.cwd(), "data");
  const filePath = path.join(dataDir, fileName);

  let queue: Promise<unknown> = Promise.resolve();
  function enqueue<R>(task: () => Promise<R>): Promise<R> {
    const result = queue.then(task, task);
    queue = result.catch(() => undefined);
    return result;
  }

  async function load(): Promise<T> {
    try {
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch (err: any) {
      if (err?.code === "ENOENT") return structuredClone(empty);
      throw err;
    }
  }

  async function save(data: T): Promise<void> {
    await mkdir(dataDir, { recursive: true });
    await writeFile(filePath, JSON.stringify(data), "utf-8");
  }

  function transact<R>(fn: (data: T) => R | Promise<R>): Promise<R> {
    return enqueue(async () => {
      const data = await load();
      return fn(data);
    });
  }

  function transactAndSave<R>(
    fn: (data: T) => R | Promise<R>
  ): Promise<R> {
    return enqueue(async () => {
      const data = await load();
      const result = await fn(data);
      await save(data);
      return result;
    });
  }

  return { transact, transactAndSave };
}
