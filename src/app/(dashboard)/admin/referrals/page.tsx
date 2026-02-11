"use client";

import { useState, useEffect } from "react";
import { cohortsService, referralsService } from "@/services";
import { ReferralLeaderboard } from "@/components/referrals/referral-leaderboard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
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
    <div className="space-y-10">
      <Breadcrumb items={[{ label: "Admin" }, { label: "Referrals" }]} />
      <AdminNav />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
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

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x rounded-xl border bg-card">
        <div className="px-6 py-5">
          <p className="text-3xl font-mono font-semibold tabular-nums text-emerald-600">{totalCredited}</p>
          <p className="text-xs text-muted-foreground mt-1">Credited</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-3xl font-mono font-semibold tabular-nums text-amber-600">{totalPending}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-3xl font-mono font-semibold tabular-nums text-blue-600">{uniqueReferrers}</p>
          <p className="text-xs text-muted-foreground mt-1">Unique Referrers</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-lg font-semibold text-violet-600">{topReferrer?.userName || "-"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Top Referrer{topReferrer ? ` (${topReferrer.totalReferrals})` : ""}
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Leaderboard{" "}
          {cohorts.find((c) => c.id === selectedCohortId)?.name
            ? `\u2014 ${cohorts.find((c) => c.id === selectedCohortId)!.name}`
            : ""}
        </h2>
        <ReferralLeaderboard entries={leaderboard} showPending />
      </section>

      {/* All Referrals Table */}
      <section>
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          All Referrals
        </h2>
        <div className="rounded-xl border overflow-x-auto">
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No referrals for this cohort yet.</p>
            </div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Credited</TableHead>
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
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={
                            referral.status === "credited"
                              ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                              : "h-1.5 w-1.5 rounded-full bg-amber-500"
                          }
                        />
                        <span
                          className={
                            referral.status === "credited"
                              ? "text-emerald-600 text-sm"
                              : "text-amber-600 text-sm"
                          }
                        >
                          {referral.status}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {referral.creditedAt
                        ? new Date(referral.creditedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}
