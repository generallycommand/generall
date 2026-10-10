import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { expect } from "playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(
  process.env.OFFLINE_HTML || join(root, "offline", "清醒-本地学习版.html"),
);
const targetUrl = process.env.BASE_URL || pathToFileURL(htmlPath).href;
const target = new URL(targetUrl);
const usesLoopback = target.protocol !== "file:";
if (
  usesLoopback &&
  (!["http:", "https:"].includes(target.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname))
) {
  throw new Error(
    "BASE_URL may only point to a loopback server serving the self-contained offline HTML.",
  );
}
const results = join(root, "test-results", "offline");
const learningKey = "qingxing.learning.v1";
await access(htmlPath).catch(() => {
  throw new Error(
    `Offline HTML is missing: ${htmlPath}. Run npm run build:offline first.`,
  );
});
await mkdir(results, { recursive: true });
const profileDirectory = await mkdtemp(
  join(tmpdir(), "qingxing-offline-smoke-"),
);
const browserErrors = [];
const externalRequests = [];
let context;
let page;
let totalChecks = 0;

async function openBrowser() {
  context = await chromium.launchPersistentContext(profileDirectory, {
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
    viewport: { width: 1440, height: 1050 },
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    reducedMotion: "reduce",
    acceptDownloads: true,
    offline: !usesLoopback,
  });
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (
      /^https?:/i.test(url) &&
      (!usesLoopback || new URL(url).origin !== target.origin)
    )
      return route.abort();
    return route.continue();
  });
  context.on("request", (request) => {
    if (
      /^https?:/i.test(request.url()) &&
      (!usesLoopback || new URL(request.url()).origin !== target.origin)
    )
      externalRequests.push(request.url());
  });
  page = context.pages()[0] || (await context.newPage());
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.goto(targetUrl, { waitUntil: "load" });
  await context.setOffline(true);
  if (usesLoopback)
    await page
      .getByRole("navigation", { name: "主导航" })
      .getByRole("button", { name: "学习与积分", exact: true })
      .click();
  await expect(page.locator(".ql-score")).toBeVisible();
}

async function reloadDocument() {
  if (usesLoopback) await context.setOffline(false);
  await page.reload({ waitUntil: "load" });
  await context.setOffline(true);
  if (usesLoopback) await navigate("学习与积分");
  await expect(page.locator(".ql-score")).toBeVisible();
}

const readLearning = () =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), learningKey);
const score = (value) =>
  expect(page.locator(".ql-score")).toHaveText(String(value));
const action = (label) =>
  page
    .locator(".ql-action")
    .filter({ has: page.locator(".ql-action-name", { hasText: label }) });
const stage = (title) =>
  page
    .locator(".ql-stage")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
const lesson = (title) =>
  page
    .locator(".ql-lesson")
    .filter({
      has: page.locator(".ql-lesson-title strong", { hasText: title }),
    });
const navigate = (name) =>
  page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("button", { name, exact: true })
    .click();
const settings = () =>
  page.getByRole("button", { name: "偏好设置", exact: true }).click();
const dialog = () => page.getByRole("dialog");

async function openDetails(details) {
  if ((await details.getAttribute("open")) === null)
    await details.locator("summary").click();
}
async function adjust(delta, reason) {
  const details = page
    .locator(".ql-details")
    .filter({ has: page.locator("summary", { hasText: "手动调整积分" }) });
  await openDetails(details);
  await details.getByLabel("增减分值", { exact: true }).fill(String(delta));
  await details.getByLabel("调整原因", { exact: true }).fill(reason);
  await details
    .getByRole("button", { name: "记录积分调整", exact: true })
    .click();
}
async function finishLesson(title, answer) {
  const current = lesson(title);
  await openDetails(current);
  await current.getByRole("radio", { name: new RegExp(answer) }).check();
  await current.getByRole("button", { name: "验证并完成学习" }).click();
  await expect(current).toHaveClass(/ql-lesson-completed/);
}
async function check(label, run) {
  await run();
  totalChecks += 1;
  console.log(`✓ ${label}`);
}
async function uploadBackup(name, contents) {
  await page
    .getByLabel("选择清醒备份文件", { exact: true })
    .setInputFiles({
      name,
      mimeType: "application/json",
      buffer: Buffer.from(contents),
    });
}

