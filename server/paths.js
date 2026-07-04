import { resolve, sep } from "path";

export function resolveSafePath(baseDir, relPath) {
  const target = resolve(baseDir, relPath || "");
  if (target !== baseDir && !target.startsWith(baseDir + sep)) {
    throw new Error("Path outside base directory");
  }
  return target;
}
