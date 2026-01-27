"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Loading } from "@/components/ui/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Redirect to onboarding if not completed (except when already on onboarding page)
  useEffect(() => {
    if (!isLoading && user && !user.hasCompletedOnboarding && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return <Loading fullScreen label="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full bg-white dark:bg-neutral-900">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
