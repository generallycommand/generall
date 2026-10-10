import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, saveCheckin } from "./tracker.js";
import {
  createLearningState,
  recordBehavior,
  completeLesson,
  updateActionPoints,
  getLearningStats,
} from "./learning.js";
import { createBackup, parseBackup } from "./backup.js";

test("backup round trip retains records, custom behavior values, points and learning progress", () => {
  const journey = saveCheckin(createInitialState(), {
    date: "2026-10-10",
    mood: "good",
    note: "今天去散步了",
  });
  let learning = updateActionPoints(createLearningState(), "walk", 12);
  learning = recordBehavior(learning, {
    actionId: "walk",
    now: new Date("2026-10-10T12:00:00"),
  });
  learning = completeLesson(learning, "triggers");
  const backup = createBackup(
    journey,
    { reminder: true, encouragement: false, time: "20:30" },
    learning,
  );
  const restored = parseBackup(JSON.stringify(backup));
  assert.deepEqual(restored.journey, journey);
  assert.deepEqual(restored.preferences, { reminder: true, encouragement: false, time: "20:30" });
  assert.equal(getLearningStats(restored.learning).score, 127);
  assert.equal(
    restored.learning.actions.find((action) => action.id === "walk").points,
    12,
  );
  assert.deepEqual(restored.learning.completedLessons, ["triggers"]);
});

test("legacy backup explicitly signals that existing learning data should be preserved", () => {
  const legacy = {
    ...createInitialState(),
    preferences: { reminder: true, time: "10:00" },
  };
  assert.equal(parseBackup(JSON.stringify(legacy)).learning, null);
});

test("invalid or unknown backups are rejected before any existing state can be replaced", () => {
  for (const raw of [
    "not json",
    "{}",
    "[]",
    "null",
    JSON.stringify({ ...createInitialState(), backupVersion: 999 }),
    JSON.stringify({ ...createInitialState(), learning: { version: 1 } }),
  ]) {
    assert.throws(() => parseBackup(raw));
  }
});

test("invalid reminder preferences fall back to an explicit safe schedule", () => {
  const result = parseBackup(
    JSON.stringify({
      ...createInitialState(),
      preferences: { reminder: "yes", time: "29:90" },
    }),
  );
  assert.deepEqual(result.preferences, { reminder: false, encouragement: false, time: "21:00" });
});
