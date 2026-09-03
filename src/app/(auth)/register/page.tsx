import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { currentUser, destroySession, getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await currentUser();
  if (user) redirect("/today");
  // A signed cookie whose user no longer exists would bounce us back here forever.
  if (await getUserId()) destroySession();
  return <AuthForm mode="register" />;
}
