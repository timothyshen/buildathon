"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Mail } from "lucide-react";
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
}

const tierColors: Record<SponsorTier, string> = {
  platinum: "bg-slate-200 text-slate-800",
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-600",
  bronze: "bg-orange-100 text-orange-800",
  community: "bg-green-100 text-green-800",
};

export function SponsorTable({ sponsors, onEdit, onDelete, onInvite }: SponsorTableProps) {
  const sortedSponsors = [...sponsors].sort((a, b) => {
    const tierOrder = ["platinum", "gold", "silver", "bronze", "community", null];
    const aIndex = a.highestTier ? tierOrder.indexOf(a.highestTier) : tierOrder.length - 1;
    const bIndex = b.highestTier ? tierOrder.indexOf(b.highestTier) : tierOrder.length - 1;
    return aIndex - bIndex;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sponsor</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Contribution</TableHead>
          <TableHead>Track</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSponsors.map((sponsor) => (
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
                  <div className="h-8 w-8 rounded bg-slate-200" />
                )}
                <div>
                  <p className="font-medium">{sponsor.name}</p>
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
                <Badge className={tierColors[sponsor.highestTier]}>{sponsor.highestTier}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell>
              {sponsor.totalContribution > 0
                ? `$${sponsor.totalContribution.toLocaleString()}`
                : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={sponsor.hasDedicatedTrack ? "default" : "outline"}>
                {sponsor.hasDedicatedTrack ? "Yes" : "No"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p>{sponsor.contactName}</p>
                <p className="text-muted-foreground">{sponsor.contactEmail}</p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onInvite(sponsor)}
                  title="Invite sponsor user"
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(sponsor)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(sponsor)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {sortedSponsors.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No sponsors yet. Add a sponsor to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
