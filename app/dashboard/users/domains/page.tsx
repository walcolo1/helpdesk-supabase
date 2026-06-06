import { getAllowedDomains } from "@/actions/domains";
import { DomainManager } from "@/components/users/domain-manager";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AllowedDomainsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Solo admin puede entrar a gestionar dominios permitidos
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const domains = await getAllowedDomains();

  return <DomainManager initialDomains={domains} />;
}
