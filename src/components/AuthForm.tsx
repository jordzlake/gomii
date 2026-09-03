"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVATARS, avatarFrame, getAvatar } from "@/data/sprites";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const chosen = getAvatar(avatarId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username, avatarId }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Something went wrong." }));
      setError(body.error ?? "Something went wrong.");
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <main className="auth">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="gomii" className="auth-logo" />
      <p className="auth-tagline">
        {mode === "login" ? "Welcome back, adventurer" : "Build the character you want to be"}
      </p>

      <form className="panel" onSubmit={submit}>
        {error && <div className="error anim-shake" style={{ marginBottom: 14 }}>{error}</div>}

        {mode === "register" && (
          <div className="field">
            <label htmlFor="username">Character name</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Jordan the Steady"
              minLength={2}
              maxLength={24}
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {mode === "register" && <span className="tiny muted">At least 8 characters.</span>}
        </div>

        {mode === "register" && (
          <div className="field">
            <label>Pick your character</label>
            <div className="row" style={{ marginBottom: 8 }}>
              <div className="diamond diamond--sm" style={{ ["--tint" as string]: "var(--violet)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarFrame(chosen.id, 4)} alt="" />
              </div>
              <div>
                <b style={{ fontFamily: "var(--display)", fontSize: 10 }}>{chosen.name}</b>
                <div className="muted" style={{ fontSize: 14 }}>{chosen.blurb}</div>
              </div>
            </div>
            <div className="avatar-picker">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className="avatar-option"
                  aria-pressed={a.id === avatarId}
                  onClick={() => setAvatarId(a.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarFrame(a.id, 0)} alt={a.name} />
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn--block btn--gold" disabled={busy}>
          {busy ? "Working" : mode === "login" ? "Sign in" : "Create character"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? (
          <>New here? <Link href="/register">Create a character</Link></>
        ) : (
          <>Already playing? <Link href="/login">Sign in</Link></>
        )}
      </p>
    </main>
  );
}
