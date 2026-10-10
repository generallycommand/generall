import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTION_DEFAULTS,
  LESSONS,
  STAGES,
  createLearningState,
  normalizeLearningState,
  recordBehavior,
  adjustPoints,
  updateActionPoints,
  completeLesson,
  claimStage,
  undoLastBehavior,
  getLearningStats,
} from "./learning.js";

const now = new Date(2026, 9, 10, 12, 30);

test("every behavior changes the score, including repeated and negative records", () => {
  const initial = createLearningState();
  let state = recordBehavior(initial, {
    actionId: "walk",
    note: "晚饭后散步",
    now,
  });
  state = recordBehavior(state, { actionId: "walk", now });
  state = recordBehavior(state, { actionId: "pornography", now });
  assert.equal(initial.events.length, 0);
  assert.equal(state.events.length, 3);
  assert.equal(new Set(state.events.map((event) => event.id)).size, 3);
  assert.equal(state.events[0].note, "晚饭后散步");
  assert.equal(state.events[0].date, "2026-10-10");
  const stats = getLearningStats(state, now);
  assert.equal(stats.score, 105);
  assert.equal(stats.totalEarned, 20);
  assert.equal(stats.totalDeducted, 15);
  assert.equal(stats.todayDelta, 5);
  assert.equal(getLearningStats(state, new Date(2026, 9, 11)).todayDelta, 0);
});

test("score deductions are not clamped at zero", () => {
  let state = createLearningState();
  for (let i = 0; i < 8; i++)
    state = recordBehavior(state, { actionId: "pornography", now });
  assert.equal(getLearningStats(state, now).score, -20);
  assert.equal(getLearningStats(state, now).stageProgress, 0);
});

test("custom rules preserve previous scores and allow zero point records", () => {
  const original = recordBehavior(createLearningState(), {
    actionId: "walk",
    now,
  });
  const changed = updateActionPoints(original, "walk", 25);
  const after = recordBehavior(changed, { actionId: "walk", now });
  const zero = recordBehavior(updateActionPoints(after, "walk", 0), {
    actionId: "walk",
    now,
  });
  assert.equal(original.actions[0].points, 10);
  assert.deepEqual(
    zero.events.map((event) => event.delta),
    [10, 25, 0],
  );
  assert.equal(getLearningStats(zero, now).score, 135);
  assert.equal(
    normalizeLearningState(JSON.parse(JSON.stringify(zero))).actions[0].points,
    0,
  );
  for (const invalid of [101, -101, 1.5, "10", NaN, Infinity]) {
    assert.equal(
      updateActionPoints(changed, "walk", invalid).actions[0].points,
      25,
    );
  }
  assert.deepEqual(updateActionPoints(changed, "unknown", 10), changed);
});

test("manual corrections require a reason and a bounded nonzero integer", () => {
  const initial = createLearningState();
  for (const input of [
    { delta: 10 },
    { delta: 10, note: "   " },
    { delta: 0, note: "test" },
    { delta: 101, note: "test" },
    { delta: -101, note: "test" },
    { delta: 1.2, note: "test" },
    { delta: "10", note: "test" },
  ]) {
    assert.deepEqual(adjustPoints(initial, input), initial);
  }
  const increased = adjustPoints(initial, {
    delta: 100,
    note: "补记运动",
    now,
  });
  const decreased = adjustPoints(increased, {
    delta: -100,
    note: "更正分数",
    now,
  });
  assert.equal(increased.events[0].kind, "manual");
  assert.equal(getLearningStats(decreased, now).score, 100);
});

test("each known lesson rewards completion once and remains completed", () => {
  const initial = createLearningState();
  const completed = completeLesson(initial, "triggers", now);
  const repeated = completeLesson(completed, "triggers", now);
  assert.deepEqual(initial.completedLessons, []);
  assert.deepEqual(repeated.completedLessons, ["triggers"]);
  assert.equal(repeated.events.length, 1);
  assert.equal(getLearningStats(repeated, now).score, 115);
  assert.deepEqual(completeLesson(completed, "unknown", now), completed);
  assert.deepEqual(undoLastBehavior(completed, now), completed);
});

