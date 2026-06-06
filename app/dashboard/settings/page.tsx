import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSystemSetting } from "@/actions/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const recoveryEmail = await getSystemSetting("password_recovery_email") || "";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#131b2e]">Configuración del Sistema</h1>
        <p className="text-xs text-gray-500 mt-1">Administra los parámetros generales del ServiceDesk Pro.</p>
      </div>
      <SettingsForm initialEmail={recoveryEmail} />
    </div>
  );
}
