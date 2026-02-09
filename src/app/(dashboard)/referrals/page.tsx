"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { referralsService } from "@/services";
import { cohortsService } from "@/services";
import { ReferralLeaderboard } from "@/components/referrals/referral-leaderboard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Check, Users, Trophy, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Cohort, ReferralLeaderboardEntry } from "@/types";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [selectedCohortSlug, setSelectedCohortSlug] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, rank: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load active/upcoming cohorts
  useEffect(() => {
    async function loadCohorts() {
      const res = await cohortsService.list({ pageSize: 50 });
      if (res.success) {
        const activeCohorts = res.data.filter(
          (c) => c.status === "active" || c.status === "upcoming"
        );
        setCohorts(activeCohorts);
        if (activeCohorts.length > 0) {
          setSelectedCohortId(activeCohorts[0].id);
          setSelectedCohortSlug(activeCohorts[0].slug);
        }
      }
      setIsLoading(false);
    }
    loadCohorts();
  }, []);

  // Load referral data when cohort changes
  useEffect(() => {
    if (!selectedCohortId || !user) return;

    async function loadReferralData() {
      const [leaderboardRes, statsRes] = await Promise.all([
        referralsService.getLeaderboard(selectedCohortId),
        referralsService.getUserStats(user!.id, selectedCohortId),
      ]);

      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
      if (statsRes.success) setStats(statsRes.data);
    }
    loadReferralData();
  }, [selectedCohortId, user]);

  // Load or generate referral code
  useEffect(() => {
    if (!selectedCohortId || !user) return;

    async function loadCode() {
      const res = await referralsService.getOrCreateCode(user!.id, selectedCohortId);
      if (res.success) setReferralCode(res.data.code);
    }
    loadCode();
  }, [selectedCohortId, user]);

  const handleCohortChange = (cohortId: string) => {
    const cohort = cohorts.find((c) => c.id === cohortId);
    setSelectedCohortId(cohortId);
    setSelectedCohortSlug(cohort?.slug || "");
    setReferralCode("");
  };

  const handleCopy = async () => {
    if (!referralCode || !selectedCohortSlug) return;
    const link = `${window.location.origin}/cohorts/${selectedCohortSlug}?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className="space-y-10">
        <div className="rounded-xl border p-12 text-center">
          <Share2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-medium">No active cohorts</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No active cohorts available for referrals.
          </p>
        </div>
      </div>
    );
  }

  const referralLink = referralCode && selectedCohortSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/cohorts/${selectedCohortSlug}?ref=${referralCode}`
    : "";

  return (
    <div className="space-y-10">
      {/* Cohort selector */}
      {cohorts.length > 1 && (
        <div className="flex justify-end">
          <Select value={selectedCohortId} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Select cohort" />
            </SelectTrigger>
            <SelectContent>
              {cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stats bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <Users className="h-4 w-4 text-emerald-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-emerald-600">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Credited referrals</p>
          </div>
        </div>
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <Clock className="h-4 w-4 text-amber-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-amber-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </div>
        </div>
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[140px]">
          <Trophy className="h-4 w-4 text-violet-500" />
          <div>
            <div className="text-4xl font-mono font-bold tabular-nums text-violet-600">
              {stats.rank > 0 ? `#${stats.rank}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your rank</p>
          </div>
        </div>
      </div>

      {/* Referral link */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Your Referral Link
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Share this link to invite others. You get credit when they complete their profile.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm font-mono truncate text-muted-foreground">
            {referralLink || "Generating..."}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!referralCode}
            className="shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Leaderboard
          {cohorts.length === 1 && (
            <span className="ml-2 normal-case tracking-normal font-normal">
              — {cohorts[0].name}
            </span>
          )}
        </h2>
        <div className="rounded-xl border overflow-hidden">
          <ReferralLeaderboard
            entries={leaderboard}
            currentUserId={user?.id}
          />
        </div>
      </section>
    </div>
  );
}
