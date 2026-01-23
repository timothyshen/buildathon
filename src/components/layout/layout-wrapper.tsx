"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

// Routes that should NOT show the marketing header/footer
const dashboardRoutes = [
  "/dashboard",
  "/submissions",
  "/submit",
  "/reviews",
  "/cohorts",
  "/admin",
  "/settings",
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDashboardRoute = dashboardRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isDashboardRoute) {
    // Dashboard pages have their own layout with sidebar
    return <>{children}</>;
  }

  // Marketing pages get header/footer
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
