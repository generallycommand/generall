import { localDateKey } from "./tracker.js";

export const ACTION_DEFAULTS = [
  {
    id: "walk",
    label: "出去走走",
    description: "完成一次散步或运动",
    points: 10,
    icon: "walk",
  },
  {
    id: "read",
    label: "专注阅读",
    description: "给阅读留一段完整时间",
    points: 8,
    icon: "book",
  },
  {
    id: "breathing",
    label: "呼吸练习",
    description: "停下来，练习缓慢呼吸",
    points: 5,
    icon: "wind",
  },
  {
    id: "sleep",
    label: "按时休息",
    description: "按自己的计划结束一天",
    points: 10,
    icon: "moon",
  },
  {
    id: "resisted",
    label: "转移一次冲动",
    description: "成功转移一次冲动，选择替代活动",
    points: 15,
    icon: "shield",
  },
  {
    id: "pornography",
    label: "观看色情内容",
    description: "如实记录，看看当时的触发因素",
    points: -15,
    icon: "eye",
  },
  {
    id: "scrolling",
    label: "睡前无目的刷屏",
    description: "记录一次超出计划的睡前刷屏",
    points: -8,
    icon: "phone",
  },
];

export const LESSONS = [
  {
    id: "triggers",
    title: "认识你的触发点",
    subtitle: "先看见习惯如何开始",
    minutes: 3,
    paragraphs: [
      "想减少色情内容使用，可以先观察行为前发生了什么：独处、压力、无聊，还是睡前拿起手机？触发点是线索，不是对你的评价。",
      "每次记录时，写下当时的地点、情绪和需要。例如：晚上独处，有点焦虑，想找一种放松方式。记录帮助你发现自己的模式。",
      "给一个常见触发点安排替代选择：如果睡前想刷色情内容，我就把手机放远，先读两页书。目标是增加选择，而不是要求自己永远没有冲动。",
    ],
    question: "发现自己在压力大时容易刷色情内容，接下来最有帮助的是？",
    options: [
      "记录情绪和情境，准备一种替代活动",
      "责备自己不够自律",
      "认定一次冲动代表所有努力都白费",
    ],
    correctIndex: 0,
    explanation: "看见具体的触发情境，才能安排更容易执行的替代行为。",
    reward: 15,
  },
  {
    id: "pause",
    title: "给冲动留一个暂停",
    subtitle: "从自动反应，到主动选择",
    minutes: 3,
    paragraphs: [
      "出现冲动并不意味着你必须立刻行动。可以先把注意力放在身体感受上，提醒自己：我注意到一个冲动，现在可以做一个选择。",
      "试着暂停几分钟，离开当前页面、起身倒水或缓慢呼吸。冲动的强弱可能会变化；不必用力消灭每一个念头。",
      "提前准备一张短清单，例如散步、给朋友发消息或做一件小家务。选择一个当下能做到的动作，比要求自己只靠意志力更具体。",
    ],
    question: "冲动出现时，这里的暂停练习建议你做什么？",
    options: [
      "保证自己以后再也不会产生冲动",
      "先暂停，观察感受，再选择一个具体动作",
      "不断检查自己有没有不该出现的念头",
    ],
    correctIndex: 1,
    explanation: "暂停让你有机会观察和选择。出现念头本身不代表失败。",
    reward: 15,
  },
  {
    id: "routine",
    title: "让环境支持你",
    subtitle: "把小行动放进日常",
    minutes: 4,
    paragraphs: [
      "清晰的环境安排能帮助执行计划。例如睡前把手机放在够不到的地方、关闭不必要的推送，并为休息留出时间。选一项先试，不必一次改变所有生活习惯。",
      "设定可以完成的小目标：每天读五分钟，或晚饭后走一小段路。给行动一个明确的时间和地点，完成后记录，而不是等到状态完美才开始。",
      "这里的分数只是你选择的反馈工具，不是健康诊断，也不衡量人的价值。你可以按自己的目标调整规则，让记录帮助学习，而不是增加羞耻感。",
    ],
    question: "哪一种计划更容易落实到生活中？",
    options: [
      "以后任何时候都必须保持完美",
      "等完全没有压力时再开始",
      "晚饭后走五分钟，睡前把手机放远",
    ],
    correctIndex: 2,
    explanation: "小而具体的计划包含时间、情境和动作，更方便实践与调整。",
    reward: 15,
  },
  {
    id: "restart",
    title: "一次偏离之后",
    subtitle: "复盘，再开始",
    minutes: 3,
    paragraphs: [
      "一次偏离计划不会抹去已经学会的方法。如实记录发生的行为，区分事实和评价：我做了什么，而不是我是什么样的人。",
      "回看一个可以改变的环节：是否太疲惫、是否缺少放松方式、是否可以提前移开手机？写下下一次的小调整，并继续当天的正常生活。",
      "性欲和自慰本身不等于不健康。这套练习关注你希望减少的色情内容使用和失控习惯。如果这些行为持续影响生活并让你困扰，可以向合格的心理健康专业人士寻求支持。",
    ],
    question: "一次没有遵守计划之后，更合适的下一步是？",
    options: [
      "如实记录，复盘一个环节，然后继续行动",
      "清空所有成长记录并惩罚自己",
      "因为已经偏离，就放弃余下的计划",
    ],
    correctIndex: 0,
    explanation: "复盘关注可调整的行为；之前的学习和进步仍然存在。",
    reward: 15,
  },
];

