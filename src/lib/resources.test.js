import test from "node:test";
import assert from "node:assert/strict";
import { safeSourceUrl, normalizeResources, PUBLIC_SOURCE_PROVIDER } from "./resources.js";
import { createInitialState } from "./tracker.js";
import { createBackup, parseBackup } from "./backup.js";

test("source bookmarks reject executable schemes, credentials and malformed links", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "https://user:pass@example.com", "invalid", null]) assert.equal(safeSourceUrl(value), null);
  assert.equal(safeSourceUrl("https://example.com/path"), "https://example.com/path");
  assert.equal(PUBLIC_SOURCE_PROVIDER.enabled, false);
});
test("resource normalization removes unsafe or duplicate entries", () => {
  const good = { id: "test-source", title: "测试来源", url: "https://example.com/", category: "待核实" };
  assert.deepEqual(normalizeResources([good, good, {...good, id: "bad", url: "javascript:alert(1)"}]), [good]);
});
test("backup round trip includes personal goal, sources and optional encouragement", () => {
  const journey = { ...createInitialState(), goalText: "测试目标", goalDays: 12, resources: [{ id: "source", title: "测试来源", url: "https://example.com/", category: "阅读笔记" }] };
  const backup = parseBackup(JSON.stringify(createBackup(journey, { encouragement: true })));
  assert.deepEqual(backup.journey, journey);
  assert.equal(backup.preferences.encouragement, true);
  assert.deepEqual(createInitialState().resources, []);
});