test("stages require their lessons, threshold, and all prior stages", () => {
  const initial = createLearningState();
  const enoughPoints = adjustPoints(initial, { delta: 100, note: "补记", now });
  assert.equal(claimStage(enoughPoints, "start", now).claimedStages.length, 0);
  const onlyLesson = completeLesson(initial, "triggers", now);
  assert.equal(claimStage(onlyLesson, "start", now).claimedStages.length, 0);
  let state = LESSONS.reduce(
    (current, lesson) => completeLesson(current, lesson.id, now),
    enoughPoints,
  );
  assert.equal(claimStage(state, "build", now).claimedStages.length, 0);
  assert.equal(claimStage(state, "growth", now).claimedStages.length, 0);
  state = claimStage(state, "start", now);
  assert.equal(getLearningStats(state, now).score, 280);
  state = claimStage(state, "build", now);
  assert.equal(getLearningStats(state, now).score, 300);
  state = claimStage(state, "growth", now);
  const stats = getLearningStats(state, now);
  assert.deepEqual(state.claimedStages, ["start", "build", "growth"]);
  assert.equal(stats.score, 320);
  assert.equal(stats.completedCount, 4);
  assert.equal(stats.claimedCount, 3);
  assert.equal(stats.nextStage, null);
  assert.equal(stats.stageProgress, 100);
  assert.deepEqual(claimStage(state, "growth", now), state);
  assert.deepEqual(claimStage(state, "unknown", now), state);
});

test("a stage is claimable at its exact threshold and stays passed after deductions", () => {
  let state = completeLesson(createLearningState(), "triggers", now);
  state = recordBehavior(state, { actionId: "resisted", now });
  assert.equal(getLearningStats(state, now).score, 130);
  state = claimStage(state, "start", now);
  assert.equal(getLearningStats(state, now).score, 150);
  state = adjustPoints(state, { delta: -100, note: "调整", now });
  state = normalizeLearningState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(state.claimedStages, ["start"]);
  assert.equal(getLearningStats(state, now).score, 50);
  assert.equal(getLearningStats(state, now).nextStage.id, "build");
  assert.deepEqual(claimStage(state, "start", now), state);
});

test("undo appends a reversal, skips rewards, and reverses each eligible record once", () => {
  let state = recordBehavior(createLearningState(), { actionId: "walk", now });
  state = adjustPoints(state, { delta: -5, note: "手动更正", now });
  state = completeLesson(state, "triggers", now);
  const before = structuredClone(state);
  state = undoLastBehavior(state, now);
  assert.equal(state.events.length, 4);
  assert.equal(state.events[3].delta, 5);
  assert.equal(state.events[3].referenceId, before.events[1].id);
  assert.equal(state.events[3].kind, "reversal");
  assert.equal(getLearningStats(state, now).score, 125);
  state = undoLastBehavior(state, now);
  assert.equal(state.events[4].delta, -10);
  assert.equal(state.events[4].referenceId, before.events[0].id);
  assert.equal(getLearningStats(state, now).score, 115);
  assert.deepEqual(undoLastBehavior(state, now), state);
  assert.deepEqual(state.completedLessons, ["triggers"]);
  assert.equal(before.events.length, 3);
});

test("undo reverses a zero point behavior without changing score", () => {
  let state = updateActionPoints(createLearningState(), "walk", 0);
  state = recordBehavior(state, { actionId: "walk", now });
  state = undoLastBehavior(state, now);
  assert.equal(state.events.length, 2);
  assert.equal(getLearningStats(state, now).score, 100);
  assert.equal(undoLastBehavior(state, now).events.length, 2);
});

