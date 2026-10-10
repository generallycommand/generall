import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { expect } from "playwright/test";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5173";
const storageKey = "qingxing.journey.v1";
const resultDirectory = new URL("../test-results/", import.meta.url);
await mkdir(resultDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  locale: "zh-CN",
  timezoneId: "Asia/Shanghai",
  acceptDownloads: true,
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`Page error: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error")
    errors.push(`Console error: ${message.text()}`);
});
page.setDefaultTimeout(10_000);

const saved = () =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
const navigate = (label) =>
  page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("button", { name: label, exact: true })
    .click();
const dialog = () => page.getByRole("dialog");
const closeDialog = () =>
  dialog().getByRole("button", { name: "关闭弹窗" }).click();
async function noHorizontalOverflow(label) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    widths.document <= widths.viewport + 1 &&
      widths.body <= widths.viewport + 1,
    `${label} overflows horizontally: ${JSON.stringify(widths)}`,
  );
}
const completed = [];
async function check(label, action) {
  await action();
  completed.push(label);
  console.log(`✓ ${label}`);
}

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await check(
    "initial dashboard starts with zero records and three habits",
    async () => {
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "把今天，过得更清醒一点",
      );
      await expect(page.locator(".stat-card strong")).toHaveText([
        "0天",
        "0天",
        "0天",
      ]);
      await expect(page.locator(".habit-item")).toHaveCount(3);
      assert.equal((await saved()).checkins.length, 0);
      await noHorizontalOverflow("Desktop dashboard");
      await page.screenshot({
        path: new URL("desktop.png", resultDirectory).pathname,
        fullPage: true,
      });
    },
  );

  await check(
    "daily check-in saves mood and note, editing replaces the same date",
    async () => {
      await page
        .getByRole("button", { name: "完成今日打卡", exact: true })
        .click();
      await dialog().getByRole("button", { name: "有点挑战" }).click();
      await dialog()
        .getByLabel("留一句话给自己")
        .fill("先散步十分钟，再慢慢照顾今天的自己。");
      await dialog()
        .getByRole("button", { name: "完成今日打卡", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator(".stat-card strong")).toHaveText([
        "1天",
        "1天",
        "1天",
      ]);
      const first = await saved();
      assert.equal(first.checkins.length, 1);
      assert.equal(first.checkins[0].mood, "hard");
      assert.equal(
        first.checkins[0].note,
        "先散步十分钟，再慢慢照顾今天的自己。",
      );
      await page.getByRole("button", { name: "今天已打卡 · 查看记录" }).click();
      await expect(
        dialog().getByRole("button", { name: "有点挑战" }),
      ).toHaveAttribute("aria-pressed", "true");
      await dialog().getByRole("button", { name: "状态不错" }).click();
      await dialog()
        .getByLabel("留一句话给自己")
        .fill("散步后感觉好多了，今天有一点进步。");
      await dialog().getByRole("button", { name: "保存今天的记录" }).click();
      const updated = await saved();
      assert.equal(updated.checkins.length, 1);
      assert.equal(updated.checkins[0].mood, "good");
      assert.equal(
        updated.checkins[0].note,
        "散步后感觉好多了，今天有一点进步。",
      );
    },
  );

  await check(
    "check-in and habit completion persist through reload and toggle independently",
    async () => {
      await page
        .getByRole("button", { name: "完成出门走走", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "取消完成出门走走", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.reload({ waitUntil: "networkidle" });
      await expect(
        page.getByRole("button", { name: "今天已打卡 · 查看记录" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "取消完成出门走走", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "取消完成出门走走", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "完成出门走走", exact: true }),
      ).toHaveAttribute("aria-pressed", "false");
      await page
        .getByRole("button", { name: "完成读几页书", exact: true })
        .click();
      const state = await saved();
      assert.deepEqual(state.completions[state.checkins[0].date], ["read"]);
    },
  );

  await check(
    "plan adds and removes a custom habit and changes the goal",
    async () => {
      await navigate("我的计划");
      await page.getByRole("button", { name: "新习惯", exact: true }).click();
      await dialog().getByLabel("习惯名称").fill("做十分钟拉伸");
      await dialog().getByLabel("每天投入的时间（分钟）").fill("10");
      await dialog().getByRole("button", { name: "咖啡", exact: true }).click();
      await dialog()
        .getByRole("button", { name: "添加习惯", exact: true })
        .click();
      await expect(page.locator(".habit-item")).toHaveCount(4);
      await page
        .getByRole("button", { name: "完成做十分钟拉伸", exact: true })
        .click();
      const customHabit = (await saved()).habits.find(
        (habit) => habit.title === "做十分钟拉伸",
      );
      assert.equal(customHabit.minutes, 10);
      assert.equal(customHabit.icon, "coffee");
      await page
        .getByRole("button", { name: "删除做十分钟拉伸", exact: true })
        .click();
      await expect(page.locator(".habit-item")).toHaveCount(3);
      assert.ok(
        Object.values((await saved()).completions).every(
          (ids) => !ids.includes(customHabit.id),
        ),
      );
      await page.getByRole("button", { name: "调整目标", exact: true }).click();
      await dialog()
        .getByRole("button", { name: /^7\s*天$/ })
        .click();
      await dialog().getByRole("button", { name: "保存我的目标" }).click();
      await expect(
        page.getByRole("heading", { name: "7 天清醒计划" }),
      ).toBeVisible();
      assert.equal((await saved()).goalDays, 7);
    },
  );

  await check(
    "growth page shows recorded day, journal, and month navigation",
    async () => {
      await navigate("成长记录");
      await expect(page.locator(".calendar-day.checked")).toHaveCount(1);
      await expect(page.locator(".journal-entry")).toHaveCount(1);
      await expect(page.locator(".journal-entry")).toContainText(
        "散步后感觉好多了，今天有一点进步。",
      );
      await expect(page.locator(".journal-entry .mood-pill")).toHaveText(
        "状态不错",
      );
      const month = await page.locator(".calendar-card h3").textContent();
      await page.getByRole("button", { name: "上个月", exact: true }).click();
      assert.notEqual(
        await page.locator(".calendar-card h3").textContent(),
        month,
      );
      await page.getByRole("button", { name: "下个月", exact: true }).click();
      await expect(page.locator(".calendar-card h3")).toHaveText(month);
    },
  );

  await check(
    "breathing exercise starts, advances, pauses, and resumes",
    async () => {
      await navigate("静心工具");
      await page.getByRole("button", { name: /01 \/ BREATHE/ }).click();
      await dialog()
        .getByRole("button", { name: "开始呼吸", exact: true })
        .click();
      await expect(dialog().locator(".breath-circle strong")).toHaveText(
        "轻轻吸气",
      );
      await expect(dialog().locator(".breath-circle span")).not.toHaveText(
        "60 秒",
      );
      await dialog()
        .getByRole("button", { name: "暂停练习", exact: true })
        .click();
      const paused = await dialog()
        .locator(".breath-circle span")
        .textContent();
      await page.waitForTimeout(1200);
      await expect(dialog().locator(".breath-circle span")).toHaveText(paused);
      await dialog()
        .getByRole("button", { name: "继续呼吸", exact: true })
        .click();
      await expect(
        dialog().getByRole("button", { name: "暂停练习" }),
      ).toBeVisible();
      await closeDialog();
    },
  );

  await check(
    "focus countdown starts, pauses at its remaining time, and resets",
    async () => {
      await page.getByRole("button", { name: /02 \/ FOCUS/ }).click();
      await dialog()
        .getByRole("button", { name: "5 分钟", exact: true })
        .click();
      await expect(dialog().locator(".focus-clock > span")).toHaveText("05:00");
      await dialog()
        .getByRole("button", { name: "开始专注", exact: true })
        .click();
      await expect(dialog().locator(".focus-clock > span")).not.toHaveText(
        "05:00",
      );
      await dialog().getByRole("button", { name: "暂停", exact: true }).click();
      const paused = await dialog()
        .locator(".focus-clock > span")
        .textContent();
      await page.waitForTimeout(1200);
      await expect(dialog().locator(".focus-clock > span")).toHaveText(paused);
      await dialog()
        .getByRole("button", { name: "重置计时器", exact: true })
        .click();
      await expect(dialog().locator(".focus-clock > span")).toHaveText("05:00");
      await closeDialog();
    },
  );

  await check(
    "settings persist name and reminder, export contains real saved data",
    async () => {
      await page.getByRole("button", { name: "偏好设置", exact: true }).click();
      await page
        .getByRole("textbox", { name: "你的称呼", exact: true })
        .fill("向阳");
      await page.getByRole("button", { name: "保存", exact: true }).click();
      await expect(page.locator(".sidebar-profile strong")).toHaveText("向阳");
      await page.getByRole("switch", { name: "每日打卡提醒" }).click();
      await page.getByLabel("提醒时间").fill("20:30");
      await page.reload({ waitUntil: "networkidle" });
      await page.getByRole("button", { name: "偏好设置", exact: true }).click();
      await expect(
        page.getByRole("textbox", { name: "你的称呼", exact: true }),
      ).toHaveValue("向阳");
      await expect(
        page.getByRole("switch", { name: "每日打卡提醒" }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByLabel("提醒时间")).toHaveValue("20:30");
      const downloadEvent = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "导出我的记录", exact: true })
        .click();
      const download = await downloadEvent;
      assert.match(
        download.suggestedFilename(),
        /^清醒记录-\d{4}-\d{2}-\d{2}\.json$/,
      );
      const downloadPath = new URL("export.json", resultDirectory).pathname;
      await download.saveAs(downloadPath);
      const exported = JSON.parse(await readFile(downloadPath, "utf8"));
      assert.equal(exported.name, "向阳");
      assert.equal(exported.goalDays, 7);
      assert.equal(exported.checkins.length, 1);
      assert.equal(exported.preferences.time, "20:30");
    },
  );

  await check(
    "mobile navigation and all four pages fit a 390px viewport",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (const label of ["我的概览", "我的计划", "成长记录", "静心工具"]) {
        await page
          .getByRole("button", { name: "打开菜单", exact: true })
          .click();
        await navigate(label);
        await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
        await noHorizontalOverflow(`Mobile ${label}`);
      }
      await page.getByRole("button", { name: "打开菜单", exact: true }).click();
      await navigate("我的概览");
      await page.waitForTimeout(300);
      await page.screenshot({
        path: new URL("mobile.png", resultDirectory).pathname,
        fullPage: true,
      });
      await page.getByRole("button", { name: "今天已打卡 · 查看记录" }).click();
      await noHorizontalOverflow("Mobile check-in dialog");
      await expect(dialog().getByLabel("留一句话给自己")).toHaveValue(
        "散步后感觉好多了，今天有一点进步。",
      );
      await closeDialog();
    },
  );

  await check(
    "removing every habit preserves an empty plan after reload",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1050 });
      await navigate("我的计划");
      for (const title of ["出门走走", "读几页书", "早点休息"]) {
        await page
          .getByRole("button", { name: `删除${title}`, exact: true })
          .click();
      }
      await expect(page.locator(".habit-item")).toHaveCount(0);
      assert.deepEqual((await saved()).habits, []);
      await page.reload({ waitUntil: "networkidle" });
      await navigate("我的计划");
      await expect(page.locator(".habit-item")).toHaveCount(0);
      await expect(
        page.getByText("从一个喜欢的小习惯开始。", { exact: true }),
      ).toBeVisible();
    },
  );

  await check(
    "data reset requires confirmation and restores the initial state",
    async () => {
      await page.getByRole("button", { name: "偏好设置", exact: true }).click();
      await page
        .getByRole("button", { name: "清除所有记录", exact: true })
        .click();
      await dialog()
        .getByRole("button", { name: "保留记录", exact: true })
        .click();
      assert.equal((await saved()).name, "向阳");
      await page
        .getByRole("button", { name: "清除所有记录", exact: true })
        .click();
      await dialog()
        .getByRole("button", { name: "确认清除", exact: true })
        .click();
      const reset = await saved();
      assert.equal(reset.name, "朋友");
      assert.equal(reset.goalDays, 30);
      assert.equal(reset.habits.length, 3);
      assert.deepEqual(reset.checkins, []);
      assert.deepEqual(reset.completions, {});
      await expect(
        page.getByRole("switch", { name: "每日打卡提醒" }),
      ).toHaveAttribute("aria-checked", "false");
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(".stat-card strong")).toHaveText([
        "0天",
        "0天",
        "0天",
      ]);
      await expect(page.locator(".habit-item")).toHaveCount(3);
    },
  );

  const automatedContext = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    reducedMotion: "reduce",
  });
  const automatedPage = await automatedContext.newPage();
  automatedPage.on("pageerror", (error) =>
    errors.push(`Automation page error: ${error.message}`),
  );
  automatedPage.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`Automation console error: ${message.text()}`);
  });
  const automatedNavigate = (label) =>
    automatedPage
      .getByRole("navigation", { name: "主导航" })
      .getByRole("button", { name: label, exact: true })
      .click();
  const automatedDialog = () => automatedPage.getByRole("dialog");
  await automatedPage.clock.install({
    time: new Date("2026-10-10T23:59:25+08:00"),
  });
  await automatedPage.clock.pauseAt(new Date("2026-10-10T23:59:30+08:00"));
  await automatedPage.goto(baseUrl, { waitUntil: "networkidle" });

  await check(
    "daily reminder actually appears at its scheduled local time",
    async () => {
      await automatedPage
        .getByRole("button", { name: "偏好设置", exact: true })
        .click();
      await automatedPage.getByRole("switch", { name: "每日打卡提醒" }).click();
      await automatedPage.getByLabel("提醒时间").fill("23:59");
      await automatedPage.clock.runFor(15_000);
      await expect(automatedPage.getByRole("status")).toContainText(
        "给自己留一分钟吧，今天的打卡在等你。",
      );
    },
  );

  await check(
    "midnight automatically opens a new day while retaining yesterday’s records",
    async () => {
      await automatedNavigate("我的概览");
      await automatedPage
        .getByRole("button", { name: "完成出门走走", exact: true })
        .click();
      await automatedPage
        .getByRole("button", { name: "完成今日打卡", exact: true })
        .click();
      await automatedDialog()
        .getByLabel("留一句话给自己")
        .fill("昨晚也照顾好了自己。");
      await automatedDialog()
        .getByRole("button", { name: "完成今日打卡", exact: true })
        .click();
      await expect(
        automatedPage.getByRole("button", { name: "今天已打卡 · 查看记录" }),
      ).toBeVisible();
      await automatedPage.clock.runFor(30_000);
      await expect(
        automatedPage.getByRole("button", {
          name: "完成今日打卡",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        automatedPage.getByRole("button", {
          name: "完成出门走走",
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", "false");
      await expect(automatedPage.locator(".date-label")).toContainText(
        "10月11日",
      );
      await expect(automatedPage.locator(".stat-card strong")).toHaveText([
        "1天",
        "1天",
        "1天",
      ]);
      const state = await automatedPage.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        storageKey,
      );
      assert.equal(state.checkins[0].date, "2026-10-10");
      assert.equal(state.checkins[0].note, "昨晚也照顾好了自己。");
      assert.deepEqual(state.completions["2026-10-10"], ["walk"]);
      assert.equal(state.completions["2026-10-11"], undefined);
    },
  );

  await check(
    "breathing and focus timers reach their completion states automatically",
    async () => {
      await automatedNavigate("静心工具");
      await automatedPage
        .getByRole("button", { name: /01 \/ BREATHE/ })
        .click();
      await automatedDialog()
        .getByRole("button", { name: "开始呼吸", exact: true })
        .click();
      await automatedPage.clock.runFor(60_000);
      await expect(
        automatedDialog().locator(".breath-circle strong"),
      ).toHaveText("做得很好");
      await expect(
        automatedDialog().getByRole("button", {
          name: "再练习一次",
          exact: true,
        }),
      ).toBeVisible();
      await automatedDialog().getByRole("button", { name: "关闭弹窗" }).click();
      await automatedPage.getByRole("button", { name: /02 \/ FOCUS/ }).click();
      await automatedDialog()
        .getByRole("button", { name: "5 分钟", exact: true })
        .click();
      await automatedDialog()
        .getByRole("button", { name: "开始专注", exact: true })
        .click();
      await automatedPage.clock.runFor(300_000);
      await expect(automatedDialog().locator(".focus-clock > span")).toHaveText(
        "00:00",
      );
      await expect(
        automatedDialog().getByRole("button", {
          name: "再专注一次",
          exact: true,
        }),
      ).toBeVisible();
    },
  );
  await automatedContext.close();

  assert.deepEqual(
    errors,
    [],
    "Browser must not emit JavaScript or console errors",
  );
  console.log(
    `\n${completed.length} browser checks passed. Screenshots and export are in test-results/.`,
  );
} catch (error) {
  await page
    .screenshot({
      path: new URL("failure.png", resultDirectory).pathname,
      fullPage: true,
    })
    .catch(() => {});
  console.error(`Failed after ${completed.length} successful checks.`);
  if (errors.length) console.error(errors.join("\n"));
  throw error;
} finally {
  await browser.close();
}
