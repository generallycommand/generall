import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  Flame,
  Footprints,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  MoreHorizontal,
  Mountain,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Upload,
  Wind,
  X,
} from "lucide-react";
import {
  createInitialState,
  normalizeState,
  localDateKey,
  getStats,
  saveCheckin,
  toggleHabit,
  lastDays,
  formatMinutes,
} from "./lib/tracker.js";
import ResourcesPage from "./ResourcesPage.jsx";
import LearningPage, { PointsSummary } from "./LearningPage.jsx";
import {
  createLearningState,
  normalizeLearningState,
  getLearningStats,
} from "./lib/learning.js";
import {
  createBackup,
  parseBackup,
  normalizePreferences,
} from "./lib/backup.js";

const STORAGE_KEY = "qingxing.journey.v1";
const PREFS_KEY = "qingxing.preferences.v1";
const LEARNING_KEY = "qingxing.learning.v1";
const navItems = [
  { id: "overview", label: "我的概览", icon: LayoutDashboard },
  { id: "learning", label: "学习与积分", icon: GraduationCap },
  { id: "plan", label: "我的计划", icon: Target },
  { id: "progress", label: "成长记录", icon: TrendingUp },
  { id: "resources", label: "资料目录", icon: BookOpen },
  { id: "tools", label: "静心工具", icon: Wind },
];
const moods = [
  { id: "good", face: "☺", label: "状态不错", color: "green" },
  { id: "okay", face: "◡", label: "平平淡淡", color: "yellow" },
  { id: "hard", face: "≈", label: "有点挑战", color: "purple" },
];
const iconMap = {
  walk: Footprints,
  book: BookOpen,
  moon: Moon,
  coffee: Coffee,
  leaf: Leaf,
};
const quotes = [
  ["你不需要一下子变得很好，", "今天比昨天多走一步，就很好。"],
  ["冲动像一阵浪，会来，也会退去。", "你可以看着它经过，而不必跟随。"],
  ["允许自己走得慢一点，", "每一次重新开始，都值得被认真对待。"],
];

function readState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return createInitialState();
  }
}
function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY));
    return normalizePreferences(value);
  } catch {
    return normalizePreferences(null);
  }
}
function readLearningState() {
  try {
    return normalizeLearningState(
      JSON.parse(localStorage.getItem(LEARNING_KEY)),
    );
  } catch {
    return createLearningState();
  }
}
function cn(...args) {
  return args.filter(Boolean).join(" ");
}
function formatDate(key, options = {}) {
  return new Date(`${key}T12:00:00`).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    ...options,
  });
}

function Modal({ title, eyebrow, onClose, children, className = "" }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("button, input, textarea")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const elements = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled), input, textarea, select, [tabindex="0"]',
          ),
        ];
        const first = elements[0];
        const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className={cn("modal", className)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="关闭弹窗"
        >
          <X size={20} />
        </button>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function CheckinModal({ current, onSave, onClose }) {
  const [mood, setMood] = useState(current?.mood || "good");
  const [note, setNote] = useState(current?.note || "");
  return (
    <Modal
      title={current ? "再看看今天的自己" : "今天，你感觉怎么样？"}
      eyebrow="A MOMENT FOR YOURSELF"
      onClose={onClose}
    >
      <p className="modal-description">
        不用给自己打分。诚实地记录，就是很好的开始。
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ mood, note });
        }}
      >
        <div className="mood-options">
          {moods.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mood === item.id}
              className={cn(
                "mood-option",
                mood === item.id && "selected",
                item.color,
              )}
              onClick={() => setMood(item.id)}
            >
              <span className="mood-face">{item.face}</span>
              <span>{item.label}</span>
              {mood === item.id && <Check size={14} />}
            </button>
          ))}
        </div>
        <label className="field-label" htmlFor="daily-note">
          留一句话给自己 <span>选填</span>
        </label>
        <textarea
          id="daily-note"
          maxLength={2000}
          placeholder="今天有什么值得记住的小进步？或是什么时刻有点难？"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
        />
        <p className="privacy-note">
          <ShieldCheck size={14} /> 这份记录只保存在你的浏览器中
        </p>
        <button className="button primary full" type="submit">
          <Check size={17} />
          {current ? "保存今天的记录" : "完成今日打卡"}
        </button>
      </form>
    </Modal>
  );
}

