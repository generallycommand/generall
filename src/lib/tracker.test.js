import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  formatMinutes,
  getStats,
  lastDays,
  localDateKey,
  normalizeState,
  saveCheckin,
  toggleHabit,
} from "./tracker.js";

test("local dates preserve the calendar day around year and leap-year boundaries", () => {
  assert.equal(localDateKey(new Date(2026, 0, 1, 0, 5)), "2026-01-01");
  assert.deepEqual(lastDays(3, new Date(2026, 0, 1, 23, 55)), [
    "2025-12-30",
    "2025-12-31",
    "2026-01-01",
  ]);
  assert.deepEqual(lastDays(3, new Date(2024, 2, 1)), [
    "2024-02-28",
    "2024-02-29",
    "2024-03-01",
  ]);
  assert.deepEqual(lastDays(0), []);
});

test("calendar traversal remains correct across daylight saving changes", () => {
  const previousZone = process.env.TZ;
  try {
    process.env.TZ = "America/Toronto";
    assert.equal(localDateKey(new Date("2026-03-09T01:00:00Z")), "2026-03-08");
    assert.deepEqual(lastDays(4, new Date(2026, 2, 10, 0, 30)), [
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
    assert.deepEqual(lastDays(4, new Date(2026, 10, 3, 23, 30)), [
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
    ]);
  } finally {
    if (previousZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousZone;
  }
});

test("check-ins update the same day without duplicates or mutating previous state", () => {
  const initial = createInitialState(new Date(2026, 9, 10));
  const first = saveCheckin(initial, {
    date: "2026-10-10",
    mood: "great",
    note: "完成散步",
  });
  const updated = saveCheckin(first, {
    date: "2026-10-10",
    mood: "calm",
    note: "今天不错",
  });
  assert.equal(initial.checkins.length, 0);
  assert.equal(updated.checkins.length, 1);
  assert.equal(updated.checkins[0].note, "今天不错");
  assert.equal(first.checkins[0].mood, "great");
  assert.equal(saveCheckin(updated, { date: "2026-02-30" }).checkins.length, 1);
});

test("streak includes yesterday before today is checked in and ignores future dates", () => {
  const state = createInitialState(new Date(2026, 9, 10));
  state.goalDays = 2;
  state.checkins = [
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-08",
    "2026-10-09",
    "2026-10-09",
    "2026-10-11",
  ].map((date) => ({ date }));
  assert.deepEqual(getStats(state, new Date(2026, 9, 10)), {
    streak: 2,
    longestStreak: 3,
    totalDays: 5,
    weekCount: 2,
    goalProgress: 100,
  });
  assert.equal(getStats(state, new Date(2026, 9, 13)).streak, 0);
  assert.equal(
    getStats(saveCheckin(state, { date: "2026-10-10" }), new Date(2026, 9, 10))
      .streak,
    3,
  );
});

test("week statistics start on Monday and include a Sunday check-in", () => {
  const state = createInitialState();
  state.checkins = ["2026-10-04", "2026-10-05", "2026-10-11"].map((date) => ({
    date,
  }));
  assert.equal(getStats(state, new Date(2026, 9, 11)).weekCount, 2);
  assert.equal(getStats(state, new Date(2026, 9, 12)).weekCount, 0);
});

test("habit completion is reversible, independent by date, and validates habit ids", () => {
  const initial = createInitialState();
  const first = toggleHabit(initial, "walk", "2026-10-10");
  const second = toggleHabit(first, "read", "2026-10-10");
  const anotherDay = toggleHabit(second, "walk", "2026-10-11");
  const undone = toggleHabit(anotherDay, "walk", "2026-10-10");
  assert.deepEqual(initial.completions, {});
  assert.deepEqual(first.completions["2026-10-10"], ["walk"]);
  assert.deepEqual(undone.completions, {
    "2026-10-10": ["read"],
    "2026-10-11": ["walk"],
  });
  assert.deepEqual(
    toggleHabit(undone, "unknown", "2026-10-10").completions,
    undone.completions,
  );
});

test("corrupted persisted state falls back safely while retaining valid entries", () => {
  for (const value of [null, undefined, false, [], "invalid"])
    assert.equal(normalizeState(value).goalDays, 30);
  const state = normalizeState({
    version: 999,
    name: "  小明  ",
    goalDays: -1,
    startDate: "2026-02-30",
    habits: [
      null,
      { id: "walk", title: "散步", icon: "walk", minutes: 20 },
      { id: "walk", title: "重复" },
    ],
    checkins: [
      null,
      { date: "2026-02-30" },
      { date: "2026-10-10", mood: "good", note: "旧记录" },
      { date: "2026-10-10", mood: 5, note: "新记录" },
    ],
    completions: {
      "2026-10-10": ["walk", "walk", "missing"],
      "2026-02-30": ["walk"],
      broken: [],
    },
  });
  assert.equal(state.version, 1);
  assert.equal(state.name, "小明");
  assert.equal(state.goalDays, 30);
  assert.notEqual(state.startDate, "2026-02-30");
  assert.deepEqual(state.checkins, [
    { date: "2026-10-10", mood: "calm", note: "新记录" },
  ]);
  assert.equal(state.habits.length, 1);
  assert.deepEqual(state.completions, { "2026-10-10": ["walk"] });
});

test("initial state does not share mutable habit objects between instances", () => {
  const first = createInitialState();
  first.habits[0].title = "Changed";
  assert.equal(createInitialState().habits[0].title, "出门走走");
});

test("explicitly removing all habits preserves the empty plan across normalization", () => {
  const state = normalizeState({
    ...createInitialState(),
    habits: [],
    completions: { "2026-10-10": ["walk"] },
  });
  assert.deepEqual(state.habits, []);
  assert.deepEqual(state.completions, { "2026-10-10": [] });
  assert.deepEqual(saveCheckin(state, { date: "2026-10-10" }).habits, []);
});

test("timer formatting clamps invalid values and preserves elapsed minutes", () => {
  assert.equal(formatMinutes(300), "05:00");
  assert.equal(formatMinutes(65.9), "01:05");
  assert.equal(formatMinutes(3600), "60:00");
  assert.equal(formatMinutes(-2), "00:00");
  assert.equal(formatMinutes(NaN), "00:00");
});
