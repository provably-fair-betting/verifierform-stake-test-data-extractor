import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const writeJson = async (filePath, data) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};
