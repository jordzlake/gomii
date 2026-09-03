import { currentUser } from "@/lib/auth";
import { allTasksFor } from "@/lib/queries";
import TopBar from "@/components/TopBar";
import TaskList from "@/components/TaskList";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user = (await currentUser())!;
  const { preset, custom } = await allTasksFor(user.id, user.level);

  // Unlocked first, then the next few locked ones so progress feels visible.
  const nextLocked = preset
    .filter((t) => !t.unlocked)
    .sort((a, b) => a.levelUnlocked - b.levelUnlocked)
    .slice(0, 20);

  const list = [...custom, ...preset.filter((t) => t.unlocked), ...nextLocked];

  return (
    <>
      <TopBar user={user} title="Quest board" />
      <p className="muted" style={{ fontSize: 15, marginBottom: 12 }}>
        {preset.filter((t) => t.unlocked).length} of {preset.length} built-in tasks unlocked, plus {custom.length} of
        your own.
      </p>
      <TaskList tasks={JSON.parse(JSON.stringify(list))} showFilters deletable emptyLine="Nothing matches that filter." />
    </>
  );
}
