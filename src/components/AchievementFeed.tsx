"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Sprite";
import { STATS } from "@/lib/stats";
import { avatarFrame } from "@/data/sprites";
import type { FeedItem } from "@/lib/friends";

function when(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function AchievementFeed({
  items,
  linkToProfiles = true,
  emptyLine = "Nothing yet. Achievements from your friends land here.",
}: {
  items: FeedItem[];
  linkToProfiles?: boolean;
  emptyLine?: string;
}) {
  const [state, setState] = useState<Record<string, { cheers: number; cheered: boolean }>>(
    Object.fromEntries(items.map((i) => [i.id, { cheers: i.cheers, cheered: i.cheered }]))
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function cheer(item: FeedItem) {
    setBusy(item.id);
    const res = await fetch("/api/cheers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completionId: item.id }),
    });
    setBusy(null);
    if (!res.ok) return;
    const data = await res.json();
    setState((s) => ({ ...s, [item.id]: { cheers: data.cheers, cheered: true } }));
  }

  if (items.length === 0) {
    return (
      <div className="empty">
        <Icon name="celebrate" size={64} />
        <p>{emptyLine}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {items.map((item) => {
        const s = state[item.id] ?? { cheers: item.cheers, cheered: item.cheered };
        const isGoal = item.category === "Long term goal";
        return (
          <article key={item.id} className={`feed-item ${isGoal ? "feed-item--goal" : ""} anim-rise`}>
            <div className="diamond diamond--sm" style={{ ["--tint" as string]: isGoal ? "var(--violet)" : "var(--cyan)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarFrame(item.avatarId, 4)} alt="" />
            </div>

            <div>
              <div className="feed-line">
                {linkToProfiles && !item.mine ? (
                  <Link href={`/friends/${item.friendId}`} className="feed-name">{item.username}</Link>
                ) : (
                  <span className="feed-name">{item.mine ? "You" : item.username}</span>
                )}
                <span className="muted"> {isGoal ? "finished a goal" : "completed"} </span>
                <b>{item.title}</b>
              </div>

              <div className="chip-row" style={{ marginTop: 8 }}>
                <span className="chip">{item.category}</span>
                {STATS.filter((st) => (item.stats[st.key] ?? 0) > 0).map((st) => (
                  <span key={st.key} className="chip" style={{ color: st.colour }}>
                    +{item.stats[st.key]} {st.key}
                  </span>
                ))}
              </div>

              <div className="feed-foot">
                <span className="tiny muted">{when(item.completedAt)}</span>
                {item.mine ? (
                  <span className="cheer-count">
                    <Icon name="celebrate" size={16} /> {s.cheers}
                  </span>
                ) : (
                  <button
                    className={`cheer ${s.cheered ? "cheer--done" : ""}`}
                    onClick={() => cheer(item)}
                    disabled={s.cheered || busy === item.id}
                  >
                    <Icon name="celebrate" size={16} />
                    {s.cheered ? `Good job sent · ${s.cheers}` : `Good job${s.cheers ? ` · ${s.cheers}` : ""}`}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
