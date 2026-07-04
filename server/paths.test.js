import { test } from "node:test";
import assert from "node:assert";
import { resolve } from "path";
import { resolveSafePath } from "./paths.js";

const BASE = resolve("/tmp/fake-downloads");

test("resolves a plain relative path inside the base dir", () => {
  const result = resolveSafePath(BASE, "photos/cat.png");
  assert.strictEqual(result, resolve(BASE, "photos/cat.png"));
});

test("resolves the base dir itself for an empty path", () => {
  assert.strictEqual(resolveSafePath(BASE, ""), BASE);
});

test("throws on parent-traversal escaping the base dir", () => {
  assert.throws(() => resolveSafePath(BASE, "../../etc/passwd"));
});

test("throws on an absolute path escaping the base dir", () => {
  assert.throws(() => resolveSafePath(BASE, "/etc/passwd"));
});
