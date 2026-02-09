"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loading } from "@/components/ui/loading";
import { ParticipantDashboard } from "@/components/dashboard/participant-dashboard";
import type { User } from "@/types";

function getRoleHome(role: User["role"]): string | null {
  switch (role) {
    case "admin":
      return "/admin/cohorts";
    case "judge":
      return "/reviews";
    case "sponsor":
      return "/sponsor/tracks";
    case "participant":
    default:
      return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const redirectTo = user ? getRoleHome(user.role) : null;

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (!user || redirectTo) {
    return <Loading fullScreen label="Loading..." />;
  }

  return <ParticipantDashboard />;
}
