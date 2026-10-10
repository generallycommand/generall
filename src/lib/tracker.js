import { normalizeResources } from "./resources.js";
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_HABITS = [
  {
    id: "walk",
    title: "出门走走",
    description: "让身体动起来，心情也会轻一点",
    icon: "walk",
    minutes: 20,
  },
  {
    id: "read",
    title: "读几页书",
    description: "给注意力一个新的方向",
    icon: "book",
    minutes: 15,
  },
  {
    id: "sleep",
    title: "早点休息",
    description: "睡前 30 分钟，放下手机",
    icon: "moon",
    minutes: 30,
  },
];

function dateNumber(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.getTime() / DAY_MS;
}

function text(value, fallback, limit) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, limit)
    : fallback;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function localDateKey(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function createInitialState(now = new Date()) {
  return {
    version: 1,
    name: "朋友",
    goalDays: 30,
    goalText: "",
    resources: [],
    startDate: localDateKey(now),
    checkins: [],
    habits: DEFAULT_HABITS.map((habit) => ({ ...habit })),
    completions: {},
  };
}

export function normalizeState(saved) {
  const initial = createInitialState();
  if (!isObject(saved)) return initial;

  const habits = [];
  const habitIds = new Set();
  for (const habit of Array.isArray(saved.habits)
    ? saved.habits
    : initial.habits) {
    if (
      !isObject(habit) ||
      typeof habit.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(habit.id) ||
      habitIds.has(habit.id)
    )
      continue;
    const fallback = DEFAULT_HABITS.find((item) => item.id === habit.id);
    const title = text(habit.title, fallback?.title ?? "", 100);
    if (!title) continue;
    habitIds.add(habit.id);
    habits.push({
      id: habit.id,
      title,
      description: text(habit.description, fallback?.description ?? "", 250),
      icon: text(habit.icon, fallback?.icon ?? "walk", 40),
      minutes:
        Number.isInteger(habit.minutes) &&
        habit.minutes >= 1 &&
        habit.minutes <= 1440
          ? habit.minutes
          : (fallback?.minutes ?? 10),
    });
  }

  const checkinsByDate = new Map();
  for (const checkin of Array.isArray(saved.checkins) ? saved.checkins : []) {
    if (!isObject(checkin) || dateNumber(checkin.date) === null) continue;
    checkinsByDate.set(checkin.date, {
      date: checkin.date,
      mood: text(checkin.mood, "calm", 40),
      note: typeof checkin.note === "string" ? checkin.note.slice(0, 2000) : "",
    });
  }

  const finalHabits =
    habits.length || (Array.isArray(saved.habits) && saved.habits.length === 0)
      ? habits
      : initial.habits;
  const knownIds = new Set(finalHabits.map((habit) => habit.id));
  const completions = {};
  if (isObject(saved.completions)) {
    for (const [date, ids] of Object.entries(saved.completions)) {
      if (dateNumber(date) === null || !Array.isArray(ids)) continue;
      completions[date] = [...new Set(ids.filter((id) => knownIds.has(id)))];
    }
  }

  return {
    version: 1,
    name: text(saved.name, initial.name, 80),
    goalText: text(saved.goalText, "", 200),
    resources: normalizeResources(saved.resources),
    goalDays:
      Number.isInteger(saved.goalDays) &&
      saved.goalDays >= 1 &&
      saved.goalDays <= 3650
        ? saved.goalDays
        : initial.goalDays,
    startDate:
      dateNumber(saved.startDate) !== null
        ? saved.startDate
        : initial.startDate,
    checkins: [...checkinsByDate.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    habits: finalHabits,
    completions,
  };
}

export function getStats(state, now = new Date()) {
  const today = dateNumber(localDateKey(now));
  const dates = new Set(
    (Array.isArray(state?.checkins) ? state.checkins : [])
      .map((checkin) => dateNumber(checkin?.date))
      .filter((day) => day !== null && day <= today),
  );
  let cursor = dates.has(today) ? today : today - 1;
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }

  let longestStreak = 0;
  let run = 0;
  let previous = null;
  for (const day of [...dates].sort((a, b) => a - b)) {
    run = previous !== null && day === previous + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day;
  }

  const monday = today - ((now.getDay() + 6) % 7);
  const weekCount = [...dates].filter((day) => day >= monday).length;
  const goalDays =
    Number.isInteger(state?.goalDays) && state.goalDays > 0
      ? state.goalDays
      : 30;
  return {
    streak,
    longestStreak,
    totalDays: dates.size,
    weekCount,
    goalProgress: Math.min(100, Math.round((streak / goalDays) * 100)),
  };
}

export function saveCheckin(state, { date = localDateKey(), mood, note } = {}) {
  const normalized = normalizeState(state);
  if (dateNumber(date) === null) return normalized;
  const previous = normalized.checkins.find((checkin) => checkin.date === date);
  const checkin = {
    date,
    mood: text(mood, previous?.mood ?? "calm", 40),
    note:
      typeof note === "string" ? note.slice(0, 2000) : (previous?.note ?? ""),
  };
  return {
    ...normalized,
    checkins: [
      ...normalized.checkins.filter((item) => item.date !== date),
      checkin,
    ].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function toggleHabit(state, habitId, date = localDateKey()) {
  const normalized = normalizeState(state);
  if (
    dateNumber(date) === null ||
    !normalized.habits.some((habit) => habit.id === habitId)
  )
    return normalized;
  const completed = normalized.completions[date] ?? [];
  return {
    ...normalized,
    completions: {
      ...normalized.completions,
      [date]: completed.includes(habitId)
        ? completed.filter((id) => id !== habitId)
        : [...completed, habitId],
    },
  };
}

export function lastDays(count, now = new Date()) {
  if (!Number.isFinite(count) || count <= 0) return [];
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - Math.floor(count) + 1);
  return Array.from({ length: Math.floor(count) }, () => {
    const key = localDateKey(date);
    date.setDate(date.getDate() + 1);
    return key;
  });
}

export function formatMinutes(totalSeconds) {
  const seconds = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
