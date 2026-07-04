import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join, extname, resolve } from "path";
import { readdir, stat } from "fs/promises";
import { createReadStream } from "fs";
import { execFile, execFileSync } from "child_process";
import os from "os";
import { resolveSafePath } from "./paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

function detectDownloadsDir() {
  try {
    return execFileSync("xdg-user-dir", ["DOWNLOAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return join(os.homedir(), "Downloads");
  }
}

const FILES_BASE_DIR = resolve(
  process.env.FILES_BASE_DIR || detectDownloadsDir(),
);

const SCREENSHOT_BIN =
  process.env.SCREENSHOT_BIN ||
  "/home/bryan/.local/share/omarchy/bin/omarchy-capture-screenshot";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function entryType(name) {
  const ext = extname(name).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return null;
}

app.get("/api/files", async (req, res) => {
  let target;
  try {
    target = resolveSafePath(FILES_BASE_DIR, req.query.dir);
  } catch {
    return res.status(400).json({ error: "Invalid path" });
  }

  try {
    const dirEntries = await readdir(target, { withFileTypes: true });
    const entries = [];
    for (const entry of dirEntries) {
      const relPath = join(req.query.dir || "", entry.name);
      if (entry.isDirectory()) {
        entries.push({ name: entry.name, type: "dir", path: relPath });
      } else {
        const type = entryType(entry.name);
        if (type) entries.push({ name: entry.name, type, path: relPath });
      }
    }
    res.json(entries);
  } catch {
    res.status(404).json({ error: "Directory not found" });
  }
});

app.get("/api/files/content", async (req, res) => {
  let target;
  try {
    target = resolveSafePath(FILES_BASE_DIR, req.query.path);
  } catch {
    return res.status(400).json({ error: "Invalid path" });
  }

  try {
    const stats = await stat(target);
    if (!stats.isFile()) {
      return res.status(400).json({ error: "Not a file" });
    }
    const contentType = CONTENT_TYPES[extname(target).toLowerCase()];
    if (!contentType) {
      return res.status(400).json({ error: "Unsupported file type" });
    }
    res.setHeader("Content-Type", contentType);
    createReadStream(target).pipe(res);
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

app.post("/api/screenshot", (req, res) => {
  execFile(SCREENSHOT_BIN, ["fullscreen", "save"], (err, stdout) => {
    if (err) {
      console.error("Screenshot failed:", err.message);
      return res.status(500).json({ error: "Screenshot failed" });
    }
    const path = stdout.trim();
    console.log("Screenshot guardado en:", path);
    res.json({ ok: true, path });
  });
});

const PORT = process.env.PORT || 3000;
const DIST_PATH = join(__dirname, "..", "dist");

app.use(express.static(DIST_PATH));

app.get("*", (req, res) => {
  res.sendFile(join(DIST_PATH, "index.html"));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
