import { useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  EyeOff,
  Footprints,
  Heart,
  History,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Wind,
} from "lucide-react";
import {
  LESSONS,
  STAGES,
  recordBehavior,
  adjustPoints,
  updateActionPoints,
  completeLesson,
  claimStage,
  undoLastBehavior,
  getLearningStats,
} from "./lib/learning.js";
import "./learning.css";

const actionIcons = {
  walk: Footprints,
  read: BookOpen,
  breathing: Wind,
  sleep: Moon,
  resisted: ShieldCheck,
  pornography: EyeOff,
  scrolling: Smartphone,
};
const signed = (value) => `${value >= 0 ? "+" : ""}${value}`;
const lessonTitle = (id) =>
  LESSONS.find((lesson) => lesson.id === id)?.title || id;

function eventTime(event) {
  const date = new Date(event.createdAt);
  if (!Number.isFinite(date.getTime())) return event.date || "";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PointsSummary({ state, onOpen }) {
  const stats = getLearningStats(state);
  return (
    <section className="ql-summary" aria-label="学习积分概览">
      <span className="ql-summary-icon">
        <Sprout size={23} />
      </span>
      <div className="ql-summary-copy">
        <span className="ql-eyebrow">每个选择，都有回响</span>
        <h3>
          我的成长积分 <strong>{stats.score}</strong>
          <small>分</small>
        </h3>
        <p>
          今日 {signed(stats.todayDelta)} 分 · 已完成 {stats.completedCount}{" "}
          节学习
        </p>
      </div>
      <button className="ql-summary-link" onClick={onOpen}>
        {stats.nextStage
          ? `前往「${stats.nextStage.title}」`
          : "查看我的学习成果"}
        <ArrowRight size={16} />
      </button>
    </section>
  );
}

function RulesEditor({ state, onChange, notify }) {
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");
  function save(event) {
    event.preventDefault();
    let updated = state;
    for (const action of state.actions) {
      const value = String(draft[action.id] ?? action.points).trim();
      if (
        !/^[+-]?\d+$/.test(value) ||
        Number(value) < -100 ||
        Number(value) > 100
      ) {
        setError("每项分值需要填写 −100 到 100 之间的整数，可以填写 0。");
        return;
      }
      updated = updateActionPoints(updated, action.id, Number(value));
    }
    onChange(updated);
    setDraft({});
    setError("");
    notify("积分规则已保存，下次记录时生效");
  }
  return (
    <details className="ql-details">
      <summary>
        <Settings2 size={16} /> 调整行为分值 <ChevronDown size={16} />
      </summary>
      <form onSubmit={save} className="ql-rule-form">
        <p>按自己的目标设置奖励或扣分。新的分值只影响之后的记录。</p>
        <div className="ql-rules-grid">
          {state.actions.map((action) => (
            <label key={action.id}>
              <span>{action.label}</span>
              <input
                type="number"
                min="-100"
                max="100"
                step="1"
                required
                aria-label={`${action.label}分值`}
                value={draft[action.id] ?? action.points}
                onChange={(event) =>
                  setDraft({ ...draft, [action.id]: event.target.value })
                }
              />
            </label>
          ))}
        </div>
        {error && (
          <p className="ql-form-error" role="alert">
            {error}
          </p>
        )}
        <button className="ql-button ql-button-primary" type="submit">
          保存积分规则
        </button>
      </form>
    </details>
  );
}

function ManualAdjustment({ state, onChange, notify }) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const value = delta.trim();
    if (
      !/^[+-]?\d+$/.test(value) ||
      !Number(value) ||
      Math.abs(Number(value)) > 100
    ) {
      setError("请填写 −100 到 100 之间的非零整数，例如 +5 或 −5。");
      return;
    }
    if (!note.trim()) {
      setError("写下调整原因，方便之后回顾。");
      return;
    }
    onChange(
      adjustPoints(state, {
        delta: Number(value),
        note: note.trim(),
        now: new Date(),
      }),
    );
    notify(`已调整 ${signed(Number(value))} 分，并保存原因`);
    setDelta("");
    setNote("");
    setError("");
  }
  return (
    <details className="ql-details">
      <summary>
        <Plus size={16} /> 手动调整积分 <ChevronDown size={16} />
      </summary>
      <form onSubmit={submit} className="ql-manual-form">
        <p>记录列表以外的行为，或修正记录。每次调整都会留在积分明细里。</p>
        <div className="ql-manual-fields">
          <label>
            增减分值
            <input
              type="text"
              inputMode="text"
              value={delta}
              maxLength={5}
              placeholder="例如 +5 或 -5"
              required
              onChange={(event) => setDelta(event.target.value)}
            />
          </label>
          <label>
            调整原因
            <input
              value={note}
              maxLength={200}
              placeholder="这次做了什么？"
              required
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>
        {error && (
          <p className="ql-form-error" role="alert">
            {error}
          </p>
        )}
        <button className="ql-button ql-button-primary" type="submit">
          记录积分调整
        </button>
      </form>
    </details>
  );
}

