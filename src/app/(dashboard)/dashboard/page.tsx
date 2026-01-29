"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loading } from "@/components/ui/loading";
import type { User } from "@/types";

function getRoleHome(role: User["role"]): string {
  switch (role) {
    case "admin":
      return "/admin/cohorts";
    case "judge":
      return "/reviews";
    case "sponsor":
      return "/sponsor/tracks";
    case "participant":
    default:
      return "/submissions";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace(getRoleHome(user.role));
    }
  }, [user, router]);

  return <Loading fullScreen label="Loading..." />;
}
