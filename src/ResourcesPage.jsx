import ReadingCards from "./ReadingCards.jsx";
import { useState } from "react";
import { BookOpen, Link, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { safeSourceUrl } from "./lib/resources.js";

export default function ResourcesPage({ resources, onChange, notify, readingNotes, onReadingChange }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("待核实");
  const [filter, setFilter] = useState("全部");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const categories = ["待核实", "自我管理", "阅读笔记"];
  const shown = resources.filter(item => filter === "全部" || item.category === filter);
  return <div className="resources-layout">
    <section className="resource-intro card">
      <span className="eyebrow">YOUR READING SPACE</span>
      <h2>资料目录 · 由你选择阅读什么</h2>
      <p>收藏值得回看的来源，给每一条信息留出核实的空间。</p>
      <div className="resource-status"><ShieldCheck size={20} /><div><strong>戒色吧资料：静态整理 · 非实时获取</strong><p>已确认来源为百度贴吧戒色吧公开讨论。新增一篇已读第一页的经验分析；此前三篇正文返回 403 的条目仍仅保留标题和链接。每卡注明阅读范围，不冒充已读全帖。没有实时抓取、账号登录或自动同步。</p></div></div>
      <p className="small">社区经验不等于医学证据。普通性欲不是失败，本工具不评判你，也不声称禁欲能治病。</p>
    </section>
    <ReadingCards notes={readingNotes} onChange={onReadingChange} notify={notify} />
    <section className="card resource-form">
      <h3><Plus size={18} /> 添加来源链接</h3>
      <form onSubmit={event => {
        event.preventDefault(); if (!title.trim()) { setError("请填写资料标题。"); return; } const safe = safeSourceUrl(url);
        if (!safe) { setError("请输入完整的 http:// 或 https:// 链接，不支持脚本链接或包含账号密码的链接。"); return; }
        if (resources.length >= 200) { setError("最多保存 200 条来源，请先整理已有链接。"); return; }
        onChange([...resources, { id: crypto.randomUUID(), title: title.trim(), url: safe, category }]);
        setTitle(""); setUrl(""); setError(""); notify("来源链接已保存在本机，未获取网页内容。");
      }}>
        <label className="field-label" htmlFor="source-title">资料标题</label>
        <input id="source-title" required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="填写你自己的标题" />
        <label className="field-label" htmlFor="source-url">来源链接</label>
        <input id="source-url" required maxLength={2048} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
        <label className="field-label" htmlFor="source-category">目录分类</label>
        <select id="source-category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
        {error && <p role="alert" className="danger">{error}</p>}
        <button className="button primary full" type="submit"><Plus size={16} />保存来源</button>
      </form>
    </section>
    <section className="card resource-list">
      <div className="section-heading"><h3>我的资料目录</h3><span className="small muted">{resources.length} 条来源</span></div>
      <div className="resource-filters" aria-label="资料分类">{["全部", ...categories].map(c => <button key={c} className={`button ${filter === c ? "primary" : "secondary"} compact`} aria-pressed={filter === c} onClick={() => setFilter(c)}>{c}</button>)}</div>
      {!shown.length && <div className="empty-state"><BookOpen /><h3>这里还没有资料</h3><p>添加一条来源链接后，它会出现在这里。没有预置帖子或个人记录。</p></div>}
      {shown.map(item => <article className="source-item" key={item.id}>
        <span className="eyebrow">{item.category} · 手动收藏 / 内容未核实</span>
        <h3>{item.title}</h3><p className="source-url">{item.url}</p>
        <div className="button-row"><a className="button secondary compact" href={item.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><Link size={15} />打开外部来源</a>
        <button className="icon-button" aria-label={`删除来源 ${item.title}`} onClick={() => setDeleting(item.id)}><Trash2 size={17} /></button></div>
        {deleting === item.id && <div className="resource-confirm"><span>删除这条收藏？</span><button className="button secondary compact" onClick={() => setDeleting(null)}>保留</button><button className="button secondary compact" onClick={() => { onChange(resources.filter(r => r.id !== item.id)); setDeleting(null); }}>确认删除来源</button></div>}
      </article>)}
      <p className="small muted">点击外部来源后，会在新标签页打开第三方网站，并适用该网站的隐私规则。保存链接本身不会访问网站。</p>
    </section>
  </div>;
}
