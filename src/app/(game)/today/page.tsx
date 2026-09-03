import { currentUser } from "@/lib/auth";
import { allTasksFor, recentCompletions } from "@/lib/queries";
import Hero from "@/components/Hero";
import TopBar from "@/components/TopBar";
import TaskList from "@/components/TaskList";
import { Icon } from "@/components/Sprite";
import { periodStart } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = (await currentUser())!;
  const { preset, custom } = await allTasksFor(user.id, user.level, user.hiddenTasks ?? []);
  const history = await recentCompletions(user.id, 8);

  const startOfDay = periodStart("daily")!;
  const doneToday = history.filter((c) => new Date(c.completedAt) >= startOfDay).length;

  const repeating = [...custom, ...preset].filter((t) => t.repeat !== "once" && t.unlocked && !t.hidden);
  const dueNow = repeating.filter((t) => t.available);

  // A short rotating shortlist of one-off tasks at the player's level.
  const shortlist = preset
    .filter((t) => t.repeat === "once" && t.available && !t.hidden)
    .sort((a, b) => b.levelUnlocked - a.levelUnlocked)
    .slice(0, 6);

  return (
    <>
      <TopBar user={user} title="gomii" />

      <Hero
        name={user.username}
        avatarId={user.avatarId}
        level={user.level}
        xp={user.xp}
        streak={user.streak}
        doneToday={doneToday}
        dueToday={dueNow.length + doneToday}
      />

      <div className="section-head">
        <h2>On repeat</h2>
        <span>{dueNow.length} waiting</span>
      </div>
      <TaskList
        tasks={JSON.parse(JSON.stringify(dueNow))}
        manageable
        emptyLine="Every repeating task is done. Come back when the timer rolls over."
      />

      <div className="section-head">
        <h2>Try one of these</h2>
        <span>level {user.level}</span>
      </div>
      <TaskList tasks={JSON.parse(JSON.stringify(shortlist))} manageable emptyLine="Level up to unlock more tasks." />

      <div className="section-head">
        <h2>Recently done</h2>
      </div>
      {history.length === 0 ? (
        <div className="empty">
          <Icon name="hourglass" size={64} />
          <p>Your log is empty. Finish anything above to start it.</p>
        </div>
      ) : (
        <div className="ledger">
          {history.map((c) => (
            <div className="ledger-row" key={c._id.toString()}>
              <Icon name="checklist" size={32} />
              <div>
                {c.title}
                <small>{c.category}</small>
              </div>
              <span className="tiny" style={{ color: "var(--gold)" }}>+{c.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