test("malformed imports retain valid data and discard duplicate rewards or invalid references", () => {
  let valid = recordBehavior(createLearningState(), { actionId: "walk", now });
  valid = completeLesson(valid, "triggers", now);
  valid = undoLastBehavior(valid, now);
  const [behavior, lesson, reversal] = valid.events;
  const raw = {
    ...valid,
    initialPoints: 99999,
    version: 999,
    actions: [
      null,
      { id: "walk", points: 25 },
      { id: "walk", points: 80 },
      { id: "read", points: 1000 },
    ],
    completedLessons: ["triggers", "triggers", "unknown", null],
    claimedStages: ["growth", "unknown", "growth"],
    events: [
      null,
      {},
      behavior,
      behavior,
      lesson,
      { ...lesson, id: "duplicate-lesson" },
      reversal,
      { ...reversal, id: "duplicate-reversal" },
      { ...reversal, id: "missing-reference", referenceId: "missing" },
      {
        ...reversal,
        id: "reward-reversal",
        referenceId: lesson.id,
        delta: -15,
      },
      { ...behavior, id: "invalid-date", date: "2026-02-30" },
      {
        ...behavior,
        id: "invalid-timestamp",
        createdAt: "2026-02-30T12:00:00Z",
      },
      { ...behavior, id: "wrong-action", referenceId: "missing" },
      { ...behavior, id: "bad-delta", delta: 200 },
      { ...behavior, id: "bad-kind", kind: "unknown" },
      { ...behavior, id: "empty-note", kind: "manual", note: "" },
      { ...lesson, id: "wrong-reward", referenceId: "pause", delta: 100 },
    ],
  };
  const originalRaw = structuredClone(raw);
  const normalized = normalizeLearningState(raw);
  assert.equal(normalized.version, 1);
  assert.equal(normalized.initialPoints, 100);
  assert.equal(normalized.actions.length, ACTION_DEFAULTS.length);
  assert.equal(normalized.actions[0].points, 25);
  assert.equal(normalized.actions[1].points, 8);
  assert.deepEqual(normalized.completedLessons, ["triggers"]);
  assert.deepEqual(normalized.claimedStages, []);
  assert.equal(normalized.events.length, 3);
  assert.equal(getLearningStats(normalized, now).score, 115);
  assert.deepEqual(normalizeLearningState(normalized), normalized);
  assert.deepEqual(raw, originalRaw);
});

test("imports recover completion from reward events and drop impossible stage references", () => {
  let state = completeLesson(createLearningState(), "triggers", now);
  state = recordBehavior(state, { actionId: "resisted", now });
  state = claimStage(state, "start", now);
  const restored = normalizeLearningState({
    ...state,
    completedLessons: [],
    claimedStages: [],
  });
  assert.deepEqual(restored.completedLessons, ["triggers"]);
  assert.deepEqual(restored.claimedStages, ["start"]);
  assert.equal(getLearningStats(restored, now).score, 150);
  const malformed = normalizeLearningState({
    ...createLearningState(),
    events: [state.events[2]],
  });
  assert.deepEqual(malformed.claimedStages, []);
  assert.equal(malformed.events.length, 0);
});

test("invalid operations leave valid state intact", () => {
  const state = createLearningState();
  assert.deepEqual(recordBehavior(state, { actionId: "missing", now }), state);
  assert.deepEqual(
    recordBehavior(state, { actionId: "walk", now: new Date(NaN) }),
    state,
  );
  assert.deepEqual(completeLesson(state, "triggers", new Date(NaN)), state);
  for (const raw of [null, undefined, false, [], "invalid", 42]) {
    assert.deepEqual(normalizeLearningState(raw), state);
  }
});

test("new states and updates do not share mutable action records", () => {
  const initial = createLearningState();
  const another = createLearningState();
  initial.actions[0].points = 75;
  assert.equal(another.actions[0].points, 10);
  assert.equal(ACTION_DEFAULTS[0].points, 10);
  const updated = updateActionPoints(initial, "walk", 20);
  assert.equal(initial.actions[0].points, 75);
  assert.equal(updated.actions[0].points, 20);
  assert.equal(LESSONS.length, 4);
  assert.equal(STAGES.length, 3);
});
