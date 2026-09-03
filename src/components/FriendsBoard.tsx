"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Sprite";
import { avatarFrame } from "@/data/sprites";
import type { FriendSummary } from "@/lib/friends";

type SearchHit = { id: string; username: string; avatarId: string; level: number; state: string };

export default function FriendsBoard({
  friends,
  incoming,
  outgoing,
  tracking,
}: {
  friends: FriendSummary[];
  incoming: { id: string; person: FriendSummary }[];
  outgoing: { id: string; person: FriendSummary }[];
  tracking: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [track, setTrack] = useState(tracking);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(async () => {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setHits((await res.json()).results);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  async function add(username: string) {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? (data.accepted ? `You and ${username} are friends.` : `Request sent to ${username}.`) : data.error);
    setQuery("");
    setHits([]);
    router.refresh();
  }

  async function respond(id: string, accept: boolean) {
    await fetch(accept ? "/api/friends" : `/api/friends?id=${id}`, {
      method: accept ? "PATCH" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: accept ? JSON.stringify({ id }) : undefined,
    });
    router.refresh();
  }

  async function removeFriend(friendId: string) {
    await fetch(`/api/friends?friendId=${friendId}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleTracking() {
    const next = !track;
    setTrack(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackFriends: next }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="track-row">
        <div>
          <b style={{ fontFamily: "var(--display)", fontSize: 10 }}>Track friends</b>
          <div className="muted" style={{ fontSize: 14 }}>
            Counts new achievements on the Friends tab. Repeating chores never appear.
          </div>
        </div>
        <button
          className={`switch ${track ? "switch--on" : ""}`}
          role="switch"
          aria-checked={track}
          aria-label="Track friends"
          onClick={toggleTracking}
        >
          <span />
        </button>
      </div>

      {note && <div className="error anim-pop" style={{ borderColor: "var(--cyan)", background: "rgba(36,200,240,.12)", margin: "12px 0" }}>{note}</div>}

      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="find">Find a character by name</label>
        <input
          id="find"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jordan the Steady"
        />
      </div>

      {hits.length > 0 && (
        <div className="stack anim-rise" style={{ marginBottom: 16 }}>
          {hits.map((h) => (
            <div className="friend-row" key={h.id}>
              <div className="diamond diamond--sm" style={{ ["--tint" as string]: "var(--sky)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarFrame(h.avatarId, 0)} alt="" />
              </div>
              <div>
                <b>{h.username}</b>
                <small className="muted" style={{ display: "block" }}>Level {h.level}</small>
              </div>
              {h.state === "accepted" ? (
                <span className="tiny muted">Friends</span>
              ) : h.state === "pending" ? (
                <span className="tiny muted">Waiting</span>
              ) : (
                <button className="btn btn--green" onClick={() => add(h.username)}>Add</button>
              )}
            </div>
          ))}
        </div>
      )}

      {incoming.length > 0 && (
        <>
          <div className="section-head">
            <h2>Wants to be friends</h2>
            <span>{incoming.length}</span>
          </div>
          <div className="stack">
            {incoming.map((r) => (
              <div className="friend-row" key={r.id}>
                <div className="diamond diamond--sm" style={{ ["--tint" as string]: "var(--gold)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarFrame(r.person.avatarId, 0)} alt="" />
                </div>
                <div>
                  <b>{r.person.username}</b>
                  <small className="muted" style={{ display: "block" }}>Level {r.person.level}</small>
                </div>
                <div className="row">
                  <button className="btn btn--green" onClick={() => respond(r.id, true)}>Accept</button>
                  <button className="btn btn--ghost" onClick={() => respond(r.id, false)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-head">
        <h2>Your friends</h2>
        <span>{friends.length}</span>
      </div>

      {friends.length === 0 ? (
        <div className="empty">
          <Icon name="people" size={64} />
          <p>No friends yet. Search a character name above to send the first request.</p>
        </div>
      ) : (
        <div className="stack">
          {friends.map((f) => (
            <div className="friend-row" key={f.id}>
              <Link href={`/friends/${f.id}`} className="diamond diamond--sm" style={{ ["--tint" as string]: "var(--violet)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarFrame(f.avatarId, 0)} alt="" />
              </Link>
              <Link href={`/friends/${f.id}`} style={{ color: "inherit" }}>
                <b>{f.username}</b>
                <small className="muted" style={{ display: "block" }}>
                  Level {f.level} · {f.streak} day streak · {f.cheersReceived} good jobs
                </small>
              </Link>
              <button className="btn btn--ghost" onClick={() => removeFriend(f.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <>
          <div className="section-head">
            <h2>Waiting on them</h2>
            <span>{outgoing.length}</span>
          </div>
          <div className="chip-row">
            {outgoing.map((r) => (
              <span className="chip" key={r.id}>{r.person.username}</span>
            ))}
          </div>
        </>
      )}
    </>
  );
}