try {
  await openBrowser();

  await check(
    usesLoopback
      ? "self-contained HTML starts at 100 points and works offline after loopback loading"
      : "actual file:// document starts offline at 100 points with no server",
    async () => {
      assert.equal(new URL(page.url()).protocol, target.protocol);
      assert.equal(await page.evaluate(() => navigator.onLine), false);
      await score(100);
      await expect(page.locator(".ql-action")).toHaveCount(7);
      assert.deepEqual((await readLearning()).events, []);
      await expect(stage("觉察起步").getByRole("button")).toBeDisabled();
      await expect(stage("习惯养成").getByRole("button")).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "撤销最近行为", exact: true }),
      ).toBeDisabled();
      assert.deepEqual(externalRequests, []);
    },
  );

  await check(
    "each behavior click adds or subtracts points and keeps its own record",
    async () => {
      await page
        .getByLabel("给这次行动留句话")
        .fill("饭后出去走走，给自己一个暂停。");
      await action("出去走走").click();
      await score(110);
      await action("出去走走").click();
      await score(120);
      await action("观看色情内容").click();
      await score(105);
      const state = await readLearning();
      assert.deepEqual(
        state.events.map((event) => event.delta),
        [10, 10, -15],
      );
      assert.equal(state.events[0].note, "饭后出去走走，给自己一个暂停。");
      assert.equal(state.events[1].note, "");
      assert.equal(new Set(state.events.map((event) => event.id)).size, 3);
      await expect(page.locator(".ql-ledger-row")).toHaveCount(3);
    },
  );

  await check(
    "custom positive and negative rules persist and affect only future clicks",
    async () => {
      const rules = page
        .locator(".ql-details")
        .filter({ has: page.locator("summary", { hasText: "调整行为分值" }) });
      await openDetails(rules);
      await rules
        .getByRole("spinbutton", { name: "出去走走分值", exact: true })
        .fill("17");
      await rules
        .getByRole("spinbutton", { name: "观看色情内容分值", exact: true })
        .fill("-7");
      await rules
        .getByRole("button", { name: "保存积分规则", exact: true })
        .click();
      await score(105);
      await reloadDocument();
      await score(105);
      const persisted = await readLearning();
      assert.equal(
        persisted.actions.find((item) => item.id === "walk").points,
        17,
      );
      assert.equal(
        persisted.actions.find((item) => item.id === "pornography").points,
        -7,
      );
      assert.deepEqual(
        persisted.events.map((event) => event.delta),
        [10, 10, -15],
      );
      await action("出去走走").click();
      await score(122);
      await action("观看色情内容").click();
      await score(115);
    },
  );

  await check(
    "manual adjustments reject invalid values and require a reason",
    async () => {
      const baseline = await readLearning();
      for (const delta of ["0", "1.5", "101", "-101", "abc"]) {
        await adjust(delta, "用于验证无效输入");
        await score(115);
        assert.deepEqual((await readLearning()).events, baseline.events);
      }
      await adjust("20", "   ");
      await expect(page.getByRole("alert")).toContainText("写下调整原因");
      await score(115);
      await adjust("20", "");
      assert.deepEqual((await readLearning()).events, baseline.events);
      await adjust("20", "完成计划外的整理，记录这次行动。");
      await score(135);
      const latest = (await readLearning()).events.at(-1);
      assert.equal(latest.kind, "manual");
      assert.equal(latest.delta, 20);
      assert.equal(latest.note, "完成计划外的整理，记录这次行动。");
    },
  );

  await check(
    "undo restores the latest behavior score while preserving its audit history",
    async () => {
      await action("出去走走").click();
      await score(152);
      const original = (await readLearning()).events.at(-1);
      await page
        .getByRole("button", { name: "撤销最近行为", exact: true })
        .click();
      await score(135);
      const state = await readLearning();
      assert.equal(state.events.at(-1).kind, "reversal");
      assert.equal(state.events.at(-1).referenceId, original.id);
      assert.equal(state.events.at(-1).delta, -17);
      assert.ok(state.events.some((event) => event.id === original.id));
      await expect(
        page.locator(".ql-ledger-row.ql-ledger-reversed"),
      ).toHaveCount(1);
    },
  );

  await check(
    "stage remains locked without learning, and wrong answers earn no points",
    async () => {
      await expect(stage("觉察起步").getByRole("button")).toBeDisabled();
      const firstLesson = lesson("认识你的触发点");
      await openDetails(firstLesson);
      await expect(
        firstLesson.getByRole("button", { name: "验证并完成学习" }),
      ).toBeDisabled();
      await firstLesson
        .getByRole("radio", { name: /责备自己不够自律/ })
        .check();
      await firstLesson.getByRole("button", { name: "验证并完成学习" }).click();
      await expect(firstLesson.getByRole("status")).toContainText(
        "这次暂不计分",
      );
      await score(135);
      assert.deepEqual((await readLearning()).completedLessons, []);
    },
  );

  await check(
    "correct quiz and first-stage claim each reward once and survive a later deduction",
    async () => {
      await finishLesson("认识你的触发点", "记录情绪和情境，准备一种替代活动");
      await score(150);
      await expect(
        stage("觉察起步").getByRole("button", { name: "通过并领取奖励" }),
      ).toBeEnabled();
      await stage("觉察起步")
        .getByRole("button", { name: "通过并领取奖励" })
        .click();
      await score(170);
      await expect(
        stage("觉察起步").getByRole("button", { name: "本关已通过" }),
      ).toBeDisabled();
      await reloadDocument();
      await score(170);
      await openDetails(lesson("认识你的触发点"));
      await expect(
        lesson("认识你的触发点").getByText("这节课，你已经通过了", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        lesson("认识你的触发点").getByRole("button", {
          name: "验证并完成学习",
        }),
      ).toHaveCount(0);
      let state = await readLearning();
      assert.equal(
        state.events.filter(
          (event) =>
            event.kind === "lesson" && event.referenceId === "triggers",
        ).length,
        1,
      );
      assert.equal(
        state.events.filter(
          (event) => event.kind === "stage" && event.referenceId === "start",
        ).length,
        1,
      );
      await adjust(-100, "记录一次较大的计划偏离，已完成的学习依然保留。");
      await score(70);
      await expect(
        stage("觉察起步").getByRole("button", { name: "本关已通过" }),
      ).toBeDisabled();
      state = await readLearning();
      assert.deepEqual(state.completedLessons, ["triggers"]);
      assert.deepEqual(state.claimedStages, ["start"]);
    },
  );

  await check(
    "all lessons and sequential stage requirements can be completed through the UI",
    async () => {
      await finishLesson(
        "给冲动留一个暂停",
        "先暂停，观察感受，再选择一个具体动作",
      );
      await finishLesson("让环境支持你", "晚饭后走五分钟，睡前把手机放远");
      await finishLesson(
        "一次偏离之后",
        "如实记录，复盘一个环节，然后继续行动",
      );
      await score(115);
      await expect(stage("习惯养成").getByRole("button")).toBeDisabled();
      await adjust(100, "完成额外的运动与阅读计划，记录本次累计行动。");
      await score(215);
      await expect(stage("稳定成长").getByRole("button")).toBeDisabled();
      await stage("习惯养成")
        .getByRole("button", { name: "通过并领取奖励" })
        .click();
      await score(235);
      await expect(stage("稳定成长").getByRole("button")).toBeDisabled();
      await adjust(100, "完成下一组个人目标，继续积累行动。");
      await score(335);
      await stage("稳定成长")
        .getByRole("button", { name: "通过并领取奖励" })
        .click();
      await score(355);
      await expect(
        page.getByRole("heading", { name: "所有关卡已通过" }),
      ).toBeVisible();
      const state = await readLearning();
      assert.deepEqual(state.completedLessons, [
        "triggers",
        "pause",
        "routine",
        "restart",
      ]);
      assert.deepEqual(state.claimedStages, ["start", "build", "growth"]);
      assert.equal(
        state.events.filter((event) => event.kind === "lesson").length,
        4,
      );
      assert.equal(
        state.events.filter((event) => event.kind === "stage").length,
        3,
      );
      await expect(
        page.locator(".ql-stage").getByRole("button", { name: "本关已通过" }),
      ).toHaveCount(3);
    },
  );

  let backup;
  let backupContents;
  await check(
    "JSON export includes journey, custom rules, learning, stages, and event history",
    async () => {
      await navigate("我的概览");
      await page
        .getByRole("button", { name: "完成今日打卡", exact: true })
        .click();
      await dialog()
        .getByLabel("留一句话给自己")
        .fill("离线记录今天的学习与行动。");
      await dialog()
        .getByRole("button", { name: "完成今日打卡", exact: true })
        .click();
      await settings();
      await page
        .getByRole("textbox", { name: "你的称呼", exact: true })
        .fill("本地学习者");
      await page.getByRole("button", { name: "保存", exact: true }).click();
      await expect(page.locator(".local-save-status")).toContainText(
        "已自动保存在本机",
      );
      const downloadReady = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "导出我的记录", exact: true })
        .click();
      const download = await downloadReady;
      const backupPath = join(results, "learning-backup.json");
      await download.saveAs(backupPath);
      backupContents = await readFile(backupPath, "utf8");
      backup = JSON.parse(backupContents);
      assert.equal(backup.backupFormat, "qingxing");
      assert.equal(backup.backupVersion, 2);
      assert.equal(backup.name, "本地学习者");
      assert.equal(backup.checkins.length, 1);
      assert.equal(backup.checkins[0].note, "离线记录今天的学习与行动。");
      assert.equal(
        backup.learning.actions.find((item) => item.id === "walk").points,
        17,
      );
      assert.equal(
        backup.learning.actions.find((item) => item.id === "pornography")
          .points,
        -7,
      );
      assert.deepEqual(backup.learning, await readLearning());
      assert.equal(backup.learning.completedLessons.length, 4);
      assert.equal(backup.learning.claimedStages.length, 3);
    },
  );

  await check(
    "reset and restore require confirmation and imported progress is restored intact",
    async () => {
      await page
        .getByRole("button", { name: "清除所有记录", exact: true })
        .click();
      await dialog()
        .getByRole("button", { name: "保留记录", exact: true })
        .click();
      assert.deepEqual(await readLearning(), backup.learning);
      await page
        .getByRole("button", { name: "清除所有记录", exact: true })
        .click();
      await dialog()
        .getByRole("button", { name: "确认清除", exact: true })
        .click();
      assert.deepEqual((await readLearning()).events, []);
      assert.deepEqual((await readLearning()).claimedStages, []);
      await navigate("学习与积分");
      await score(100);
      await settings();
      await uploadBackup("learning-backup.json", backupContents);
      await expect(dialog()).toHaveAttribute("aria-label", "恢复这份备份吗？");
      assert.deepEqual((await readLearning()).events, []);
      await dialog()
        .getByRole("button", { name: "取消导入", exact: true })
        .click();
      assert.deepEqual((await readLearning()).events, []);
      await uploadBackup("learning-backup.json", backupContents);
      await dialog()
        .getByRole("button", { name: "确认恢复备份", exact: true })
        .click();
      assert.deepEqual(await readLearning(), backup.learning);
      await expect(
        page.getByRole("textbox", { name: "你的称呼", exact: true }),
      ).toHaveValue("本地学习者");
      await navigate("学习与积分");
      await score(355);
    },
  );

  await check(
    "malformed JSON and incomplete learning backups do not erase existing progress",
    async () => {
      await settings();
      const baseline = await readLearning();
      await uploadBackup("broken.json", "{ this is not JSON }");
      await expect(page.getByRole("status")).toContainText(
        "不是有效的 JSON 备份",
      );
      await expect(dialog()).toHaveCount(0);
      assert.deepEqual(await readLearning(), baseline);
      await uploadBackup(
        "missing-learning-events.json",
        JSON.stringify({
          ...backup,
          learning: { ...backup.learning, events: null },
        }),
      );
      await expect(page.getByRole("status")).toContainText("积分数据不完整");
      await expect(dialog()).toHaveCount(0);
      assert.deepEqual(await readLearning(), baseline);
      await uploadBackup("unrelated.json", JSON.stringify({ hello: "world" }));
      await expect(page.getByRole("status")).toContainText(
        "不是可识别的清醒备份",
      );
      assert.deepEqual(await readLearning(), baseline);
    },
  );

  await check(
    "closing Chromium and reopening the same document and profile retains all data",
    async () => {
      const beforeClose = await readLearning();
      await context.close();
      context = null;
      await openBrowser();
      await score(355);
      assert.deepEqual(await readLearning(), beforeClose);
      await expect(page.locator(".sidebar-profile strong")).toHaveText(
        "本地学习者",
      );
      await expect(page.locator(".ql-stage-claimed")).toHaveCount(3);
      await navigate("成长记录");
      await expect(page.locator(".journal-entry")).toHaveCount(1);
      await expect(page.locator(".journal-entry")).toContainText(
        "离线记录今天的学习与行动。",
      );
      await navigate("学习与积分");
      await page.screenshot({
        path: join(results, "desktop.png"),
        fullPage: true,
      });
    },
  );

  await check(
    "offline learning remains usable at 390px with no horizontal overflow",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button", { name: "打开菜单", exact: true }).click();
      await navigate("我的概览");
      await page.getByRole("button", { name: "打开菜单", exact: true }).click();
      await navigate("学习与积分");
      await score(355);
      const widths = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      assert.ok(
        widths.document <= widths.viewport + 1 &&
          widths.body <= widths.viewport + 1,
        `Horizontal overflow: ${JSON.stringify(widths)}`,
      );
      await page.waitForTimeout(300);
      await page.screenshot({
        path: join(results, "mobile.png"),
        fullPage: true,
      });
    },
  );

  assert.deepEqual(
    externalRequests,
    [],
    "The local app must not attempt any external HTTP or HTTPS request",
  );
  assert.deepEqual(
    browserErrors,
    [],
    "The offline browser must not emit JavaScript or console errors",
  );
  console.log(
    `\n${totalChecks} offline browser checks passed. No external HTTP requests or browser errors.`,
  );
  console.log(
    "Persistence verified across a complete Chromium shutdown and relaunch using the same temporary profile.",
  );
  if (usesLoopback)
    console.log(
      "Loopback fallback used: the self-contained HTML was loaded over local HTTP, then the browser was set offline. Direct file:// opening is not verified by this run.",
    );
  console.log(
    "Screenshots and a test-only JSON backup are in test-results/offline/.",
  );
} catch (error) {
  await page
    ?.screenshot({ path: join(results, "failure.png"), fullPage: true })
    .catch(() => {});
  console.error(`Failed after ${totalChecks} successful offline checks.`);
  if (browserErrors.length) console.error(browserErrors.join("\n"));
  if (externalRequests.length)
    console.error(`Unexpected HTTP requests: ${externalRequests.join(", ")}`);
  throw error;
} finally {
  await context?.close();
  await rm(profileDirectory, { recursive: true, force: true });
}
