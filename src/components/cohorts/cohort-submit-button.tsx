"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function CohortSubmitButton() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return (
      <Link href="/login?redirect=/submit">
        <Button size="lg">Login to Submit</Button>
      </Link>
    );
  }

  return (
    <Link href="/submit">
      <Button size="lg">Submit Your Project</Button>
    </Link>
  );
}
