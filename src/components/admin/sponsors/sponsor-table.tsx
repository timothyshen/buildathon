"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Mail, Link2 } from "lucide-react";
import type { SponsorOrg, SponsorTier } from "@/types";

// Extended sponsor type with computed cohort participation data
export interface SponsorWithCohorts extends SponsorOrg {
  cohortIds: string[];
  totalContribution: number;
  hasDedicatedTrack: boolean;
  highestTier: SponsorTier | null;
}

interface SponsorTableProps {
  sponsors: SponsorWithCohorts[];
  onEdit: (sponsor: SponsorOrg) => void;
  onDelete: (sponsor: SponsorOrg) => void;
  onInvite: (sponsor: SponsorOrg) => void;
  onGenerateInviteLink: (sponsor: SponsorOrg) => void;
}

export function SponsorTable({ sponsors, onEdit, onDelete, onInvite, onGenerateInviteLink }: SponsorTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const sortedSponsors = [...sponsors].sort((a, b) => {
    const tierOrder = ["platinum", "gold", "silver", "bronze", "community", null];
    const aIndex = a.highestTier ? tierOrder.indexOf(a.highestTier) : tierOrder.length - 1;
    const bIndex = b.highestTier ? tierOrder.indexOf(b.highestTier) : tierOrder.length - 1;
    return aIndex - bIndex;
  });

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sponsor</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead className="hidden md:table-cell">Contribution</TableHead>
          <TableHead className="hidden md:table-cell">Track</TableHead>
          <TableHead className="hidden md:table-cell">Contact</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSponsors.slice((page - 1) * pageSize, page * pageSize).map((sponsor) => (
          <TableRow key={sponsor.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted" />
                )}
                <div>
                  <p className="text-sm font-medium">{sponsor.name}</p>
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {sponsor.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {sponsor.highestTier ? (
                <span className="text-xs capitalize text-muted-foreground">{sponsor.highestTier}</span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="font-mono text-xs tabular-nums">
                {sponsor.totalContribution > 0
                  ? `$${sponsor.totalContribution.toLocaleString()}`
                  : "—"}
              </span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-xs text-muted-foreground">
                {sponsor.hasDedicatedTrack ? "Yes" : "No"}
              </span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div>
                <p className="text-xs">{sponsor.contactName}</p>
                <p className="text-xs text-muted-foreground">{sponsor.contactEmail}</p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onGenerateInviteLink(sponsor)}
                  title="Generate invite link"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onInvite(sponsor)}
                  title="Invite existing user"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(sponsor)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(sponsor)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {sortedSponsors.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
              No sponsors yet. Add a sponsor to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    {sortedSponsors.length > pageSize && (
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={sortedSponsors.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    )}
    </>
  );
}