function BreathingModal({ onClose }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(null);
  useEffect(() => {
    if (!running) return;
    started.current = Date.now() - elapsed * 1000;
    const timer = setInterval(() => {
      const seconds = Math.min(
        60,
        Math.floor((Date.now() - started.current) / 1000),
      );
      setElapsed(seconds);
      if (seconds >= 60) setRunning(false);
    }, 200);
    return () => clearInterval(timer);
  }, [running]);
  const phase = elapsed % 10;
  const instruction =
    elapsed === 60
      ? "做得很好"
      : !running
        ? "慢下来，回到此刻"
        : phase < 4
          ? "轻轻吸气"
          : phase < 6
            ? "停留片刻"
            : "缓缓呼气";
  return (
    <Modal
      title="给自己一分钟"
      eyebrow="BREATHE. RESET. BEGIN AGAIN."
      onClose={onClose}
      className="breathing-modal"
    >
      <p className="modal-description">让肩膀放松，跟着圆圈的节奏呼吸。</p>
      <div
        className={cn(
          "breath-orbit",
          running && "running",
          running && phase < 6 && "inhale",
        )}
      >
        <div className="breath-circle">
          <Wind size={34} />
          <strong>{instruction}</strong>
          <span>
            {elapsed === 60
              ? "你已经为自己留出了一点空间"
              : `${60 - elapsed} 秒`}
          </span>
        </div>
      </div>
      <div className="breath-rhythm">
        <span>吸气 4 秒</span>
        <i />
        <span>停留 2 秒</span>
        <i />
        <span>呼气 4 秒</span>
      </div>
      <button
        className="button primary full"
        onClick={() => {
          if (elapsed === 60) setElapsed(0);
          setRunning(!running);
        }}
      >
        {running ? <Pause size={17} /> : <Play size={17} />}
        {running
          ? "暂停练习"
          : elapsed === 60
            ? "再练习一次"
            : elapsed
              ? "继续呼吸"
              : "开始呼吸"}
      </button>
      <p className="small muted">按自己舒适的节奏即可，随时可以暂停。</p>
    </Modal>
  );
}

function FocusModal({ onClose }) {
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const deadline = useRef(null);
  useEffect(() => {
    if (!running) return;
    deadline.current = Date.now() + remaining * 1000;
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (!left) setRunning(false);
    }, 200);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <Modal
      title="把注意力交给一件小事"
      eyebrow="ONE THING AT A TIME"
      onClose={onClose}
      className="focus-modal"
    >
      <p className="modal-description">
        读书、整理房间，或完成一件一直想做的事。
      </p>
      <div className="duration-tabs">
        {[5, 15, 25].map((value) => (
          <button
            key={value}
            disabled={running}
            className={cn(duration === value && "active")}
            onClick={() => {
              setDuration(value);
              setRemaining(value * 60);
            }}
          >
            {value} 分钟
          </button>
        ))}
      </div>
      <div className="focus-clock">
        <span>{formatMinutes(remaining)}</span>
        <p>
          {remaining === 0
            ? "专注完成。给自己一个小小的肯定。"
            : running
              ? "这一刻，只属于你。"
              : "准备好了，就开始吧。"}
        </p>
      </div>
      <div className="button-row">
        <button
          className="button secondary"
          aria-label="重置计时器"
          onClick={() => {
            setRunning(false);
            setRemaining(duration * 60);
          }}
        >
          <RotateCcw size={18} />
        </button>
        <button
          className="button primary grow"
          onClick={() => {
            if (!remaining) setRemaining(duration * 60);
            setRunning(!running);
          }}
        >
          {running ? <Pause size={17} /> : <Play size={17} />}
          {running ? "暂停" : remaining === 0 ? "再专注一次" : "开始专注"}
        </button>
      </div>
      <p className="small muted">关闭窗口会结束本次计时。</p>
    </Modal>
  );
}

function HabitModal({ onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [icon, setIcon] = useState("leaf");
  return (
    <Modal
      title="种下一个好习惯"
      eyebrow="SMALL HABITS. BIG CHANGES."
      onClose={onClose}
    >
      <p className="modal-description">从一件足够小、今天就能做的事开始。</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim())
            onSave({
              id: `habit-${crypto.randomUUID()}`,
              title: title.trim(),
              description: "为自己留一点时间",
              minutes: Number(minutes),
              icon,
            });
        }}
      >
        <label className="field-label" htmlFor="habit-title">
          习惯名称
        </label>
        <input
          id="habit-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={30}
          required
          placeholder="例如：做 10 分钟拉伸"
        />
        <label className="field-label" htmlFor="habit-minutes">
          每天投入的时间（分钟）
        </label>
        <input
          id="habit-minutes"
          type="number"
          min="1"
          max="180"
          required
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
        />
        <label className="field-label">选择一个图标</label>
        <div className="icon-options">
          {Object.entries(iconMap).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={
                {
                  walk: "步行",
                  book: "读书",
                  moon: "月亮",
                  coffee: "咖啡",
                  leaf: "叶子",
                }[key]
              }
              aria-pressed={icon === key}
              className={cn(icon === key && "selected")}
              onClick={() => setIcon(key)}
            >
              <Icon size={22} />
            </button>
          ))}
        </div>
        <button className="button primary full" type="submit">
          <Plus size={17} />
          添加习惯
        </button>
      </form>
    </Modal>
  );
}

function GoalModal({ state, onSave, onClose }) {
  const [goal, setGoal] = useState(state.goalDays);
  const [goalText, setGoalText] = useState(state.goalText || "");
  return (
    <Modal
      title="给成长一个小目标"
      eyebrow="YOUR JOURNEY, YOUR PACE"
      onClose={onClose}
    >
      <p className="modal-description">
        由你定义希望调整的习惯。天数表示连续自评记录，不代表禁欲天数。
      </p>
      <form onSubmit={event => { event.preventDefault(); onSave(Number(goal), goalText.trim()); }}>
      <label className="field-label" htmlFor="goal-text">我想做出的改变（选填）</label>
      <input id="goal-text" maxLength={200} value={goalText} onChange={e => setGoalText(e.target.value)} placeholder="例如：睡前放下手机，留出阅读时间" />
      <label className="field-label" htmlFor="goal-days">目标天数（1–3650）</label>
      <input id="goal-days" type="number" min="1" max="3650" required value={goal} onChange={e => setGoal(e.target.value)} />
      <div className="goal-options">
        {[7, 21, 30, 90].map((days) => (
          <button
            key={days}
            type="button"
            className={cn(goal === days && "selected")}
            onClick={() => setGoal(days)}
          >
            <strong>{days}</strong>
            <span>天</span>
            {goal === days && <Check size={16} />}
          </button>
        ))}
      </div>
      <p className="gentle-note">
        <Sprout size={18} />
        目标是一个方向，不是一场考试。中断之后，随时可以重新出发。
      </p>
      <button className="button primary full" type="submit">
        保存我的目标
        <ArrowRight size={17} />
      </button>
      </form>
    </Modal>
  );
}

