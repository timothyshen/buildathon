"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Loading } from "@/components/ui/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Note: login redirect is handled by middleware (server-side).
  // Only handle onboarding redirect client-side.
  useEffect(() => {
    if (!isLoading && user && !user.hasCompletedOnboarding && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return <Loading fullScreen label="Loading..." />;
  }

  if (!user) {
    // Middleware will redirect to /login - render nothing while that happens
    return <Loading fullScreen label="Loading..." />;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-muted">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full bg-background">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
