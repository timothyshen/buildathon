"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralCapture() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `ref_code=${encodeURIComponent(refCode)}; path=/; expires=${expires}; SameSite=Lax`;
    }
  }, [refCode]);

  return null;
}
