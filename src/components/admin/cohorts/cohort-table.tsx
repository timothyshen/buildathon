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
import { Pencil, Eye, Users } from "lucide-react";
import Link from "next/link";
import type { Cohort } from "@/types";
import { mockCohortSponsors } from "@/data/mock-data";

interface CohortTableProps {
  cohorts: Cohort[];
  onEdit: (cohort: Cohort) => void;
}

const statusColors: Record<Cohort["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  upcoming: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  judging: "bg-purple-100 text-purple-700",
  completed: "bg-amber-100 text-amber-700",
};

export function CohortTable({ cohorts, onEdit }: CohortTableProps) {
  const getSponsorCount = (cohortId: string) => {
    return mockCohortSponsors.filter((cs) => cs.cohortId === cohortId).length;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Dates</TableHead>
          <TableHead className="hidden md:table-cell">Sponsors</TableHead>
          <TableHead className="hidden md:table-cell">Visibility</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cohorts.map((cohort) => (
          <TableRow key={cohort.id}>
            <TableCell>
              <div>
                <p className="font-medium">{cohort.name}</p>
                <p className="text-xs text-muted-foreground">{cohort.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[cohort.status]}>
                {cohort.status}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="text-sm">
                <p>{new Date(cohort.startDate).toLocaleDateString()}</p>
                <p className="text-muted-foreground">
                  to {new Date(cohort.endDate).toLocaleDateString()}
                </p>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{getSponsorCount(cohort.id)}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant={cohort.isPublic ? "default" : "outline"}>
                {cohort.isPublic ? "Public" : "Private"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/cohorts/${cohort.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(cohort)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
