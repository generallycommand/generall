import { useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { READING_CARDS, READING_ACCESS_DATE } from "./lib/reading.js";

function ExternalSource({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{children}<ExternalLink size={13} /></a>;
}

export default function ReadingCards({ notes, onChange, notify }) {
  const [theme, setTheme] = useState("全部主题");
  const [drafts, setDrafts] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const themes = ["全部主题", ...new Set(READING_CARDS.map(card => card.theme))];
  const cards = READING_CARDS.filter(card => theme === "全部主题" || card.theme === theme);
  return <section className="reading-module" aria-label="来源学习卡片">
    <div className="section-heading"><div><span className="eyebrow">READ · QUESTION · CHOOSE</span><h2><BookOpen size={23} /> 来源学习卡片</h2></div><span className="small muted">静态整理 · 5 张卡片</span></div>
    <p className="reading-intro">先看证据范围，再读整理，最后决定是否行动。3 条贴吧标题线索与 2 张医学核查卡分开展示；未读到的原帖正文不作摘要。个人经验待核实，不当作健康事实。</p>
    <div className="resource-filters" aria-label="学习主题">{themes.map(item => <button key={item} className={`button ${theme === item ? "primary" : "secondary"} compact`} aria-pressed={theme === item} onClick={() => setTheme(item)}>{item}</button>)}</div>
    <div className="reading-grid">{cards.map(card => {
      const note = notes[card.id] || { reflection: "", selected: false };
      const draft = drafts[card.id] ?? note.reflection;
      return <article className="card reading-card" key={card.id} aria-label={card.title}>
        <span className={`reading-kind ${card.kind === "医学来源" ? "medical" : ""}`}>{card.kind}</span><span className="small muted">{card.theme}</span>
        <h3>{card.title}</h3><p className="reading-evidence"><strong>证据范围</strong>{card.scope}</p>
        <h4>{card.kind === "医学来源" ? "医学资料 · 原创摘要" : "目录观察 · 不代表原帖全文"}</h4><p>{card.summary}</p>
        <h4>阅读边界</h4><p>{card.boundary}</p>
        <details><summary>来源与访问日期</summary><p>{card.publisher} · 访问日期 {READING_ACCESS_DATE}（UTC）</p><ExternalSource href={card.url}>{card.sourceTitle}</ExternalSource>{card.directory && <p><ExternalSource href={card.directory}>已读的公开目录页</ExternalSource></p>}<p className="small muted">来源可能更新、删除或限制访问。链接打开第三方网站；离线阅读本卡不需要联网。</p></details>
        <div className="reading-reflection"><label className="field-label" htmlFor={`reflection-${card.id}`}>{card.prompt}</label><textarea id={`reflection-${card.id}`} rows={3} maxLength={2000} placeholder="可留空，也可以不同意。只保存在你的本机。" value={draft} onChange={e => setDrafts(value => ({ ...value, [card.id]: e.target.value }))} />
          <div className="button-row"><button className="button secondary compact" onClick={() => { onChange({ ...notes, [card.id]: { ...note, reflection: draft } }); notify("阅读思考已保存到本机。"); }}>保存思考</button><span className="small muted">{draft.length}/2000 · {draft === note.reflection ? "与已存内容一致" : "文字尚未保存"}</span></div>
          <label className="reading-action"><input type="checkbox" checked={note.selected} onChange={e => onChange({ ...notes, [card.id]: { ...note, selected: e.target.checked } })} /><span>{card.action}<small>勾选仅代表愿意尝试，不表示已经完成；随时取消，无积分奖惩。</small></span></label>
          {(note.reflection || note.selected) && <button className="text-button" onClick={() => setPendingDelete(card.id)}>清除此卡记录</button>}
          {pendingDelete === card.id && <div className="resource-confirm"><span>清除此卡已存思考与行动选择？</span><button className="button secondary compact" onClick={() => setPendingDelete(null)}>保留</button><button className="button secondary compact" onClick={() => { const next = { ...notes }; delete next[card.id]; onChange(next); setDrafts(value => ({ ...value, [card.id]: "" })); setPendingDelete(null); notify("此卡个人记录已清除。"); }}>确认清除此卡</button></div>}
        </div>
      </article>;
    })}</div>
  </section>;
}
