import { currentUser } from "@/lib/auth";
import { allTasksFor } from "@/lib/queries";
import TopBar from "@/components/TopBar";
import TaskList from "@/components/TaskList";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user = (await currentUser())!;
  const { preset, custom } = await allTasksFor(user.id, user.level, user.hiddenTasks ?? []);

  // Unlocked first, then the next few locked ones so progress feels visible.
  const nextLocked = preset
    .filter((t) => !t.unlocked)
    .sort((a, b) => a.levelUnlocked - b.levelUnlocked)
    .slice(0, 20);

  const all = [...custom, ...preset.filter((t) => t.unlocked), ...nextLocked];
  const visible = all.filter((t) => !t.hidden);
  const hidden = [...custom, ...preset].filter((t) => t.hidden);

  return (
    <>
      <TopBar user={user} title="Quest board" />
      <p className="muted" style={{ fontSize: 15, marginBottom: 12 }}>
        {preset.filter((t) => t.unlocked).length} of {preset.length} built-in tasks unlocked, plus {custom.length} of
        your own.
      </p>

      <TaskList
        tasks={JSON.parse(JSON.stringify(visible))}
        showFilters
        deletable
        manageable
        emptyLine="Nothing matches that filter."
      />

      <details className="hidden-tasks">
        <summary>Hidden tasks · {hidden.length}</summary>
        <TaskList
          tasks={JSON.parse(JSON.stringify(hidden))}
          manageable
          deletable
          emptyLine="Nothing hidden. Use Hide on any task you never want to see."
        />
      </details>
    </>
  );
}
