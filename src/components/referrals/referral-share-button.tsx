"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface ReferralShareButtonProps {
  cohortId: string;
  cohortSlug: string;
}

export function ReferralShareButton({ cohortId, cohortSlug }: ReferralShareButtonProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user.role !== "participant") return null;

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/referrals/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to generate referral link");
        return;
      }

      const link = `${window.location.origin}/cohorts/${cohortSlug}?ref=${data.code}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to generate referral link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleShare} disabled={isLoading}>
      {copied ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Share2 className="mr-2 h-4 w-4" />
      )}
      {copied ? "Copied!" : "Share & Earn"}
    </Button>
  );
}