function Lesson({ lesson, index, completed, state, onChange, notify }) {
  const [answer, setAnswer] = useState(null);
  const [result, setResult] = useState(null);
  function checkAnswer(event) {
    event.preventDefault();
    if (answer === null || completed) return;
    const correct = answer === lesson.correctIndex;
    setResult(correct);
    if (correct) {
      onChange(completeLesson(state, lesson.id, new Date()));
      notify(`「${lesson.title}」学习通过，获得 ${lesson.reward ?? 15} 分`);
    }
  }
  return (
    <details className={`ql-lesson ${completed ? "ql-lesson-completed" : ""}`}>
      <summary>
        <span className="ql-lesson-number">
          {completed ? <Check size={19} /> : String(index + 1).padStart(2, "0")}
        </span>
        <span className="ql-lesson-title">
          <strong>{lesson.title}</strong>
          <small>{lesson.subtitle}</small>
        </span>
        <span className="ql-lesson-meta">
          {completed ? (
            <>
              <CheckCheck size={14} /> 已通过
            </>
          ) : (
            <>
              {lesson.minutes} 分钟 <i /> +{lesson.reward ?? 15} 分
            </>
          )}
        </span>
        <ChevronDown className="ql-disclosure" size={17} />
      </summary>
      <div className="ql-lesson-content">
        <div className="ql-lesson-reading">
          {lesson.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}>{paragraph}</p>
          ))}
        </div>
        {completed ? (
          <div className="ql-lesson-passed">
            <CheckCheck size={18} />
            <div>
              <strong>这节课，你已经通过了</strong>
              <p>随时回来复习。每节课的积分只领取一次。</p>
            </div>
          </div>
        ) : (
          <form onSubmit={checkAnswer} className="ql-quiz">
            <div className="ql-quiz-label">
              <CircleHelp size={15} /> 一道小练习，把理解带回生活
            </div>
            <fieldset>
              <legend>{lesson.question}</legend>
              {lesson.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`ql-answer ${answer === optionIndex ? "ql-answer-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={`quiz-${lesson.id}`}
                    checked={answer === optionIndex}
                    value={optionIndex}
                    onChange={() => {
                      setAnswer(optionIndex);
                      setResult(null);
                    }}
                  />
                  <span className="ql-answer-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
            {result === false && (
              <div className="ql-quiz-feedback" role="status">
                <strong>再想一想，这次暂不计分。</strong>
                <p>{lesson.explanation}</p>
              </div>
            )}
            <button
              className="ql-button ql-button-primary"
              type="submit"
              disabled={answer === null}
            >
              验证并完成学习 <ArrowRight size={15} />
            </button>
          </form>
        )}
        {completed && result === true && (
          <p className="ql-correct-explanation" role="status">
            {lesson.explanation}
          </p>
        )}
      </div>
    </details>
  );
}

export default function LearningPage({ state, onChange, notify }) {
  const stats = getLearningStats(state);
  const [note, setNote] = useState("");
  const [shown, setShown] = useState(20);
  const reversedIds = new Set(
    state.events
      .filter((event) => event.kind === "reversal")
      .map((event) => event.referenceId),
  );
  const undoable = [...state.events]
    .reverse()
    .find(
      (event) =>
        ["behavior", "manual"].includes(event.kind) &&
        !reversedIds.has(event.id),
    );
  const events = [...state.events].reverse();
  const nextStage = stats.nextStage;
  const remaining = nextStage
    ? Math.max(0, nextStage.threshold - stats.score)
    : 0;
  const remainingLessons =
    nextStage?.requiredLessons.filter(
      (id) => !state.completedLessons.includes(id),
    ) || [];
  function record(action) {
    onChange(
      recordBehavior(state, {
        actionId: action.id,
        note: note.trim(),
        now: new Date(),
      }),
    );
    setNote("");
    notify(`${action.label}：${signed(action.points)} 分，已记入明细`);
  }
  function undo() {
    if (!undoable) return;
    onChange(undoLastBehavior(state, new Date()));
    notify(`已撤销「${undoable.label}」，原记录保留在明细中`);
  }
  return (
    <div className="ql-page">
      <section className="ql-score-hero" aria-label="积分与学习进度">
        <div className="ql-hero-main">
          <div className="ql-hero-eyebrow">
            <Sprout size={16} /> 把小小的行动，积累成改变
          </div>
          <div className="ql-score-row">
            <span className="ql-score" aria-live="polite" aria-atomic="true">
              {stats.score}
            </span>
            <span className="ql-score-unit">
              成长积分
              <span className="ql-today">
                今日 {signed(stats.todayDelta)} 分
              </span>
            </span>
          </div>
          <p>
            记录一次行动，认真学一点。
            <br />
            让每一步努力都有迹可循。
          </p>
          <div className="ql-hero-metrics">
            <span>
              <BookOpen size={15} /> 学习 {stats.completedCount} /{" "}
              {LESSONS.length}
            </span>
            <span>
              <Award size={15} /> 通过 {stats.claimedCount} / {STAGES.length} 关
            </span>
          </div>
          <span className="ql-hero-decoration" aria-hidden="true">
            <Leaf size={136} strokeWidth={0.75} />
          </span>
        </div>
        <div className="ql-hero-progress">
          <span className="ql-eyebrow">
            {nextStage ? "你的下一站" : "每一步都值得被看见"}
          </span>
          <div className="ql-next-stage">
            <h2>{nextStage?.title || "所有关卡已通过"}</h2>
            <span>
              <Target size={19} />
            </span>
          </div>
          <p>
            {nextStage?.description ||
              "把学到的方法用在生活里，继续记录属于自己的成长。"}
          </p>
          <div className="ql-progress-heading">
            <span>{nextStage ? "积分目标" : "学习旅程"}</span>
            <strong>
              {nextStage ? `${stats.score} / ${nextStage.threshold}` : "已完成"}
            </strong>
          </div>
          <div
            className="ql-progress-track"
            role="progressbar"
            aria-label="下一关积分进度"
            aria-valuenow={Math.max(0, Math.min(100, stats.stageProgress))}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              style={{
                width: `${Math.max(0, Math.min(100, stats.stageProgress))}%`,
              }}
            />
          </div>
          <div className="ql-progress-hint">
            {nextStage ? (
              <>
                <span>{remaining ? `还需 ${remaining} 分` : "积分已达标"}</span>
                <span>
                  {remainingLessons.length
                    ? `还需完成 ${remainingLessons.length} 节学习`
                    : "学习已达标"}
                </span>
              </>
            ) : (
              <span>课程可以反复复习，积分奖励只领取一次</span>
            )}
          </div>
          <div className="ql-score-totals">
            <span>
              累计获得 <strong>+{stats.totalEarned}</strong>
            </span>
            <span>
              累计扣除 <strong>−{stats.totalDeducted}</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="ql-card ql-behavior-section">
        <div className="ql-section-head">
          <div>
            <span className="ql-eyebrow">SMALL ACTIONS, REAL CHANGE</span>
            <h2>今天，做了什么？</h2>
            <p>点击一次记录一次，分数随行为即时变化。</p>
          </div>
          <span className="ql-soft-icon">
            <TrendingUp size={22} />
          </span>
        </div>
        <label className="ql-note-label" htmlFor="behavior-note">
          给这次行动留句话 <span>选填 · 用于下一次记录</span>
        </label>
        <input
          id="behavior-note"
          value={note}
          maxLength={200}
          placeholder="比如：饭后出去散步，回来心情轻松了一点"
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="ql-actions-grid">
          {state.actions.map((action) => {
            const Icon = actionIcons[action.id] || Leaf;
            return (
              <button
                key={action.id}
                className={`ql-action ${action.points < 0 ? "ql-action-deduct" : ""}`}
                onClick={() => record(action)}
              >
                <span className="ql-action-top">
                  <span className="ql-action-icon">
                    <Icon size={21} />
                  </span>
                  <strong>
                    {signed(action.points)}
                    <small>分</small>
                  </strong>
                </span>
                <span className="ql-action-name">{action.label}</span>
                <span className="ql-action-description">
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ql-behavior-footer">
          <p>
            <Heart size={14} /> 分数是行动的记录，不代表你的价值。
          </p>
          <button
            className="ql-text-button"
            onClick={undo}
            disabled={!undoable}
            title={
              undoable
                ? `撤销：${undoable.label}（${signed(undoable.delta)} 分）`
                : "还没有可撤销的行为"
            }
          >
            <RotateCcw size={14} /> 撤销最近行为
          </button>
        </div>
        <div className="ql-settings">
          <RulesEditor state={state} onChange={onChange} notify={notify} />
          <ManualAdjustment state={state} onChange={onChange} notify={notify} />
        </div>
      </section>

      <section className="ql-card ql-learning-section">
        <div className="ql-section-head">
          <div>
            <span className="ql-eyebrow">LEARN A LITTLE, GROW A LITTLE</span>
            <h2>学会理解自己</h2>
            <p>读完短课，答对练习，解锁下一步。每课首次通过 +15 分。</p>
          </div>
          <span className="ql-count">
            {stats.completedCount}
            <small> / {LESSONS.length}</small>
          </span>
        </div>
        <div className="ql-lessons">
          {LESSONS.map((lesson, index) => (
            <Lesson
              key={lesson.id}
              lesson={lesson}
              index={index}
              completed={state.completedLessons.includes(lesson.id)}
              state={state}
              onChange={onChange}
              notify={notify}
            />
          ))}
        </div>
      </section>

      <section className="ql-stage-section" aria-labelledby="stage-heading">
        <div className="ql-section-head">
          <div>
            <span className="ql-eyebrow">YOUR MILESTONES</span>
            <h2 id="stage-heading">让成长，一关一关发生</h2>
            <p>依次达到积分与学习目标，手动领取每关 +20 分奖励。</p>
          </div>
        </div>
        <div className="ql-stages-grid">
          {STAGES.map((stage, index) => {
            const claimed = state.claimedStages.includes(stage.id);
            const previousDone = STAGES.slice(0, index).every((previous) =>
              state.claimedStages.includes(previous.id),
            );
            const lessonsDone = stage.requiredLessons.every((id) =>
              state.completedLessons.includes(id),
            );
            const scoreDone = stats.score >= stage.threshold;
            const eligible =
              !claimed && previousDone && lessonsDone && scoreDone;
            return (
              <article
                key={stage.id}
                className={`ql-stage ${claimed ? "ql-stage-claimed" : ""} ${eligible ? "ql-stage-ready" : ""}`}
              >
                <div className="ql-stage-top">
                  <span className="ql-stage-number">关卡 0{index + 1}</span>
                  <span className="ql-stage-reward">
                    {claimed ? (
                      <>
                        <CheckCheck size={14} /> 已领取
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} /> +{stage.reward ?? 20} 分
                      </>
                    )}
                  </span>
                </div>
                <h3>{stage.title}</h3>
                <p className="ql-stage-description">{stage.description}</p>
                <ul className="ql-stage-requirements">
                  <li
                    className={scoreDone || claimed ? "ql-requirement-met" : ""}
                  >
                    {scoreDone || claimed ? (
                      <Check size={14} />
                    ) : (
                      <span className="ql-check-empty" />
                    )}
                    积分达到 {stage.threshold} 分
                  </li>
                  {stage.requiredLessons.map((id) => (
                    <li
                      key={id}
                      className={
                        state.completedLessons.includes(id)
                          ? "ql-requirement-met"
                          : ""
                      }
                    >
                      {state.completedLessons.includes(id) ? (
                        <Check size={14} />
                      ) : (
                        <span className="ql-check-empty" />
                      )}
                      通过「{lessonTitle(id)}」
                    </li>
                  ))}
                </ul>
                <button
                  className={`ql-button ${eligible ? "ql-button-primary" : "ql-button-subtle"}`}
                  disabled={!eligible}
                  onClick={() => {
                    onChange(claimStage(state, stage.id, new Date()));
                    notify(
                      `「${stage.title}」通过，获得 ${stage.reward ?? 20} 分奖励`,
                    );
                  }}
                >
                  {claimed ? (
                    <>
                      <CheckCheck size={16} /> 本关已通过
                    </>
                  ) : eligible ? (
                    <>
                      <Award size={16} /> 通过并领取奖励
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={14} />{" "}
                      {previousDone ? "完成条件后通过" : "先通过上一关"}
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ql-card ql-ledger-section">
        <div className="ql-section-head">
          <div>
            <span className="ql-eyebrow">EVERY STEP COUNTS</span>
            <h2>积分明细</h2>
            <p>从 100 分开始，每次增减都有记录。共 {events.length} 条。</p>
          </div>
          <span className="ql-soft-icon">
            <History size={22} />
          </span>
        </div>
        {events.length ? (
          <>
            <div className="ql-ledger" role="list">
              {events.slice(0, shown).map((event) => (
                <div
                  key={event.id}
                  className={`ql-ledger-row ${reversedIds.has(event.id) ? "ql-ledger-reversed" : ""}`}
                  role="listitem"
                >
                  <span
                    className={`ql-ledger-symbol ${event.delta < 0 ? "ql-ledger-symbol-minus" : ""}`}
                  >
                    {event.kind === "lesson" ? (
                      <BookOpen size={17} />
                    ) : event.kind === "stage" ? (
                      <Award size={17} />
                    ) : event.kind === "reversal" ? (
                      <RotateCcw size={16} />
                    ) : (
                      <Leaf size={17} />
                    )}
                  </span>
                  <div className="ql-ledger-copy">
                    <strong>
                      {event.label}
                      {reversedIds.has(event.id) && <small>已撤销</small>}
                    </strong>
                    {event.note && <p>{event.note}</p>}
                    <time dateTime={event.createdAt}>{eventTime(event)}</time>
                  </div>
                  <strong
                    className={`ql-ledger-delta ${event.delta < 0 ? "ql-negative" : ""}`}
                  >
                    {signed(event.delta)}
                    <small>分</small>
                  </strong>
                </div>
              ))}
            </div>
            {events.length > shown && (
              <button
                className="ql-load-more"
                onClick={() => setShown(shown + 20)}
              >
                再看 20 条记录 <ChevronDown size={15} />
              </button>
            )}
          </>
        ) : (
          <div className="ql-ledger-empty">
            <Leaf size={28} />
            <h3>你的下一步，从这里开始</h3>
            <p>记录一次行动，或完成第一节学习，让成长留下足迹。</p>
          </div>
        )}
      </section>
    </div>
  );
}
