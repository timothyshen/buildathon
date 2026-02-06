"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { referralsService } from "@/services";
import { cohortsService } from "@/services";
import { ReferralLeaderboard } from "@/components/referrals/referral-leaderboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Check, Users, Trophy, Loader2 } from "lucide-react";
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

      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    }
    loadReferralData();
  }, [selectedCohortId, user]);

  // Load or generate referral code
  useEffect(() => {
    if (!selectedCohortId || !user) return;

    async function loadCode() {
      const res = await referralsService.getOrCreateCode(user!.id, selectedCohortId);
      if (res.success) {
        setReferralCode(res.data.code);
      }
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active cohorts available for referrals.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const referralLink = referralCode && selectedCohortSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/cohorts/${selectedCohortSlug}?ref=${referralCode}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrals</h1>
        {cohorts.length > 1 && (
          <Select value={selectedCohortId} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[220px]">
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
        )}
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to invite others. You get credit when they complete their profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
              {referralLink || "Generating..."}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy} disabled={!referralCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Credited Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Trophy className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rank > 0 ? `#${stats.rank}` : "-"}</p>
                <p className="text-xs text-muted-foreground">Your Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Referral Leaderboard
          </CardTitle>
          <CardDescription>
            {cohorts.find((c) => c.id === selectedCohortId)?.name || ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralLeaderboard
            entries={leaderboard}
            currentUserId={user?.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
