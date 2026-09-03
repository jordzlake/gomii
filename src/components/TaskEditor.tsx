"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Sprite";
import { DIFFICULTY, Difficulty, STATS, StatKey } from "@/lib/stats";
import { REPEAT_LABEL, Repeat } from "@/lib/tasks";
import { ICON_NAMES, IconName } from "@/data/sprites";
import type { ClientTask } from "./TaskList";

const REPEATS = Object.keys(REPEAT_LABEL) as Repeat[];
const DIFFS = Object.keys(DIFFICULTY) as Difficulty[];

export default function TaskEditor({
  task,
  categories,
  onClose,
}: {
  task: ClientTask;
  categories: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState(task.category);
  const [difficulty, setDifficulty] = useState<Difficulty>(task.difficulty);
  const [repeat, setRepeat] = useState<Repeat>(task.repeat);
  const [icon, setIcon] = useState<IconName>(task.icon);
  const [statKeys, setStatKeys] = useState<StatKey[]>(
    STATS.filter((s) => (task.stats[s.key] ?? 0) > 0).map((s) => s.key)
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const points = DIFFICULTY[difficulty].points;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: task.key, title, category, difficulty, repeat, icon, statKeys }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save that task.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Edit task" onClick={onClose}>
      <form className="sheet-card anim-rise" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>Edit task</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>

        {error && <div className="error anim-shake" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="field">
          <label htmlFor="e-title">What is the task</label>
          <input id="e-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="e-cat">Category</label>
          <input
            id="e-cat"
            className="input"
            list="editor-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="editor-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label>Difficulty</label>
          <div className="toggle-grid">
            {DIFFS.map((d) => (
              <button
                type="button"
                key={d}
                className="toggle"
                aria-pressed={difficulty === d}
                style={{ ["--pick" as string]: DIFFICULTY[d].colour }}
                onClick={() => setDifficulty(d)}
              >
                {DIFFICULTY[d].label}
                <div style={{ fontSize: 8, opacity: 0.8 }}>+{DIFFICULTY[d].points}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>How often</label>
          <div className="toggle-grid">
            {REPEATS.map((r) => (
              <button type="button" key={r} className="toggle" aria-pressed={repeat === r} onClick={() => setRepeat(r)}>
                {REPEAT_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Which stats it raises</label>
          <div className="toggle-grid">
            {STATS.map((s) => (
              <button
                type="button"
                key={s.key}
                className="toggle"
                aria-pressed={statKeys.includes(s.key)}
                style={{ ["--pick" as string]: s.colour }}
                onClick={() =>
                  setStatKeys((v) => (v.includes(s.key) ? v.filter((x) => x !== s.key) : [...v, s.key]))
                }
              >
                {s.key}
                <div style={{ fontSize: 8, opacity: 0.8 }}>+{points}</div>
              </button>
            ))}
          </div>
          <span className="tiny muted">Changes apply from the next time you finish it. Past rewards stay put.</span>
        </div>

        <div className="field">
          <label>Icon</label>
          <div className="avatar-picker" style={{ maxHeight: 160, gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
            {ICON_NAMES.map((n) => (
              <button type="button" key={n} className="avatar-option" aria-pressed={n === icon} onClick={() => setIcon(n)}>
                <Icon name={n} size={34} />
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn--block btn--gold" disabled={busy}>
          {busy ? "Saving" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
