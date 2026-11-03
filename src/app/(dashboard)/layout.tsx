import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentCompany } from "@/lib/dashboard/queries";
import { SIDEBAR_COOKIE_NAME } from "@/lib/dashboard/sidebar-preference";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const result = await getCurrentCompany();

  if (!result) {
    redirect("/auth/login");
  }

  const { company } = result;
  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "1";

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        companyName={company.company_name}
        defaultCollapsed={defaultCollapsed}
      />
      <main className="flex-1 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
