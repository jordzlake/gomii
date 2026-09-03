import { notFound } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { friendProfile } from "@/lib/friends";
import { getAvatar } from "@/data/sprites";
import { STATS, StatKey, xpForNextLevel } from "@/lib/stats";
import { CharacterSprite, EffectSprite, Icon } from "@/components/Sprite";
import Meter from "@/components/Meter";
import AchievementFeed from "@/components/AchievementFeed";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function FriendProfilePage({ params }: { params: { id: string } }) {
  const user = (await currentUser())!;
  const profile = await friendProfile(user.id, params.id);
  if (!profile) notFound();

  const highest = Math.max(10, ...STATS.map((s) => profile.stats?.[s.key] ?? 0));

  return (
    <>
      <TopBar user={user} title={profile.username} />

      <section className="char-hero">
        <CharacterSprite avatarId={profile.avatarId} playing fps={2.5} size={132} className="sprite anim-float" />
        <div className="center">
          <h2>{profile.username}</h2>
          <div className="tiny muted" style={{ marginTop: 6 }}>
            {getAvatar(profile.avatarId).name} · Level {profile.level}
          </div>
        </div>
        <div style={{ width: "100%" }}>
          <Meter value={profile.xp} max={xpForNextLevel(profile.level)} colour="var(--gold)" />
        </div>
        <div className="chip-row" style={{ justifyContent: "center" }}>
          <span className="chip" style={{ color: "var(--orange)" }}>
            <EffectSprite name="flame" stage={Math.min(4, Math.floor(profile.streak / 3))} size={14} />
            {profile.streak} day streak
          </span>
          <span className="chip" style={{ color: "var(--lime)" }}>
            <Icon name="checklist" size={14} /> {profile.completedCount} done
          </span>
          <span className="chip" style={{ color: "var(--soft-pink)" }}>
            <Icon name="celebrate" size={14} /> {profile.cheersReceived} good jobs
          </span>
        </div>
        <Link href="/friends" className="btn btn--ghost">Back to friends</Link>
      </section>

      <div className="section-head">
        <h2>Stats</h2>
      </div>
      <div className="stack">
        {STATS.map((s) => (
          <div className="panel panel--flat" key={s.key}>
            <div className="stat-line" style={{ marginBottom: 8 }}>
              <Icon name={s.icon} size={24} />
              <b style={{ color: s.colour }}>{s.name}</b>
              <span className="tiny" style={{ color: s.colour }}>{profile.stats?.[s.key as StatKey] ?? 0}</span>
            </div>
            <Meter value={profile.stats?.[s.key as StatKey] ?? 0} max={highest} colour={s.colour} slim />
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>What they have achieved</h2>
      </div>
      <AchievementFeed
        items={profile.achievements}
        linkToProfiles={false}
        emptyLine={`${profile.username} has not finished a one-off task yet.`}
      />
    </>
  );
}
