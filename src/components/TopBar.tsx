import { iconSrc } from "@/data/sprites";
import { SessionUser } from "@/lib/auth";

export default function TopBar({ user, title }: { user: SessionUser; title: string }) {
  return (
    <header className="topbar">
      <h1 style={{ fontSize: 13 }}>{title}</h1>
      <div className="row">
        <span className="pill" title="Streak">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc("alarm")} alt="" /> {user.streak}
        </span>
        <span className="pill" style={{ color: "var(--gold)" }} title="Coins">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc("coin")} alt="" /> {user.coins}
        </span>
        <span className="pill" style={{ color: "var(--cyan)" }} title="Level">
          LV {user.level}
        </span>
      </div>
    </header>
  );
}
