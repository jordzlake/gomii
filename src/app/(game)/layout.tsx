import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <>
      <div className="shell">{children}</div>
      <Nav />
    </>
  );
}
