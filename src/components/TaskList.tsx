"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Icon } from "./Sprite";
import RewardOverlay, { Reward } from "./RewardOverlay";
import TaskEditor from "./TaskEditor";
import { DIFFICULTY, STATS, StatKey } from "@/lib/stats";
import { REPEAT_LABEL, nextResetLabel } from "@/lib/tasks";
import { CATEGORY_ICONS, IconName } from "@/data/sprites";

export type ClientTask = {
  key: string;
  title: string;
  category: string;
  icon: IconName;
  levelUnlocked: number;
  repeat: keyof typeof REPEAT_LABEL;
  difficulty: keyof typeof DIFFICULTY;
  stats: Record<string, number>;
  points: number;
  custom: boolean;
  available: boolean;
  unlocked: boolean;
  hidden: boolean;
};

export default function TaskList({
  tasks,
  emptyLine = "Nothing here yet.",
  showFilters = false,
  deletable = false,
  manageable = false,
}: {
  tasks: ClientTask[];
  emptyLine?: string;
  showFilters?: boolean;
  deletable?: boolean;
  /** Adds the hide, unhide and edit controls. */
  manageable?: boolean;
}) {
  const router = useRouter();
  const [reward, setReward] = useState<Reward | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClientTask | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(tasks.map((t) => t.category))).sort()],
    [tasks]
  );

  const visible = tasks.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      (query.trim() === "" || t.title.toLowerCase().includes(query.trim().toLowerCase()))
  );

  async function complete(task: ClientTask) {
    setBusy(task.key);
    const res = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: task.key }),
    });
    setBusy(null);
    if (!res.ok) {
      const el = document.getElementById(`task-${task.key}`);
      el?.classList.add("anim-shake");
      setTimeout(() => el?.classList.remove("anim-shake"), 500);
      return;
    }
    const data = await res.json();
    const el = document.getElementById(`task-${task.key}`);
    if (el) {
      gsap.to(el, { scale: 0.96, opacity: 0.45, duration: 0.25, ease: "power2.out" });
    }
    setReward({ ...data, kind: "task" });
    router.refresh();
  }

  async function setHidden(task: ClientTask, hidden: boolean) {
    setBusy(task.key);
    await fetch("/api/tasks/hidden", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: task.key, hidden }),
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(task: ClientTask) {
    setBusy(task.key);
    await fetch(`/api/tasks?key=${encodeURIComponent(task.key)}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      {showFilters && (
        <>
          <input
            className="input"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div className="filters">
            {categories.map((c) => (
              <button
                key={c}
                className="filter"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c !== "All" && <Icon name={CATEGORY_ICONS[c] ?? "checklist"} size={18} />}
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {visible.length === 0 ? (
        <div className="empty">
          <Icon name="hourglass" size={64} />
          <p>{emptyLine}</p>
        </div>
      ) : (
        <div className="stack">
          {visible.map((t) => {
            const d = DIFFICULTY[t.difficulty];
            return (
              <article
                key={t.key}
                id={`task-${t.key}`}
                className={`task ${!t.unlocked ? "task--locked" : ""} ${
                  t.unlocked && !t.available ? "task--done" : ""
                } ${t.hidden ? "task--hidden" : ""}`}
              >
                <div className="diamond diamond--sm" style={{ ["--tint" as string]: d.colour }}>
                  <Icon name={t.icon} size={30} />
                </div>

                <div>
                  <h3>{t.title}</h3>
                  <div className="chip-row" style={{ marginTop: 8 }}>
                    <span className={`chip chip--${t.difficulty}`}>{d.label}</span>
                    <span className="chip">{REPEAT_LABEL[t.repeat]}</span>
                    <span className="chip">{t.category}</span>
                    {!t.unlocked && <span className="chip chip--locked">Level {t.levelUnlocked}</span>}
                  </div>

                  <div className="chip-row" style={{ marginTop: 6 }}>
                    {STATS.filter((s) => (t.stats[s.key] ?? 0) > 0).map((s) => (
                      <span key={s.key} className="chip" style={{ color: s.colour }}>
                        +{t.stats[s.key as StatKey]} {s.key}
                      </span>
                    ))}
                  </div>

                  <div className="task-actions">
                    {t.unlocked && t.available ? (
                      <button
                        className="btn btn--green"
                        disabled={busy === t.key}
                        onClick={() => complete(t)}
                      >
                        {busy === t.key ? "Saving" : "Mark done"}
                      </button>
                    ) : (
                      <span className="tiny muted" style={{ alignSelf: "center" }}>
                        {t.unlocked ? nextResetLabel(t.repeat) : `Unlocks at level ${t.levelUnlocked}`}
                      </span>
                    )}
                    {manageable && t.custom && (
                      <button className="btn btn--ghost" onClick={() => setEditing(t)}>
                        Edit
                      </button>
                    )}
                    {manageable && (
                      <button
                        className="btn btn--ghost"
                        disabled={busy === t.key}
                        onClick={() => setHidden(t, !t.hidden)}
                      >
                        {t.hidden ? "Unhide" : "Hide"}
                      </button>
                    )}
                    {deletable && t.custom && (
                      <button className="btn btn--ghost" onClick={() => remove(t)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <TaskEditor
          task={editing}
          categories={categories.filter((c) => c !== "All")}
          onClose={() => setEditing(null)}
        />
      )}

      {reward && <RewardOverlay reward={reward} onClose={() => setReward(null)} />}
    </>
  );
}