export const STAGES = [
  {
    id: "start",
    title: "觉察起步",
    description: "认识触发点，练习第一次主动选择",
    threshold: 130,
    requiredLessons: ["triggers"],
    reward: 20,
  },
  {
    id: "build",
    title: "习惯养成",
    description: "学会暂停，把替代行动放进生活",
    threshold: 200,
    requiredLessons: ["triggers", "pause", "routine"],
    reward: 20,
  },
  {
    id: "growth",
    title: "稳定成长",
    description: "完成全部学习，用复盘支持持续行动",
    threshold: 300,
    requiredLessons: ["triggers", "pause", "routine", "restart"],
    reward: 20,
  },
];

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const validPoints = (value) =>
  Number.isInteger(value) && value >= -100 && value <= 100;
const cleanText = (value, limit = 2000) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";
const validId = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function knownIds(raw, definitions) {
  const allowed = new Set(definitions.map((item) => item.id));
  return new Set(
    (Array.isArray(raw) ? raw : []).filter((id) => allowed.has(id)),
  );
}

export function createLearningState() {
  return {
    version: 1,
    initialPoints: 100,
    actions: ACTION_DEFAULTS.map((action) => ({ ...action })),
    events: [],
    completedLessons: [],
    claimedStages: [],
  };
}

export function normalizeLearningState(raw) {
  const state = createLearningState();
  if (!isObject(raw)) return state;

  const savedActions = new Map();
  for (const action of Array.isArray(raw.actions) ? raw.actions : []) {
    if (
      isObject(action) &&
      !savedActions.has(action.id) &&
      validPoints(action.points)
    )
      savedActions.set(action.id, action.points);
  }
  state.actions = state.actions.map((action) => ({
    ...action,
    points: savedActions.get(action.id) ?? action.points,
  }));

  const completed = knownIds(raw.completedLessons, LESSONS);
  const claimed = knownIds(raw.claimedStages, STAGES);
  const eventIds = new Map();
  const rewardedLessons = new Set();
  const rewardedStages = new Set();
  const reversed = new Set();

  for (const rawEvent of Array.isArray(raw.events) ? raw.events : []) {
    if (
      !isObject(rawEvent) ||
      !validId(rawEvent.id) ||
      eventIds.has(rawEvent.id) ||
      !validDate(rawEvent.date) ||
      !validPoints(rawEvent.delta)
    )
      continue;
    if (
      typeof rawEvent.createdAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(rawEvent.createdAt)
    )
      continue;
    const timestamp = new Date(rawEvent.createdAt);
    if (
      !Number.isFinite(timestamp.getTime()) ||
      !validDate(rawEvent.createdAt.slice(0, 10))
    )
      continue;
    const referenceId = cleanText(rawEvent.referenceId, 128);
    const note = cleanText(rawEvent.note);
    let fallbackLabel;

    if (rawEvent.kind === "behavior") {
      const action = ACTION_DEFAULTS.find((item) => item.id === referenceId);
      if (!action) continue;
      fallbackLabel = action.label;
    } else if (rawEvent.kind === "manual") {
      if (rawEvent.delta === 0 || !note) continue;
      fallbackLabel = "手动调整";
    } else if (rawEvent.kind === "lesson") {
      const lesson = LESSONS.find((item) => item.id === referenceId);
      if (
        !lesson ||
        rewardedLessons.has(referenceId) ||
        rawEvent.delta !== lesson.reward
      )
        continue;
      rewardedLessons.add(referenceId);
      completed.add(referenceId);
      fallbackLabel = `完成学习：${lesson.title}`;
    } else if (rawEvent.kind === "stage") {
      const stage = STAGES.find((item) => item.id === referenceId);
      if (
        !stage ||
        rewardedStages.has(referenceId) ||
        rawEvent.delta !== stage.reward
      )
        continue;
      rewardedStages.add(referenceId);
      claimed.add(referenceId);
      fallbackLabel = `通过关卡：${stage.title}`;
    } else if (rawEvent.kind === "reversal") {
      const original = eventIds.get(referenceId);
      if (
        !original ||
        !["behavior", "manual"].includes(original.kind) ||
        reversed.has(referenceId) ||
        rawEvent.delta !== -original.delta
      )
        continue;
      reversed.add(referenceId);
      fallbackLabel = `撤销：${original.label}`;
    } else continue;

    const event = {
      id: rawEvent.id,
      date: rawEvent.date,
      createdAt: timestamp.toISOString(),
      label: cleanText(rawEvent.label, 150) || fallbackLabel,
      delta: rawEvent.delta,
      note,
      kind: rawEvent.kind,
      referenceId: rawEvent.kind === "manual" ? "" : referenceId,
    };
    state.events.push(event);
    eventIds.set(event.id, event);
  }

  state.completedLessons = LESSONS.filter((lesson) =>
    completed.has(lesson.id),
  ).map((lesson) => lesson.id);
  for (const stage of STAGES) {
    if (
      !claimed.has(stage.id) ||
      !stage.requiredLessons.every((id) => completed.has(id))
    )
      break;
    state.claimedStages.push(stage.id);
  }
  state.events = state.events.filter(
    (event) =>
      event.kind !== "stage" || state.claimedStages.includes(event.referenceId),
  );
  return state;
}

