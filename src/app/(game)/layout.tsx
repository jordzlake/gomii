import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { currentUser } from "@/lib/auth";
import { unseenAchievements } from "@/lib/friends";

export const dynamic = "force-dynamic";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Only players who asked to track friends get a count on the nav.
  const unseen =
    user.trackFriends === false
      ? 0
      : await unseenAchievements(user.id, user.friendsSeenAt ? new Date(user.friendsSeenAt) : null);

  return (
    <>
      <div className="shell">{children}</div>
      <Nav friendAlerts={unseen} />
    </>
  );
}
