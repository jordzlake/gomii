import { currentUser } from "@/lib/auth";
import { userCategories } from "@/lib/queries";
import { PRESET_CATEGORIES } from "@/lib/tasks";
import TopBar from "@/components/TopBar";
import { CategoryForm, TaskForm } from "@/components/CreateForms";
import { Icon } from "@/components/Sprite";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = (await currentUser())!;
  const mine = await userCategories(user.id);
  const categories = Array.from(new Set([...mine.map((c) => c.name), ...PRESET_CATEGORIES, "Custom"]));

  return (
    <>
      <TopBar user={user} title="Make your own" />

      <div className="section-head">
        <h2>New task</h2>
        <span>counts towards your stats</span>
      </div>
      <TaskForm categories={categories} />

      <div className="section-head">
        <h2>New category</h2>
        <span>{mine.length} of yours</span>
      </div>
      {mine.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {mine.map((c) => (
            <span className="chip" key={c._id.toString()}>
              <Icon name={c.icon} size={14} />
              {c.name}
            </span>
          ))}
        </div>
      )}
      <CategoryForm />
    </>
  );
}
