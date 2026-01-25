"use client";

import { useAuth } from "@/contexts/auth-context";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { JudgeDashboard } from "@/components/dashboard/judge-dashboard";
import { SponsorDashboard } from "@/components/dashboard/sponsor-dashboard";
import { ParticipantDashboard } from "@/components/dashboard/participant-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "judge":
      return <JudgeDashboard />;
    case "sponsor":
      return <SponsorDashboard />;
    case "participant":
    default:
      return <ParticipantDashboard />;
  }
}
