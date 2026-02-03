"use client";

import type { TractionSnapshot } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsHistoryProps {
  snapshots: TractionSnapshot[];
}

function formatNumber(num: number | undefined): string {
  if (num === undefined) return "-";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getGrowthIndicator(current: number | undefined, previous: number | undefined) {
  if (current === undefined || previous === undefined) return null;
  if (current > previous) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  }
  if (current < previous) {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function MetricsHistory({ snapshots }: MetricsHistoryProps) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Metrics History
          </CardTitle>
          <CardDescription>
            Historical snapshots of your project metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No metrics recorded yet</p>
            <p className="text-sm">Submit your first metrics snapshot above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Metrics History
        </CardTitle>
        <CardDescription>
          Historical snapshots of your project metrics ({snapshots.length} records)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">DAU</TableHead>
                <TableHead className="text-right">MAU</TableHead>
                <TableHead className="text-right hidden md:table-cell">Visits</TableHead>
                <TableHead className="text-right hidden md:table-cell">GA Users</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Sessions</TableHead>
                <TableHead className="text-right hidden md:table-cell">Followers</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Tx Count</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot, index) => {
                const previousSnapshot = snapshots[index + 1];
                return (
                  <TableRow key={snapshot.id}>
                    <TableCell className="font-medium">
                      {new Date(snapshot.snapshotDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.reportedDau)}
                        {getGrowthIndicator(
                          snapshot.reportedDau,
                          previousSnapshot?.reportedDau
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.reportedMau)}
                        {getGrowthIndicator(
                          snapshot.reportedMau,
                          previousSnapshot?.reportedMau
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.reportedMonthlyVisits)}
                        {getGrowthIndicator(
                          snapshot.reportedMonthlyVisits,
                          previousSnapshot?.reportedMonthlyVisits
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.gaActiveUsers)}
                        {getGrowthIndicator(
                          snapshot.gaActiveUsers,
                          previousSnapshot?.gaActiveUsers
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.gaSessions)}
                        {getGrowthIndicator(
                          snapshot.gaSessions,
                          previousSnapshot?.gaSessions
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.twitterFollowers)}
                        {getGrowthIndicator(
                          snapshot.twitterFollowers,
                          previousSnapshot?.twitterFollowers
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {formatNumber(snapshot.onchainTxCount)}
                        {getGrowthIndicator(
                          snapshot.onchainTxCount,
                          previousSnapshot?.onchainTxCount
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={snapshot.dataSource === "api" ? "default" : "secondary"}
                      >
                        {snapshot.dataSource}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
