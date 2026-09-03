import { currentUser } from "@/lib/auth";
import { goalsFor } from "@/lib/queries";
import TopBar from "@/components/TopBar";
import GoalBoard, { ClientGoal } from "@/components/GoalBoard";
import { GOAL_POINTS_PER_STAT } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = (await currentUser())!;
  const docs = await goalsFor(user.id);
  const goals: ClientGoal[] = docs.map((g) => ({
    id: g._id.toString(),
    title: g.title,
    detail: g.detail,
    icon: g.icon,
    statKeys: g.statKeys,
    completed: g.completed,
  }));

  return (
    <>
      <TopBar user={user} title="Long term goals" />
      <p className="muted" style={{ fontSize: 15, marginBottom: 14 }}>
        Goals are the big ones. Finishing a goal pays {GOAL_POINTS_PER_STAT} points into every stat you tag it with.
      </p>
      <GoalBoard goals={goals} />
    </>
  );
}
