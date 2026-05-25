import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  if (session.user.mustChangePassword === true && !pathname.startsWith("/dashboard/profile")) {
    redirect("/dashboard/profile?mustChange=1");
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar session={session} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
