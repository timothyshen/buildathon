"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loading } from "@/components/ui/loading";

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const allowedRoles = ["judge", "admin", "sponsor"];

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loading fullScreen label="Loading..." />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Loading fullScreen label="Loading..." />;
  }

  return <>{children}</>;
}
