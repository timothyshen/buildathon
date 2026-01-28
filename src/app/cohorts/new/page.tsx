"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loading } from "@/components/ui/loading";

export default function NewCohortRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in - redirect to login
      router.push("/login?redirect=/admin/cohorts/new");
    } else if (user.role === "admin") {
      // Admin - redirect to admin cohorts new page
      router.push("/admin/cohorts/new");
    } else {
      // Non-admin - redirect to cohorts list with message
      router.push("/cohorts");
    }
  }, [user, isLoading, router]);

  return <Loading fullScreen label="Redirecting..." />;
}
