import { normalizeState } from "./tracker.js";
import { normalizeLearningState } from "./learning.js";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function normalizePreferences(value) {
  return {
    reminder: value?.reminder === true,
    encouragement: value?.encouragement === true,
    time:
      typeof value?.time === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)
        ? value.time
        : "21:00",
  };
}

export function createBackup(journey, preferences, learning) {
  return {
    ...normalizeState(journey),
    backupFormat: "qingxing",
    backupVersion: 2,
    exportedAt: new Date().toISOString(),
    preferences: normalizePreferences(preferences),
    learning: normalizeLearningState(learning),
  };
}

export function parseBackup(contents) {
  let raw;
  try {
    raw = JSON.parse(contents);
  } catch {
    throw new Error("文件不是有效的 JSON 备份，请选择从清醒导出的记录。");
  }
  if (
    !isObject(raw) ||
    raw.version !== 1 ||
    !Array.isArray(raw.checkins) ||
    !Array.isArray(raw.habits) ||
    !isObject(raw.completions)
  ) {
    throw new Error("这不是可识别的清醒备份，现有记录未被修改。");
  }
  if (raw.backupVersion !== undefined && raw.backupVersion !== 2) {
    throw new Error("此备份的版本暂不支持，现有记录未被修改。");
  }
  if (
    raw.learning !== undefined &&
    (!isObject(raw.learning) ||
      raw.learning.version !== 1 ||
      !Array.isArray(raw.learning.events) ||
      !Array.isArray(raw.learning.actions))
  ) {
    throw new Error("备份中的积分数据不完整，现有记录未被修改。");
  }
  return {
    journey: normalizeState(raw),
    preferences: normalizePreferences(raw.preferences),
    learning:
      raw.learning === undefined ? null : normalizeLearningState(raw.learning),
  };
}
