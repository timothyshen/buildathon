"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loading } from "@/components/ui/loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loading fullScreen label="Loading..." />;
  }

  if (!user || user.role !== "admin") {
    return <Loading fullScreen label="Loading..." />;
  }

  return <>{children}</>;
}
