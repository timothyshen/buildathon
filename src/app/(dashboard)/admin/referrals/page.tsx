"use client";

import { useState, useEffect } from "react";
import { cohortsService, referralsService } from "@/services";
import { ReferralLeaderboard } from "@/components/referrals/referral-leaderboard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Trophy, Share2, Loader2 } from "lucide-react";
import type { Cohort, Referral, ReferralLeaderboardEntry } from "@/types";

export default function AdminReferralsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cohorts
  useEffect(() => {
    async function loadCohorts() {
      const res = await cohortsService.list({ pageSize: 50 });
      if (res.success) {
        setCohorts(res.data);
        if (res.data.length > 0) {
          setSelectedCohortId(res.data[0].id);
        }
      }
      setIsLoading(false);
    }
    loadCohorts();
  }, []);

  // Load referral data when cohort changes
  useEffect(() => {
    if (!selectedCohortId) return;

    async function loadData() {
      const [leaderboardRes, referralsRes] = await Promise.all([
        referralsService.getLeaderboard(selectedCohortId),
        referralsService.getReferralsByCohort(selectedCohortId),
      ]);

      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
      if (referralsRes.success) setReferrals(referralsRes.data);
    }
    loadData();
  }, [selectedCohortId]);

  const totalCredited = referrals.filter((r) => r.status === "credited").length;
  const totalPending = referrals.filter((r) => r.status === "pending").length;
  const uniqueReferrers = new Set(referrals.map((r) => r.referrerId)).size;
  const topReferrer = leaderboard.length > 0 ? leaderboard[0] : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Admin" }, { label: "Referrals" }]} />
        <AdminNav />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Admin" }, { label: "Referrals" }]} />
      <AdminNav />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrals</h1>
        {cohorts.length > 1 && (
          <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCredited}</p>
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
                <p className="text-2xl font-bold">{totalPending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueReferrers}</p>
                <p className="text-xs text-muted-foreground">Unique Referrers</p>
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
                <p className="text-2xl font-bold">{topReferrer?.userName || "-"}</p>
                <p className="text-xs text-muted-foreground">
                  Top Referrer{topReferrer ? ` (${topReferrer.totalReferrals})` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            {cohorts.find((c) => c.id === selectedCohortId)?.name || ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralLeaderboard entries={leaderboard} showPending />
        </CardContent>
      </Card>

      {/* Detailed Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
          <CardDescription>
            Detailed list of all referral events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No referrals for this cohort yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Credited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={referral.referrer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${referral.referrer?.name || referral.referrerId}`}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover border"
                        />
                        <span className="font-medium">{referral.referrer?.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={referral.referred?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${referral.referred?.name || referral.referredId}`}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover border"
                        />
                        <span>{referral.referred?.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={referral.status === "credited" ? "default" : "secondary"}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {referral.creditedAt
                        ? new Date(referral.creditedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
