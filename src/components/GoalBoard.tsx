"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EffectSprite, Icon } from "./Sprite";
import RewardOverlay, { Reward } from "./RewardOverlay";
import { GOAL_POINTS_PER_STAT, STATS, StatKey } from "@/lib/stats";
import { ICON_NAMES, IconName } from "@/data/sprites";

export type ClientGoal = {
  id: string;
  title: string;
  detail: string;
  icon: IconName;
  statKeys: string[];
  completed: boolean;
};

export default function GoalBoard({ goals }: { goals: ClientGoal[] }) {
  const router = useRouter();
  const [reward, setReward] = useState<Reward | null>(null);
  const [open, setOpen] = useState(goals.length === 0);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [icon, setIcon] = useState<IconName>("mountain");
  const [statKeys, setStatKeys] = useState<StatKey[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, detail, icon, statKeys }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save that goal.");
      return;
    }
    setTitle("");
    setDetail("");
    setStatKeys([]);
    setOpen(false);
    router.refresh();
  }

  async function claim(goal: ClientGoal) {
    const res = await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id }),
    });
    if (!res.ok) return;
    setReward({ ...(await res.json()), kind: "goal" });
    router.refresh();
  }

  async function remove(goal: ClientGoal) {
    await fetch(`/api/goals?id=${goal.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="stack">
        {goals.map((g) => (
          <article key={g.id} className={`goal ${g.completed ? "goal--done" : ""}`}>
            <div className="goal-head">
              <div className="diamond diamond--sm" style={{ ["--tint" as string]: g.completed ? "var(--green)" : "var(--violet)" }}>
                <Icon name={g.icon} size={30} />
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--body)", fontSize: 18 }}>{g.title}</h3>
                {g.detail && <p className="muted" style={{ fontSize: 15, margin: "4px 0 0" }}>{g.detail}</p>}
              </div>
            </div>

            <div className="chip-row">
              {g.statKeys.map((k) => {
                const s = STATS.find((x) => x.key === k)!;
                return (
                  <span key={k} className="chip" style={{ color: s.colour }}>
                    +{GOAL_POINTS_PER_STAT} {k}
                  </span>
                );
              })}
            </div>

            <div className="row">
              {g.completed ? (
                <span className="tiny" style={{ color: "var(--green)" }}>Claimed</span>
              ) : (
                <button className="btn btn--violet" onClick={() => claim(g)}>
                  Claim reward
                </button>
              )}
              <button className="btn btn--ghost" onClick={() => remove(g)}>Delete</button>
            </div>
          </article>
        ))}

        {goals.length === 0 && (
          <div className="empty">
            <EffectSprite name="growth" stage={0} size={64} />
            <p>No long term goals yet. Set one that takes months, not minutes.</p>
          </div>
        )}
      </div>

      <button className="btn btn--block btn--gold" style={{ marginTop: 16 }} onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Set a new goal"}
      </button>

      {open && (
        <form className="panel anim-rise" style={{ marginTop: 12 }} onSubmit={create}>
          {error && <div className="error anim-shake" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="field">
            <label htmlFor="g-title">The goal</label>
            <input
              id="g-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Speak Japanese in a real conversation"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="g-detail">Why it matters</label>
            <textarea
              id="g-detail"
              className="textarea"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Trip to Osaka next spring."
            />
          </div>

          <div className="field">
            <label>Stats it pays into</label>
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
                  <div style={{ fontSize: 8, opacity: 0.8 }}>+{GOAL_POINTS_PER_STAT}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Icon</label>
            <div className="avatar-picker" style={{ maxHeight: 170, gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
              {ICON_NAMES.map((n) => (
                <button type="button" key={n} className="avatar-option" aria-pressed={n === icon} onClick={() => setIcon(n)}>
                  <Icon name={n} size={34} />
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn--block btn--violet">Save goal</button>
        </form>
      )}

      {reward && <RewardOverlay reward={reward} onClose={() => setReward(null)} />}
    </>
  );
}
