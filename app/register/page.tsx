import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
