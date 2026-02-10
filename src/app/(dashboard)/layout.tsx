"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
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

  // Safety valve: if loading is done but no user for an extended period,
  // sign out to clear cookies then redirect to /login.
  // Uses a 2-second delay to avoid firing on transient null states
  // (e.g. React strict mode remounts, auth listener race conditions).
  const redirectingRef = useRef(false);
  useEffect(() => {
    if (!isLoading && !user && !redirectingRef.current) {
      const timer = setTimeout(() => {
        redirectingRef.current = true;
        const supabase = createClient();
        supabase.auth.signOut().finally(() => {
          window.location.href = "/login";
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  if (isLoading || !user) {
    return <Loading fullScreen label="Loading..." />;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-muted">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
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
