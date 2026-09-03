import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getUserId()) redirect("/today");
  return <AuthForm mode="login" />;
}
