import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getUserId()) redirect("/today");
  return <AuthForm mode="register" />;
}