let idCounter = 0;
function appendEvent(
  state,
  { label, delta, note = "", kind, referenceId = "" },
  now = new Date(),
) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return state;
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `event-${Date.now().toString(36)}-${(++idCounter).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    ...state,
    events: [
      ...state.events,
      {
        id,
        date: localDateKey(now),
        createdAt: now.toISOString(),
        label,
        delta,
        note: cleanText(note),
        kind,
        referenceId,
      },
    ],
  };
}

export function recordBehavior(
  raw,
  { actionId, note = "", now = new Date() } = {},
) {
  const state = normalizeLearningState(raw);
  const action = state.actions.find((item) => item.id === actionId);
  return action
    ? appendEvent(
        state,
        {
          label: action.label,
          delta: action.points,
          note,
          kind: "behavior",
          referenceId: action.id,
        },
        now,
      )
    : state;
}

export function adjustPoints(raw, { delta, note, now = new Date() } = {}) {
  const state = normalizeLearningState(raw);
  if (!validPoints(delta) || delta === 0 || !cleanText(note)) return state;
  return appendEvent(
    state,
    { label: "手动调整", delta, note, kind: "manual" },
    now,
  );
}

export function updateActionPoints(raw, id, points) {
  const state = normalizeLearningState(raw);
  if (!validPoints(points)) return state;
  return {
    ...state,
    actions: state.actions.map((action) =>
      action.id === id ? { ...action, points } : action,
    ),
  };
}

export function completeLesson(raw, id, now = new Date()) {
  const state = normalizeLearningState(raw);
  const lesson = LESSONS.find((item) => item.id === id);
  if (!lesson || state.completedLessons.includes(id)) return state;
  const updated = appendEvent(
    state,
    {
      label: `完成学习：${lesson.title}`,
      delta: lesson.reward,
      kind: "lesson",
      referenceId: id,
    },
    now,
  );
  return updated === state
    ? state
    : { ...updated, completedLessons: [...state.completedLessons, id] };
}

export function claimStage(raw, id, now = new Date()) {
  const state = normalizeLearningState(raw);
  const index = STAGES.findIndex((stage) => stage.id === id);
  const stage = STAGES[index];
  if (
    !stage ||
    state.claimedStages.includes(id) ||
    !STAGES.slice(0, index).every((previous) =>
      state.claimedStages.includes(previous.id),
    ) ||
    !stage.requiredLessons.every((lesson) =>
      state.completedLessons.includes(lesson),
    ) ||
    getLearningStats(state, now).score < stage.threshold
  )
    return state;
  const updated = appendEvent(
    state,
    {
      label: `通过关卡：${stage.title}`,
      delta: stage.reward,
      kind: "stage",
      referenceId: id,
    },
    now,
  );
  return updated === state
    ? state
    : { ...updated, claimedStages: [...state.claimedStages, id] };
}

export function undoLastBehavior(raw, now = new Date()) {
  const state = normalizeLearningState(raw);
  const reversed = new Set(
    state.events
      .filter((event) => event.kind === "reversal")
      .map((event) => event.referenceId),
  );
  const original = [...state.events]
    .reverse()
    .find(
      (event) =>
        ["behavior", "manual"].includes(event.kind) && !reversed.has(event.id),
    );
  return original
    ? appendEvent(
        state,
        {
          label: `撤销：${original.label}`,
          delta: -original.delta,
          note: "撤销最近一条行为或手动调整，保留原始记录。",
          kind: "reversal",
          referenceId: original.id,
        },
        now,
      )
    : state;
}

export function getLearningStats(raw, now = new Date()) {
  const state = normalizeLearningState(raw);
  const score =
    state.initialPoints +
    state.events.reduce((total, event) => total + event.delta, 0);
  const nextStage =
    STAGES.find((stage) => !state.claimedStages.includes(stage.id)) ?? null;
  const today = localDateKey(
    now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date(),
  );
  return {
    score,
    totalEarned: state.events.reduce(
      (total, event) => total + Math.max(0, event.delta),
      0,
    ),
    totalDeducted: state.events.reduce(
      (total, event) => total + Math.max(0, -event.delta),
      0,
    ),
    todayDelta: state.events
      .filter((event) => event.date === today)
      .reduce((total, event) => total + event.delta, 0),
    completedCount: state.completedLessons.length,
    claimedCount: state.claimedStages.length,
    nextStage,
    stageProgress: nextStage
      ? Math.max(
          0,
          Math.min(100, Math.round((score / nextStage.threshold) * 100)),
        )
      : 100,
  };
}