function WeekDots({ state, today }) {
  const checked = new Set(state.checkins.map((entry) => entry.date));
  const date = new Date(`${today}T12:00:00`);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return (
    <div className="week-dots">
      {["一", "二", "三", "四", "五", "六", "日"].map((label, index) => {
        const current = new Date(date);
        current.setDate(date.getDate() + index);
        const key = localDateKey(current);
        return (
          <div key={label} className={cn("week-day", key === today && "today")}>
            <span>{label}</span>
            <div
              className={cn(
                "day-dot",
                checked.has(key) && "checked",
                key > today && "future",
              )}
              title={`${formatDate(key)}${checked.has(key) ? " 已打卡" : " 未打卡"}`}
            >
              {checked.has(key) ? (
                <Check size={15} />
              ) : key === today ? (
                <span className="dot" />
              ) : (
                <span />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HabitList({ state, today, onToggle, onDelete, editable = false }) {
  const done = state.completions[today] || [];
  return (
    <div className="habit-list">
      {state.habits.map((habit) => {
        const Icon = iconMap[habit.icon] || Leaf;
        const completed = done.includes(habit.id);
        return (
          <div
            className={cn("habit-item", completed && "completed")}
            key={habit.id}
          >
            <div className={cn("habit-icon", habit.icon)}>
              <Icon size={21} strokeWidth={1.6} />
            </div>
            <div className="habit-copy">
              <strong>{habit.title}</strong>
              <p>{habit.description}</p>
            </div>
            <span className="habit-duration">
              <Clock3 size={12} />
              {habit.minutes} 分钟
            </span>
            <button
              className="habit-check"
              onClick={() => onToggle(habit.id)}
              aria-label={`${completed ? "取消完成" : "完成"}${habit.title}`}
              aria-pressed={completed}
            >
              <Check size={15} />
            </button>
            {editable && (
              <button
                className="icon-button delete-habit"
                onClick={() => onDelete(habit.id)}
                aria-label={`删除${habit.title}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      })}
      {state.habits.length === 0 && (
        <div className="empty-state">
          <Sprout />
          <p>从一个喜欢的小习惯开始。</p>
        </div>
      )}
    </div>
  );
}

function ActivityChart({ state, today, large = false }) {
  const days = lastDays(7, new Date(`${today}T12:00:00`));
  return (
    <div className={cn("activity-chart", large && "large")}>
      <div className="chart-y">
        <span>100%</span>
        <span>50%</span>
        <span>0</span>
      </div>
      <div className="chart-plot">
        <div className="chart-grid">
          <i />
          <i />
          <i />
        </div>
        {days.map((day) => {
          const completed = (state.completions[day] || []).length;
          const ratio = state.habits.length
            ? Math.min(100, (completed / state.habits.length) * 100)
            : 0;
          return (
            <div
              className="chart-column"
              key={day}
              title={`${formatDate(day)}：完成 ${completed} 个习惯`}
            >
              <div className="bar-track">
                <div
                  className={cn("chart-bar", day === today && "current")}
                  style={{ height: `${ratio}%` }}
                />
                {ratio > 0 && (
                  <span className="bar-tooltip">{completed} 个</span>
                )}
              </div>
              <span className={cn(day === today && "current-label")}>
                {day === today
                  ? "今天"
                  : formatDate(day, { month: "numeric", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Calendar({ state, today }) {
  const [month, setMonth] = useState(
    () => new Date(`${today.slice(0, 7)}-01T12:00:00`),
  );
  const year = month.getFullYear();
  const index = month.getMonth();
  const offset = (new Date(year, index, 1).getDay() + 6) % 7;
  const count = new Date(year, index + 1, 0).getDate();
  const checked = new Set(state.checkins.map((item) => item.date));
  return (
    <section className="card calendar-card">
      <div className="section-heading">
        <h3>
          {year} 年 {index + 1} 月
        </h3>
        <div className="button-row">
          <button
            className="icon-button"
            aria-label="上个月"
            onClick={() => setMonth(new Date(year, index - 1, 1))}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="下个月"
            onClick={() => setMonth(new Date(year, index + 1, 1))}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["一", "二", "三", "四", "五", "六", "日"].map((value) => (
          <span key={value} className="calendar-label">
            {value}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const day = localDateKey(new Date(year, index, i + 1));
          return (
            <div
              key={day}
              className={cn(
                "calendar-day",
                checked.has(day) && "checked",
                day === today && "today",
              )}
              title={checked.has(day) ? "已打卡" : "暂无记录"}
            >
              {i + 1}
              {checked.has(day) && <span />}
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span className="legend-dot" />
        已完成打卡
        <span className="legend-outline" />
        今天
      </div>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState(readState);
  const [preferences, setPreferences] = useState(readPreferences);
  const [learning, setLearning] = useState(readLearningState);
  const [page, setPage] = useState(() =>
    window.location.protocol === "file:" ? "learning" : "overview",
  );
  const [modal, setModal] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 700px)").matches,
  );
  const [toast, setToast] = useState("");
  const [today, setToday] = useState(localDateKey());
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const [settingsName, setSettingsName] = useState(state.name);
  const [pendingImport, setPendingImport] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const importInput = useRef(null);
  const reminderDay = useRef("");
  const stats = getStats(state);
  const current = state.checkins.find((entry) => entry.date === today);
  const doneCount = (state.completions[today] || []).length;
  const notify = (message) => setToast(message);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
      localStorage.setItem(LEARNING_KEY, JSON.stringify(learning));
      setStorageError(false);
      setLastSaved(new Date());
    } catch {
      setStorageError(true);
    }
  }, [state, preferences, learning]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setIsMobile(media.matches);
    const onKey = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    media.addEventListener("change", update);
    document.addEventListener("keydown", onKey);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const key = localDateKey(now);
      setToday(key);
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (
        preferences.reminder &&
        time >= preferences.time &&
        reminderDay.current !== key &&
        !state.checkins.some((item) => item.date === key)
      ) {
        reminderDay.current = key;
        notify("给自己留一分钟吧，今天的打卡在等你。");
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [preferences, state.checkins]);
  const navigate = (next) => {
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onToggle = (id) => setState((value) => toggleHabit(value, id, today));
  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify(createBackup(state, preferences, learning), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `清醒记录-${today}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("你的记录已导出，请妥善保管。");
  };
  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify("备份超过 10 MB，请选择较小的备份文件。");
      return;
    }
    try {
      const backup = parseBackup(await file.text());
      setPendingImport(backup);
      setModal("import");
    } catch (error) {
      notify(error.message || "未能读取备份，现有记录未被修改。");
    }
  };
  const pageInfo = {
    overview: [
      "把今天，过得更清醒一点",
      "不必急着成为更好的自己，从照顾好今天开始。",
    ],
    learning: [
      "每一次选择，都看得见成长",
      "记录行为加减分，学习答题得积分，达到条件后解锁下一阶段。",
    ],
    plan: [
      "小小的习惯，大大的改变",
      "给注意力一个新的方向，让想要的生活慢慢发生。",
    ],
    progress: ["每一步，都算数", "记录不是为了完美，而是看见自己真实的成长。"],
    tools: ["慢下来，回到自己", "当冲动出现时，先给自己一点时间和空间。"],
    resources: ["为自己，留一份阅读目录", "静态学习卡 · 证据范围可见 · 思考留在本机"],
    settings: ["让清醒，更适合你", "按照自己的节奏，安排好每一天。"],
  };
  return (
    <div className="app-shell">
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        id="main-navigation"
        className={cn("sidebar", mobileOpen && "open")}
        inert={isMobile && !mobileOpen ? true : undefined}
      >
        <button
          className="brand"
          onClick={() => navigate("overview")}
          aria-label="清醒首页"
        >
          <span className="brand-mark">
            <Sprout size={25} strokeWidth={1.8} />
          </span>
          <span>
            清醒<span className="brand-en">QINGXING</span>
          </span>
        </button>
        <div className="workspace-label">
          我的自律空间
          <span>
            {window.location.protocol === "file:" ? "OFFLINE" : "PERSONAL"}
          </span>
        </div>
        <nav aria-label="主导航">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cn("nav-item", page === id && "active")}
              onClick={() => navigate(id)}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {id === "overview" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-support">
          <div className="support-leaves">
            <Leaf size={24} />
            <Sparkles size={14} />
          </div>
          <h3>
            冲动会过去，
            <br />
            你可以留下来。
          </h3>
          <p>先暂停一下，陪自己呼吸。</p>
          <button onClick={() => setModal("breathe")}>
            我需要缓一缓 <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className={cn("nav-item", page === "settings" && "active")}
            onClick={() => navigate("settings")}
          >
            <Settings2 size={18} />
            <span>偏好设置</span>
          </button>
          <div className="sidebar-profile">
            <span className="avatar">
              <Sprout size={21} />
            </span>
            <div>
              <strong>
                {state.name === "朋友" ? "正在成长的你" : state.name}
              </strong>
              <span>按自己的节奏前进</span>
            </div>
            <button
              className="icon-button"
              aria-label="编辑个人资料"
              onClick={() => navigate("settings")}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
              aria-controls="main-navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span>个人空间</span>
            <ChevronRight size={13} />
            <strong>
              {page === "settings"
                ? "偏好设置"
                : navItems.find((item) => item.id === page)?.label}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="private-badge">
              <ShieldCheck size={14} />
              私密且安心
            </span>
            <span className="topbar-divider" />
            <button
              className="avatar small-avatar"
              aria-label="打开个人设置"
              onClick={() => navigate("settings")}
            >
              清
            </button>
          </div>
        </header>
        <main>
          {storageError && (
            <div className="storage-warning" role="alert">
              浏览器未允许保存数据。当前记录仅在本次页面中保留，请在离开前导出。
            </div>
          )}
          <section className="page-heading">
            <div>
              <div className="heading-eyebrow">
                <span />A LITTLE BETTER, EVERY DAY
              </div>
              <h1>{pageInfo[page][0]}</h1>
              <p>{pageInfo[page][1]}</p>
            </div>
            <div className="date-label">
              <CalendarDays size={15} />
              {formatDate(today, { year: "numeric", weekday: "long" })}
            </div>
          </section>

          {page === "overview" && (
            <>
              <PointsSummary
                state={learning}
                onOpen={() => navigate("learning")}
              />
              <div className="dashboard-grid">
                <div className="main-column">
                  <section className="hero-card">
                    <img
                      src={`${import.meta.env.BASE_URL}landscape.svg`}
                      alt="阳光落在连绵的青山和安静的森林中"
                    />
                    <div className="hero-shade" />
                    <div className="hero-content">
                      <span className="hero-tag">
                        <span />
                        你的改变，从此刻开始
                      </span>
                      <h2>
                        把注意力还给生活，
                        <br />
                        把主动权还给自己。
                      </h2>
                      <p>
                        少一点内耗，多一点真实的快乐。
                        <br />
                        每一个清醒的选择，都在让你更自由。
                      </p>
                      <button
                        className="button hero-button"
                        onClick={() => setModal("checkin")}
                      >
                        {current ? (
                          <CheckCheck size={17} />
                        ) : (
                          <Check size={17} />
                        )}
                        {current ? "今天已打卡 · 查看记录" : "完成今日打卡"}
                        <ArrowRight size={16} />
                      </button>
                      <span className="hero-footnote">
                        不追求完美，只期待前进一点。
                      </span>
                    </div>
                    <span className="hero-coordinate">
                      GROW AT YOUR OWN PACE ↗
                    </span>
                  </section>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-icon peach">
                        <Flame size={20} />
                      </span>
                      <div>
                        <span className="stat-label">连续打卡</span>
                        <strong>
                          {stats.streak}
                          <small>天</small>
                        </strong>
                      </div>
                      <span className="stat-note">坚持的力量</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon mint">
                        <CalendarDays size={19} />
                      </span>
                      <div>
                        <span className="stat-label">累计清醒记录</span>
                        <strong>
                          {stats.totalDays}
                          <small>天</small>
                        </strong>
                      </div>
                      <span className="stat-note">每一天都算数</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon lavender">
                        <Mountain size={20} />
                      </span>
                      <div>
                        <span className="stat-label">最长连续记录</span>
                        <strong>
                          {stats.longestStreak}
                          <small>天</small>
                        </strong>
                      </div>
                      <span className="stat-note">属于你的里程碑</span>
                    </div>
                  </div>
                  <section className="card daily-card">
                    <div className="section-heading">
                      <div className="heading-with-count">
                        <h3>把今天填满一点</h3>
                        <span className="count-badge">
                          {doneCount} / {state.habits.length}
                        </span>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setModal("habit")}
                      >
                        <Plus size={15} />
                        添加习惯
                      </button>
                    </div>
                    <p className="section-subtitle">
                      用喜欢的小事，替代无意识的消耗。
                    </p>
                    <HabitList
                      state={state}
                      today={today}
                      onToggle={onToggle}
                    />
                    <div className="card-bottom-note">
                      <span className="tiny-dot" />
                      {doneCount === state.habits.length && doneCount > 0
                        ? "今天的小目标都完成了，给自己一点肯定。"
                        : "不用一次做完，完成一件也是进步。"}
                      <button onClick={() => navigate("plan")}>
                        我的计划
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </section>
                  <section className="card activity-card">
                    <div className="section-heading">
                      <div>
                        <h3>看见你的每一点进步</h3>
                        <p className="section-subtitle">
                          最近 7 天的习惯完成情况
                        </p>
                      </div>
                      <span className="chart-key">
                        <span />
                        习惯完成率
                      </span>
                    </div>
                    <ActivityChart state={state} today={today} />
                  </section>
                </div>
                <div className="side-column">
                  <section className="card goal-card">
                    <div className="section-heading">
                      <h3>我的清醒目标</h3>
                      <button
                        className="icon-button"
                        onClick={() => setModal("goal")}
                        aria-label="调整清醒目标"
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </div>
                    <div className="goal-ring">
                      <svg viewBox="0 0 160 160" aria-hidden="true">
                        <circle className="ring-track" cx="80" cy="80" r="66" />
                        <circle
                          className="ring-progress"
                          cx="80"
                          cy="80"
                          r="66"
                          style={{
                            strokeDasharray: 414.7,
                            strokeDashoffset:
                              414.7 * (1 - stats.goalProgress / 100),
                          }}
                        />
                      </svg>
                      <div className="ring-text">
                        <span>一点点，向前走</span>
                        <strong>
                          {stats.streak}
                          <small> / {state.goalDays}</small>
                        </strong>
                        <span>天的清醒之旅</span>
                      </div>
                      <span className="ring-leaf">
                        <Sprout size={18} />
                      </span>
                    </div>
                    <div className="goal-caption">
                      <span className="tiny-dot" />
                      {stats.streak
                        ? "你正在为自己积攒改变的力量"
                        : "今天，就是一个很好的起点"}
                    </div>
                    <div className="week-heading">
                      <span>本周打卡</span>
                      <strong>
                        {stats.weekCount}
                        <small> / 7 天</small>
                      </strong>
                    </div>
                    <WeekDots state={state} today={today} />
                    <button
                      className={cn(
                        "button full",
                        current ? "checked-button" : "primary",
                      )}
                      onClick={() => setModal("checkin")}
                    >
                      {current ? <CheckCheck size={16} /> : <Plus size={16} />}
                      {current
                        ? "今日已打卡，继续保持"
                        : "给今天一个小小的肯定"}
                    </button>
                  </section>
                  <section className="breathing-card">
                    <div className="mini-breath-art">
                      <span />
                      <span />
                      <Wind size={26} />
                    </div>
                    <span className="card-eyebrow">TAKE A LITTLE BREAK</span>
                    <h3>冲动来了？先缓一缓。</h3>
                    <p>
                      不必急着做决定。
                      <br />花 60 秒，把注意力带回呼吸。
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setModal("breathe")}
                    >
                      开始一分钟呼吸
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  {preferences.encouragement && <section className="card quote-card">
                    <div className="quote-top">
                      <span>
                        <Heart size={14} />
                        给此刻的你
                      </span>
                      <button
                        className="icon-button"
                        aria-label="换一句鼓励"
                        onClick={() =>
                          setQuoteIndex((index) => (index + 1) % quotes.length)
                        }
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                    <span className="quote-mark">“</span>
                    <p>
                      {quotes[quoteIndex][0]}
                      <br />
                      {quotes[quoteIndex][1]}
                    </p>
                    <span className="quote-signature">
                      慢慢来，也是在向前。
                    </span>
                  </section>}
                </div>
              </div>
            </>
          )}

          {page === "plan" && (
            <div className="plan-layout">
              <section className="plan-banner">
                <span className="stat-icon mint">
                  <Target size={24} />
                </span>
                <div>
                  <span className="eyebrow">MY NEXT CHAPTER</span>
                  <h2>{state.goalDays} 天清醒计划</h2>
                  <p>{state.goalText || "自由设定想调整的习惯，建立自己喜欢的生活节奏。"}</p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setModal("goal")}
                >
                  调整目标
                  <ArrowUpRight size={16} />
                </button>
              </section>
              <section className="card">
                <div className="section-heading">
                  <div>
                    <h3>我的每日习惯</h3>
                    <p className="section-subtitle">
                      每天自动开启新的记录，完成后点亮右侧勾选。
                    </p>
                  </div>
                  <button
                    className="button primary compact"
                    onClick={() => setModal("habit")}
                  >
                    <Plus size={16} />
                    新习惯
                  </button>
                </div>
                <HabitList
                  state={state}
                  today={today}
                  onToggle={onToggle}
                  editable
                  onDelete={(id) => {
                    setState((value) =>
                      normalizeState({
                        ...value,
                        habits: value.habits.filter((habit) => habit.id !== id),
                        completions: Object.fromEntries(
                          Object.entries(value.completions).map(
                            ([date, ids]) => [
                              date,
                              ids.filter((item) => item !== id),
                            ],
                          ),
                        ),
                      }),
                    );
                    notify("习惯已移除。继续探索适合你的节奏。");
                  }}
                />
              </section>
              <div className="tips-grid">
                {[
                  [
                    Leaf,
                    "给触发因素留一点距离",
                    "把容易分散注意力的网站移出收藏，睡前把手机放到伸手够不到的地方。",
                  ],
                  [
                    Footprints,
                    "提前准备一个替代行动",
                    "想要刷内容时，先站起来喝杯水、散步，或给朋友发一条问候。",
                  ],
                  [
                    Heart,
                    "给自己重新开始的空间",
                    "状态反复很常见。看看当时发生了什么，再选择接下来可以做的一件小事。",
                  ],
                ].map(([Icon, title, text]) => (
                  <div className="card tip-card" key={title}>
                    <Icon size={22} />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "progress" && (
            <>
              <div className="progress-stats">
                {[
                  ["累计记录", stats.totalDays, CalendarDays],
                  ["连续记录", stats.streak, Flame],
                  ["最长连续", stats.longestStreak, Mountain],
                ].map(([label, count, Icon]) => (
                  <div className="card progress-stat" key={label}>
                    <Icon size={23} />
                    <span>{label}</span>
                    <strong>
                      {count}
                      <small>天</small>
                    </strong>
                  </div>
                ))}
              </div>
              <div className="progress-grid">
                <Calendar state={state} today={today} />
                <section className="card">
                  <div className="section-heading">
                    <h3>习惯的力量</h3>
                    <span className="pill">最近 7 天</span>
                  </div>
                  <ActivityChart state={state} today={today} large />
                  <p className="chart-footnote">
                    完成率根据当前计划中的习惯计算。
                  </p>
                </section>
              </div>
              <section className="card journal-card">
                <div className="section-heading">
                  <h3>写给自己的记录</h3>
                  <button className="text-button" onClick={exportData}>
                    <ArrowDownToLine size={15} />
                    导出记录
                  </button>
                </div>
                {state.checkins.length ? (
                  [...state.checkins]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((entry) => (
                      <article className="journal-entry" key={entry.date}>
                        <div className="journal-date">
                          <CalendarDays size={17} />
                          <strong>
                            {formatDate(entry.date, { year: "numeric" })}
                          </strong>
                        </div>
                        <span className="mood-pill">
                          {moods.find((mood) => mood.id === entry.mood)
                            ?.label || "已记录"}
                        </span>
                        <p>{entry.note || "今天也认真地照顾了自己。"}</p>
                        {entry.date === today && (
                          <button
                            className="text-button"
                            onClick={() => setModal("checkin")}
                          >
                            编辑
                          </button>
                        )}
                      </article>
                    ))
                ) : (
                  <div className="empty-state">
                    <BookOpen size={32} />
                    <h3>你的故事，从今天开始</h3>
                    <p>完成第一次打卡，留住一个值得记住的瞬间。</p>
                    <button
                      className="button primary"
                      onClick={() => setModal("checkin")}
                    >
                      记录今天
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {page === "tools" && (
            <>
              <section className="tools-intro">
                <span className="pill">
                  <Sparkles size={13} />
                  给自己一点空间
                </span>
                <h2>
                  感受会变化，
                  <br />
                  你始终可以选择下一步。
                </h2>
                <p>先停下来，再做一个照顾自己的小选择。</p>
                <div className="tools-intro-leaf">
                  <Sprout size={115} strokeWidth={0.8} />
                </div>
              </section>
              <div className="tools-grid">
                <button
                  className="card tool-card"
                  onClick={() => setModal("breathe")}
                >
                  <span className="tool-icon">
                    <Wind size={32} />
                  </span>
                  <span className="eyebrow">01 / BREATHE</span>
                  <h3>一分钟呼吸</h3>
                  <p>跟随轻柔的节奏，让身体和思绪慢下来。</p>
                  <span className="tool-link">
                    回到此刻
                    <ArrowUpRight size={18} />
                  </span>
                </button>
                <button
                  className="card tool-card focus-tool"
                  onClick={() => setModal("focus")}
                >
                  <span className="tool-icon">
                    <Timer size={32} />
                  </span>
                  <span className="eyebrow">02 / FOCUS</span>
                  <h3>一段专注时光</h3>
                  <p>从 5 分钟开始，把注意力交给眼前的小事。</p>
                  <span className="tool-link">
                    开始专注
                    <ArrowUpRight size={18} />
                  </span>
                </button>
                <button
                  className="card tool-card journal-tool"
                  onClick={() => setModal("checkin")}
                >
                  <span className="tool-icon">
                    <BookOpen size={30} />
                  </span>
                  <span className="eyebrow">03 / REFLECT</span>
                  <h3>和自己聊一聊</h3>
                  <p>写下此刻的感受，试着理解冲动背后的需要。</p>
                  <span className="tool-link">
                    记录心情
                    <ArrowUpRight size={18} />
                  </span>
                </button>
              </div>
              <div className="gentle-note tools-note">
                <Heart size={22} />
                <div>
                  <strong>你不必独自面对所有事。</strong>
                  <p>
                    如果这件事持续影响到生活、睡眠或关系，可以和信任的人聊聊，或寻求心理咨询支持。
                  </p>
                </div>
              </div>
            </>
          )}

          {page === "learning" && (
            <LearningPage
              state={learning}
              onChange={setLearning}
              notify={notify}
            />
          )}

          {page === "resources" && <ResourcesPage readingNotes={state.readingNotes} onReadingChange={readingNotes => setState(value => ({ ...value, readingNotes }))} resources={state.resources} onChange={resources => setState(value => ({ ...value, resources }))} notify={notify} />}

          {page === "settings" && (
            <div className="settings-layout">
              <section className="card settings-card">
                <div className="section-heading"><h3>中性鼓励短句</h3><button role="switch" aria-label="中性鼓励短句" aria-checked={preferences.encouragement} className={cn("switch", preferences.encouragement && "on")} onClick={() => setPreferences(value => ({ ...value, encouragement: !value.encouragement }))}><span /></button></div>
                <p className="section-subtitle">自愿开启后，在概览展示温和短句。随时可以关闭，不影响记录。</p>
              </section>
              <section className="card settings-card">
                <h3>你的称呼</h3>
                <p className="section-subtitle">
                  让这个小小的空间，多一点熟悉感。
                </p>
                <form
                  className="name-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (settingsName.trim()) {
                      setState((value) => ({
                        ...value,
                        name: settingsName.trim(),
                      }));
                      notify("称呼已保存。");
                    }
                  }}
                >
                  <input
                    aria-label="你的称呼"
                    maxLength={20}
                    required
                    value={settingsName}
                    onChange={(event) => setSettingsName(event.target.value)}
                  />
                  <button className="button primary" type="submit">
                    保存
                  </button>
                </form>
              </section>
              <section className="card settings-card">
                <div className="section-heading">
                  <h3>每日打卡提醒</h3>
                  <button
                    className={cn("switch", preferences.reminder && "on")}
                    role="switch"
                    aria-checked={preferences.reminder}
                    aria-label="每日打卡提醒"
                    onClick={() =>
                      setPreferences((value) => ({
                        ...value,
                        reminder: !value.reminder,
                      }))
                    }
                  >
                    <span />
                  </button>
                </div>
                <p className="section-subtitle">
                  在你选定的时间，轻轻提醒自己停下来记录。
                </p>
                <div className="reminder-setting">
                  <label htmlFor="reminder-time">提醒时间</label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={preferences.time}
                    onChange={(event) =>
                      setPreferences((value) => ({
                        ...value,
                        time: event.target.value || "21:00",
                      }))
                    }
                    disabled={!preferences.reminder}
                  />
                </div>
                <p className="small muted">
                  提醒仅在网站打开时显示，使用设备的本地时间。
                </p>
              </section>
              <section className="card settings-card">
                <div className="section-heading">
                  <h3>我的数据</h3>
                  <ShieldCheck size={20} />
                </div>
                <p className="section-subtitle">
                  自定目标、阅读思考、行动选择、资料目录、偏好、行为积分、学习进度和每日记录都会自动保存在当前浏览器。更换电脑、移动本地网页或清理浏览器数据前，请先导出备份，之后可导入恢复。
                </p>
                <p className="small muted local-save-status" aria-live="polite">
                  {storageError
                    ? "自动保存不可用，请导出备份保留当前记录。"
                    : `已自动保存在本机${lastSaved ? ` · ${lastSaved.toLocaleTimeString("zh-CN", { hour12: false })}` : ""}`}
                </p>
                <div className="data-actions">
                  <button className="button secondary" onClick={exportData}>
                    <ArrowDownToLine size={16} />
                    导出我的记录
                  </button>
                  <input
                    type="file"
                    ref={importInput}
                    accept="application/json,.json"
                    onChange={importData}
                    hidden
                    aria-label="选择清醒备份文件"
                  />
                  <button
                    className="button secondary"
                    onClick={() => importInput.current?.click()}
                  >
                    <Upload size={16} />
                    导入备份
                  </button>
                  <button
                    className="text-button danger"
                    onClick={() => setModal("reset")}
                  >
                    <Trash2 size={15} />
                    清除所有记录
                  </button>
                </div>
              </section>
            </div>
          )}

          <footer>
            <span className="footer-brand">
              <Sprout size={14} />
              清醒<span>让自律，成为一种自在。</span>
            </span>
            <span>
              <ShieldCheck size={13} />
              数据仅保存在本机 · 为自己而改变
            </span>
          </footer>
        </main>
      </div>
      {modal === "checkin" && (
        <CheckinModal
          current={current}
          onClose={() => setModal(null)}
          onSave={(entry) => {
            setState((value) =>
              saveCheckin(value, { ...entry, date: localDateKey() }),
            );
            setModal(null);
            notify(
              current
                ? "今天的记录已更新。"
                : "打卡成功。每一个小小的选择，都有意义。",
            );
          }}
        />
      )}
      {modal === "breathe" && <BreathingModal onClose={() => setModal(null)} />}
      {modal === "focus" && <FocusModal onClose={() => setModal(null)} />}
      {modal === "habit" && (
        <HabitModal
          onClose={() => setModal(null)}
          onSave={(habit) => {
            setState((value) => ({
              ...value,
              habits: [...value.habits, habit],
            }));
            setModal(null);
            notify("新习惯已加入，今天就迈出第一步。");
          }}
        />
      )}
      {modal === "goal" && (
        <GoalModal
          state={state}
          onClose={() => setModal(null)}
          onSave={(goalDays, goalText) => {
            setState((value) => ({ ...value, goalDays, goalText }));
            setModal(null);
            notify("目标已更新，按自己的节奏出发。");
          }}
        />
      )}
      {modal === "reset" && (
        <Modal title="要清除所有记录吗？" onClose={() => setModal(null)}>
          <p className="modal-description">
            打卡、目标、阅读思考、行动选择、资料目录、偏好、习惯、积分和学习进度将恢复初始状态，无法撤销。建议先导出一份记录。
          </p>
          <div className="button-row">
            <button
              className="button secondary grow"
              onClick={() => setModal(null)}
            >
              保留记录
            </button>
            <button
              className="button danger-button grow"
              onClick={() => {
                const initial = createInitialState();
                setState(initial);
                setSettingsName(initial.name);
                setPreferences(normalizePreferences(null));
                setLearning(createLearningState());
                setModal(null);
                notify("记录已清除。新的一页，从现在开始。");
              }}
            >
              确认清除
            </button>
          </div>
        </Modal>
      )}
      {modal === "import" && pendingImport && (
        <Modal
          title="恢复这份备份吗？"
          eyebrow="YOUR PROGRESS, SAFELY KEPT"
          onClose={() => {
            setModal(null);
            setPendingImport(null);
          }}
        >
          <p className="modal-description">
            备份包含 {pendingImport.journey.checkins.length} 条打卡记录、
            {pendingImport.journey.habits.length} 个习惯
            {pendingImport.learning
              ? `，以及 ${getLearningStats(pendingImport.learning).score} 积分和 ${pendingImport.learning.completedLessons.length} 节已完成课程`
              : "。这是一份旧版备份，当前的积分与学习进度会保留"}
            。导入将替换对应的现有记录，建议先导出当前备份。
          </p>
          <div className="button-row">
            <button
              className="button secondary grow"
              onClick={() => {
                setModal(null);
                setPendingImport(null);
              }}
            >
              取消导入
            </button>
            <button
              className="button primary grow"
              onClick={() => {
                setState(pendingImport.journey);
                setSettingsName(pendingImport.journey.name);
                setPreferences(pendingImport.preferences);
                if (pendingImport.learning) setLearning(pendingImport.learning);
                setPendingImport(null);
                setModal(null);
                notify("备份已恢复，积分与进度已保存到本机。");
              }}
            >
              确认恢复备份
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button aria-label="关闭提示" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
