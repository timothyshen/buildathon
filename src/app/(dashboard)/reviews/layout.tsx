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

  useEffect(() => {
    // Only judges can access the reviews section
    if (!isLoading && user && user.role !== "judge") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loading fullScreen label="Loading..." />;
  }

  if (!user || user.role !== "judge") {
    return <Loading fullScreen label="Loading..." />;
  }

  return <>{children}</>;
}
