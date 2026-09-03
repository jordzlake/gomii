"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Sprite";
import { DIFFICULTY, Difficulty, STATS, StatKey } from "@/lib/stats";
import { REPEAT_LABEL, Repeat } from "@/lib/tasks";
import { ICON_NAMES, IconName } from "@/data/sprites";

const REPEATS = Object.keys(REPEAT_LABEL) as Repeat[];
const DIFFS = Object.keys(DIFFICULTY) as Difficulty[];

function IconChooser({ value, onChange }: { value: IconName; onChange: (i: IconName) => void }) {
  return (
    <div className="avatar-picker" style={{ maxHeight: 190, gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
      {ICON_NAMES.map((n) => (
        <button
          type="button"
          key={n}
          className="avatar-option"
          aria-pressed={n === value}
          onClick={() => onChange(n)}
          title={n}
        >
          <Icon name={n} size={34} />
        </button>
      ))}
    </div>
  );
}

export function TaskForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Custom");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [repeat, setRepeat] = useState<Repeat>("daily");
  const [icon, setIcon] = useState<IconName>("checklist");
  const [statKeys, setStatKeys] = useState<StatKey[]>(["SKI"]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const points = DIFFICULTY[difficulty].points;

  function toggleStat(k: StatKey) {
    setStatKeys((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, difficulty, repeat, icon, statKeys }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save that task.");
      return;
    }
    setTitle("");
    setDone(true);
    router.refresh();
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <form className="panel" onSubmit={submit}>
      {error && <div className="error anim-shake" style={{ marginBottom: 12 }}>{error}</div>}
      {done && (
        <div className="error anim-pop" style={{ borderColor: "var(--green)", background: "rgba(54,184,107,.14)", marginBottom: 12 }}>
          Saved. It is on your quest board now.
        </div>
      )}

      <div className="field">
        <label htmlFor="t-title">What is the task</label>
        <input
          id="t-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Run 5k without stopping"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="t-cat">Category</label>
        <select id="t-cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
              onClick={() => toggleStat(s.key)}
            >
              {s.key}
              <div style={{ fontSize: 8, opacity: 0.8 }}>+{points}</div>
            </button>
          ))}
        </div>
        <span className="tiny muted">
          Each stat you pick gains {points} {points === 1 ? "point" : "points"} every time you finish this.
        </span>
      </div>

      <div className="field">
        <label>Icon</label>
        <IconChooser value={icon} onChange={setIcon} />
      </div>

      <button className="btn btn--block btn--gold" disabled={busy}>
        {busy ? "Saving" : "Add task"}
      </button>
    </form>
  );
}

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("target");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save that category.");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={submit}>
      {error && <div className="error anim-shake" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="field">
        <label htmlFor="c-name">Category name</label>
        <input
          id="c-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Guitar"
          required
        />
      </div>
      <div className="field">
        <label>Icon</label>
        <IconChooser value={icon} onChange={setIcon} />
      </div>
      <button className="btn btn--block">Add category</button>
    </form>
  );
}
