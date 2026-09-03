"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterSprite, EffectSprite, Icon } from "./Sprite";
import Meter from "./Meter";
import { STATS, StatKey, xpForNextLevel } from "@/lib/stats";
import { AVATARS, avatarFrame, getAvatar } from "@/data/sprites";

export default function CharacterSheet({
  username,
  avatarId,
  level,
  xp,
  coins,
  streak,
  stats,
  completedCount,
}: {
  username: string;
  avatarId: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  stats: Record<string, number>;
  completedCount: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(avatarId);
  const [picking, setPicking] = useState(false);
  const highest = Math.max(10, ...STATS.map((s) => stats[s.key] ?? 0));
  const avatar = getAvatar(current);

  async function choose(id: string) {
    setCurrent(id);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId: id }),
    });
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <section className="char-hero">
        <CharacterSprite avatarId={current} playing fps={2.5} size={148} className="sprite anim-float" />
        <div className="center">
          <h2>{username}</h2>
          <div className="tiny muted" style={{ marginTop: 6 }}>{avatar.name} · Level {level}</div>
        </div>
        <div style={{ width: "100%" }}>
          <Meter value={xp} max={xpForNextLevel(level)} colour="var(--gold)" />
          <div className="xp-legend" style={{ marginTop: 6 }}>
            <span>{xp} / {xpForNextLevel(level)} XP</span>
            <span>{100 - level} levels to go</span>
          </div>
        </div>
        <div className="chip-row" style={{ justifyContent: "center" }}>
          <span className="chip" style={{ color: "var(--gold)" }}>
            <Icon name="coin" size={14} /> {coins} coins
          </span>
          <span className="chip" style={{ color: "var(--orange)" }}>
            <EffectSprite name="flame" stage={Math.min(4, Math.floor(streak / 3))} size={14} /> {streak} day streak
          </span>
          <span className="chip" style={{ color: "var(--lime)" }}>
            <Icon name="checklist" size={14} /> {completedCount} done
          </span>
        </div>
        <button className="btn btn--ghost" onClick={() => setPicking((p) => !p)}>
          {picking ? "Done" : "Change character"}
        </button>
      </section>

      {picking && (
        <div className="panel anim-rise" style={{ marginTop: 12 }}>
          <div className="avatar-picker">
            {AVATARS.map((a) => (
              <button key={a.id} className="avatar-option" aria-pressed={a.id === current} onClick={() => choose(a.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarFrame(a.id, 0)} alt={a.name} />
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="section-head">
        <h2>Stats</h2>
        <span>eight ways to grow</span>
      </div>

      <div className="stack">
        {STATS.map((s) => (
          <div className="panel panel--flat" key={s.key}>
            <div className="stat-line" style={{ marginBottom: 8 }}>
              <Icon name={s.icon} size={24} />
              <div>
                <b style={{ color: s.colour }}>{s.name}</b>
                <small className="muted" style={{ display: "block", fontSize: 13 }}>{s.meaning}</small>
              </div>
              <span className="tiny" style={{ color: s.colour }}>{stats[s.key as StatKey] ?? 0}</span>
            </div>
            <Meter value={stats[s.key as StatKey] ?? 0} max={highest} colour={s.colour} slim />
          </div>
        ))}
      </div>

      <button className="btn btn--coral btn--block" style={{ marginTop: 22 }} onClick={signOut}>
        Sign out
      </button>
    </>
  );
}
