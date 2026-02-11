"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";
import type { ReferralLeaderboardEntry } from "@/types";

interface ReferralLeaderboardProps {
  entries: ReferralLeaderboardEntry[];
  currentUserId?: string;
  showPending?: boolean;
}

export function ReferralLeaderboard({ entries, currentUserId, showPending = false }: ReferralLeaderboardProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No referrals yet. Be the first to invite someone!</p>
      </div>
    );
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Referrals</TableHead>
          {showPending && <TableHead className="text-right hidden md:table-cell">Pending</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.slice((page - 1) * pageSize, page * pageSize).map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          return (
            <TableRow
              key={entry.userId}
              className={cn(isCurrentUser && "bg-accent/50")}
            >
              <TableCell className="font-medium">
                {entry.rank <= 3 ? (
                  <span className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                    entry.rank === 1 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    entry.rank === 2 && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    entry.rank === 3 && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                  )}>
                    {entry.rank}
                  </span>
                ) : (
                  <span className="pl-2 text-muted-foreground">{entry.rank}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={entry.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userName}`}
                    alt={entry.userName}
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                  <span className={cn("font-medium", isCurrentUser && "text-primary")}>
                    {entry.userName}
                    {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">{entry.totalReferrals}</TableCell>
              {showPending && (
                <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                  {entry.pendingReferrals}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    {entries.length > pageSize && (
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={entries.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    )}
    </>
  );
}
