"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Meter from "./Meter";
import { CharacterSprite, EffectSprite } from "./Sprite";
import { xpForNextLevel } from "@/lib/stats";

function partOfDay(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Night";
}

export default function Hero({
  name,
  avatarId,
  level,
  xp,
  streak,
  doneToday,
  dueToday,
}: {
  name: string;
  avatarId: string;
  level: number;
  xp: number;
  streak: number;
  doneToday: number;
  dueToday: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const now = new Date();
  const need = xpForNextLevel(level);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-date", { y: 12, opacity: 0, duration: 0.4, ease: "power2.out" });
      gsap.from(".hero .diamond", { scale: 0.8, opacity: 0, duration: 0.45, ease: "back.out(1.8)", delay: 0.08 });
      gsap.from(".hero-meta > *", { y: 8, opacity: 0, stagger: 0.06, duration: 0.3, delay: 0.16 });
    }, root);
    return () => ctx.revert();
  }, []);

  const streakStage = Math.min(4, Math.floor(streak / 3));

  return (
    <section className="hero" ref={root}>
      <div>
        <div className="hero-date">
          {String(now.getDate()).padStart(2, "0")}/{String(now.getMonth() + 1).padStart(2, "0")}
        </div>
        <div className="hero-part">{partOfDay(now)}</div>
        <div className="hero-name">{name}</div>

        <div className="hero-meta">
          <span className="pill" style={{ color: "var(--orange)" }}>
            <EffectSprite name="flame" stage={streakStage} size={18} /> {streak} day streak
          </span>
          <span className="pill" style={{ color: "var(--lime)" }}>
            {doneToday}/{Math.max(dueToday, doneToday)} today
          </span>
        </div>

        <div className="xp-block">
          <Meter value={xp} max={need} colour="var(--gold)" />
          <div className="xp-legend">
            <span>{xp} / {need} XP</span>
            <span>Level {level}</span>
          </div>
        </div>
      </div>

      <div className="diamond diamond--lg" style={{ ["--tint" as string]: "var(--violet)" }}>
        <CharacterSprite avatarId={avatarId} playing size={110} className="anim-float" />
      </div>
    </section>
  );
}
