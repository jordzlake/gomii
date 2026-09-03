"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { EffectSprite } from "./Sprite";
import { STATS, StatKey } from "@/lib/stats";

export type Reward = {
  title: string;
  stats: Partial<Record<StatKey, number>>;
  xp: number;
  coins: number;
  levelsGained: number;
  level: number;
  streak: number;
  kind: "task" | "goal";
};

export default function RewardOverlay({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(".reward-card", { scale: 0.82, opacity: 0, duration: 0.28, ease: "back.out(2)" })
        .from(".hero", { y: -18, rotate: -8, duration: 0.35, ease: "elastic.out(1, 0.5)" }, "-=0.1")
        .from(".gain", { y: 14, opacity: 0, stagger: 0.06, duration: 0.22, ease: "power2.out" }, "-=0.15")
        .from(".reward-card .btn", { opacity: 0, duration: 0.2 }, "-=0.1");
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const gains = STATS.filter((s) => (reward.stats[s.key] ?? 0) > 0);

  return (
    <div className="reward" ref={root} role="dialog" aria-modal="true" onClick={onClose}>
      <div className="reward-card" onClick={(e) => e.stopPropagation()}>
        <div className="hero" style={{ display: "grid", justifyItems: "center" }}>
          <EffectSprite name={reward.levelsGained > 0 ? "trophy" : reward.kind === "goal" ? "growth" : "chest"} animate size={118} />
        </div>

        {reward.levelsGained > 0 && (
          <div className="levelup">Level {reward.level} reached</div>
        )}

        <h2 style={{ marginBottom: 6 }}>{reward.kind === "goal" ? "Goal complete" : "Task complete"}</h2>
        <p className="muted" style={{ fontSize: 15 }}>{reward.title}</p>

        <div className="reward-gains">
          {gains.map((s) => (
            <span key={s.key} className="gain" style={{ color: s.colour }}>
              +{reward.stats[s.key]} {s.key}
            </span>
          ))}
          <span className="gain" style={{ color: "var(--gold)" }}>+{reward.xp} XP</span>
          <span className="gain" style={{ color: "var(--orange)" }}>+{reward.coins} coins</span>
        </div>

        <button className="btn btn--gold btn--block" onClick={onClose} autoFocus>
          Keep going
        </button>
      </div>
    </div>
  );
}
