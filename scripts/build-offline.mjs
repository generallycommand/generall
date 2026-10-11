import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const output = resolve(root, "offline");
await mkdir(output, { recursive: true });
let html = await readFile(resolve(dist, "index.html"), "utf8");

const svgData = async (name) =>
  `data:image/svg+xml;base64,${(await readFile(resolve(dist, name))).toString("base64")}`;
const landscape = await svgData("landscape.svg");
const favicon = await svgData("favicon.svg");
const moduleTag = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const stylesheetTag = html.match(
  /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/,
);
if (!moduleTag || !stylesheetTag)
  throw new Error("Vite output must contain one entry script and stylesheet.");
const jsPath = resolve(dist, moduleTag[1]);
const cssPath = resolve(dist, stylesheetTag[1]);
if (!jsPath.startsWith(`${dist}/`) || !cssPath.startsWith(`${dist}/`))
  throw new Error("Unexpected build asset path.");
let javascript = await readFile(jsPath, "utf8");
let stylesheet = await readFile(cssPath, "utf8");
if (!javascript.includes("./landscape.svg"))
  throw new Error(
    "Landscape reference changed; update the offline bundler before distributing.",
  );
javascript = javascript
  .replaceAll("./landscape.svg", landscape)
  .replaceAll("</script", "<\\/script");
stylesheet = stylesheet.replaceAll("</style", "<\\/style");
html = html
  .replace(moduleTag[0], "")
  .replace(stylesheetTag[0], () => `<style>${stylesheet}</style>`)
  .replaceAll("./favicon.svg", favicon)
  .replace(
    "<title>清醒 · 找回生活的主动权</title>",
    "<title>清醒 · 本地学习与积分</title>",
  )
  .replace(
    "</body>",
    () => `<script type="module">${javascript}</script>\n</body>`,
  );
if (/<(?:script|link)\b[^>]*(?:src|href)="(?:\.\/|\/|https?:)/i.test(html))
  throw new Error(
    "External script/style resources remain in the offline page.",
  );
html = html.replace(/[ \t]+$/gm, "");
const pagePath = resolve(output, "清醒-本地学习版.html");
await writeFile(pagePath, html, "utf8");
const instructions = `清醒 · 电脑本地学习版\n\n1. 双击“清醒-本地学习版.html”，用 Chrome 或 Edge 浏览器打开，无需安装程序或联网。\n2. 默认从 100 积分开始。在“学习与积分”中记录行为，每次点击都会按当前规则加减分；各行为分值可以自定义。\n3. 学习短课并答对问题，每课首次通过获得 15 分；达到积分及课程条件后，可以领取阶段通关。\n4. 分数用于记录选择，不代表个人价值。扣分后仍能继续学习，已完成的课程和阶段不会被撤销。\n5. 操作会自动保存在当前浏览器。下次使用同一浏览器打开同一路径的网页即可继续；请避免无痕模式。\n6. 在“偏好设置 → 导出我的记录”下载 JSON 备份。换电脑、移动网页、更新版本或清理浏览器数据前先备份；之后使用“导入备份”恢复。导出包含打卡、积分明细、自定义分值及学习进度。\n7. 如果浏览器提示自动保存不可用，请立即导出备份。网页不能保证在清理浏览器数据后保留记录。\n8. 每日提醒与计时器在网页打开时运行。本地版不上传行为记录。\n\n新增功能：在“我的计划”填写目标文字及自定天数；在“资料目录”手动保存来源链接。新增静态来源学习卡片：贴吧仅核实公开目录标题，原帖正文受限；医学卡附可靠来源。不会自动读取帖子。阅读思考和自愿行动选择也保存在本机并纳入备份。中性鼓励短句默认关闭，可在偏好设置中开启。备份也包含目标、资料目录和偏好。普通性欲不是失败，应用不提供诊断或宣称禁欲能治病。\n\n隐私：数据仅存当前浏览器，不设远端账号、分析追踪或自动同步。只有主动打开来源链接时才访问第三方网站。导出文件为明文，请保存在自己的位置。\n\n本地网页建议固定放在一个文件夹中；不同浏览器、不同网页路径的数据不一定互通。\n`;
const readmePath = resolve(output, "本地版使用说明.txt");
await writeFile(readmePath, instructions, "utf8");
await mkdir(resolve(root, ".local"), { recursive: true });
const archive = resolve(root, ".local", "qingxing-offline.zip");
const zipped = spawnSync("zip", ["-j", "-q", archive, pagePath, readmePath, resolve(root, "README.md"), resolve(root, "PRIVACY.md"), resolve(root, "VALIDATION.md"), resolve(root, "SOURCES.md")], {
  encoding: "utf8",
});
if (zipped.status !== 0)
  throw new Error(
    `Could not create offline archive: ${zipped.stderr || zipped.error?.message}`,
  );
console.log(`Offline page: offline/${basename(pagePath)}`);
console.log(`Download bundle: .local/${basename(archive)}`);
console.log(
  `Embedded HTML size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB`,
);

// Keep the public, data-free local distribution reproducible.
const distribution = resolve(root, "distribution");
await mkdir(distribution, { recursive: true });
for (const path of [pagePath, readmePath, resolve(root, "README.md"), resolve(root, "PRIVACY.md"), resolve(root, "VALIDATION.md"), resolve(root, "SOURCES.md")]) {
  await copyFile(path, resolve(distribution, basename(path)));
}
