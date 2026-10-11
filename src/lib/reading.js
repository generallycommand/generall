// Static editorial notes; no runtime fetching, accounts, or third-party user profiles.
export const READING_ACCESS_DATE = "2026-10-10"; // UTC
export const FORUM_DIRECTORY = "https://tieba.baidu.com/mo/q/f?ie=utf-8&jump_tieba_native=1&kw=%E6%88%92%E8%89%B2";
export const READING_CARDS = [
  {
    id: "six-years-reflection", theme: "反思与经验", kind: "个人经验 · 已读第一页", title: "觉察注意力，给挫折后的调整留位置",
    sourceTitle: "戒色6年的一些体会", url: "https://tieba.baidu.com/p/9536769292", publisher: "百度贴吧 · 戒色吧",
    accessedAt: "2026-10-11",
    scope: "仅阅读公开第一页返回的可见正文；未读取后续分页、图片或展开折叠内容，不代表已读全帖",
    summary: "作者自述曾经历挫折，重视觉察念头，并主张从中反思调整，不把一次中断视为彻底失败。这是个人经验，不能证明方法对所有人有效。",
    distinctions: [
      { label: "价值观点", text: "作者将觉察与持续练习视为重要目标；你可以选择是否认同，不必接受整套价值判断。" },
      { label: "未经证实的健康或宗教主张", text: "文中宗教解释及关于疾病恢复的转述，未在该页提供可核查的临床证据；不据此宣称禁欲或修心能治病，也不替代医疗。" },
    ],
    boundary: "应用改写：可以注意到念头，再自主决定注意力去向；不要求念头立即消失，不以性欲评判好坏。挫折后的复盘是选择，不是惩罚。",
    prompt: "原创思考：注意力偏离时，我愿意把它带回哪件小事？一次计划中断后，可以调整哪个条件？",
    action: "自愿试做：停一小会儿，留意当下注意力，再选择继续、换一件小事或休息；不舒服就停止。",
  },
  {
    id: "small-steps", theme: "积累与行动", kind: "观点线索", title: "把积累变成可观察的小事",
    sourceTitle: "相信积累的力量", url: "https://tieba.baidu.com/p/11092027036", publisher: "百度贴吧 · 戒色吧",
    scope: "仅公开目录标题；原帖正文返回 403，未读全文", directory: FORUM_DIRECTORY,
    summary: "目录中可以确认这个标题及原帖链接。标题指向积累这一话题，但无法据此判断作者的方法、效果或完整立场；本卡不摘要未读正文。",
    boundary: "观点待核实。不能把标题推断为禁欲改善健康、学业或收入的证据。",
    prompt: "原创思考：我希望积累的是哪一种生活变化？怎样观察它，而不只数天数？",
    action: "自愿试做：留出 5 分钟，完成一件自己选的小事。",
  },
  {
    id: "reflection", theme: "反思与经验", kind: "个人经验待核实", title: "给反思留空间，不替自己下结论",
    sourceTitle: "戒色反思贴3", url: "https://tieba.baidu.com/p/11093575641", publisher: "百度贴吧 · 戒色吧",
    scope: "仅公开目录标题；原帖正文返回 403，未读全文", directory: FORUM_DIRECTORY,
    summary: "公开目录有一条以反思为题的帖子。没有读取到经历细节，不能确认作者遇到过什么、做过什么或结果如何；这里不编造经验故事。",
    boundary: "这条帖子的个人经历仍待核实。即使将来读到个人见证，也不能单凭先后发生证明因果。",
    prompt: "原创思考：我实际观察到了什么？哪些只是猜测？还有哪些解释？不必填写私密细节。",
    action: "自愿试做：写下一条可观察的事实，以及一项仍不确定的解释。",
  },
  {
    id: "own-reasons", theme: "目标与自主", kind: "观点线索", title: "把行动理由写成自己的话",
    sourceTitle: "戒色动机——正己化人", url: "https://tieba.baidu.com/p/11067194971", publisher: "百度贴吧 · 戒色吧",
    scope: "仅公开目录标题；原帖正文返回 403，未读全文", directory: FORUM_DIRECTORY,
    summary: "目录标题涉及行动动机。仅凭标题无法确认原帖如何解释动机，也不能判断其是否包含道德或健康主张。下方问题是本应用原创，不代表原帖建议。",
    boundary: "你可以选择同意、不同意或暂不判断。不需要接受一整套观念，才能改善一个自己在意的习惯。",
    prompt: "原创思考：这个目标是我自愿选择的吗？它想保护的是时间、休息、关系，还是别的东西？",
    action: "自愿试做：写一个不含自责、可随时修改的目标句。",
  },
  {
    id: "health-check", theme: "健康信息核查", kind: "医学来源", title: "将健康事实与恐惧说法分开",
    sourceTitle: "Masturbation", url: "https://my.clevelandclinic.org/health/articles/24332-masturbation", publisher: "Cleveland Clinic",
    scope: "已读页面正文中定义、副作用与求助部分；页面标注医学审核，更新于 2022-10-25",
    summary: "该医学机构将自慰描述为正常、常见的行为，并指出自慰不会导致不育、勃起功能障碍或精子数量下降；粗暴刺激可能造成局部不适。",
    boundary: "不能把普通性欲或自慰直接判成疾病。本次资料未提供支持“精液流失致全身衰弱”或“禁欲治病”的证据，不把这些说法收录为事实。",
    prompt: "原创思考：一条让我担心的健康说法，有可核对的医学依据吗？它是否只靠个案或恐吓？",
    action: "自愿试做：把一条健康疑问记下来，再核对医学来源；不要凭帖子自行诊断。",
  },
  {
    id: "when-support", theme: "健康信息核查", kind: "医学来源", title: "关注失控与生活影响，而不只是次数",
    sourceTitle: "Compulsive sexual behavior — Symptoms and causes", url: "https://www.mayoclinic.org/diseases-conditions/compulsive-sexual-behavior/symptoms-causes/syc-20360434", publisher: "Mayo Clinic",
    scope: "已读页面 Overview、Symptoms 与 When to see a doctor 部分",
    summary: "该页面关注难以控制、占用大量时间并影响工作或关系等生活领域的性行为。若感到失控，尤其已造成生活问题，可寻求合格专业人员的帮助。",
    boundary: "这是一般健康信息，不是诊断量表。应用不根据次数、天数、分数或一次念头判断你是否患病。",
    prompt: "原创思考：我想改变的是具体生活影响，还是对自己的苛责？哪些支持对我有帮助？",
    action: "自愿试做：写下想改善的一项生活影响，必要时带着问题寻求专业支持。",
  },
];

export function normalizeReadingNotes(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const { id } of READING_CARDS) {
    const note = value[id];
    if (!note || typeof note !== "object" || Array.isArray(note)) continue;
    result[id] = { reflection: typeof note.reflection === "string" ? note.reflection.slice(0, 2000) : "", selected: note.selected === true };
  }
  return result;
}
