"use client";

import { useState, useEffect } from "react";
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
import { Pencil, Eye, Users } from "lucide-react";
import Link from "next/link";
import type { Cohort, CohortSponsor } from "@/types";
import { sponsorsService } from "@/services";

interface CohortTableProps {
  cohorts: Cohort[];
}

export function CohortTable({ cohorts }: CohortTableProps) {
  const [cohortSponsors, setCohortSponsors] = useState<CohortSponsor[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    async function loadSponsors() {
      const { data, success } = await sponsorsService.listCohortSponsors();
      if (success) setCohortSponsors(data);
    }
    loadSponsors();
  }, []);

  const getSponsorCount = (cohortId: string) => {
    return cohortSponsors.filter((cs) => cs.cohortId === cohortId).length;
  };

  const paginatedCohorts = cohorts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
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
        {paginatedCohorts.map((cohort) => (
          <TableRow key={cohort.id}>
            <TableCell>
              <div>
                <p className="text-sm font-medium">{cohort.name}</p>
                <p className="text-xs text-muted-foreground">{cohort.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  cohort.status === "active" ? "bg-emerald-500"
                    : cohort.status === "upcoming" ? "bg-blue-500"
                    : cohort.status === "judging" ? "bg-violet-500"
                    : cohort.status === "completed" ? "bg-amber-500"
                    : "bg-muted-foreground"
                }`} />
                <span className="text-xs capitalize">{cohort.status}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="text-xs text-muted-foreground">
                <p>{new Date(cohort.startDate).toLocaleDateString()}</p>
                <p>to {new Date(cohort.endDate).toLocaleDateString()}</p>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{getSponsorCount(cohort.id)}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-xs text-muted-foreground">
                {cohort.isPublic ? "Public" : "Private"}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                  <Link href={`/admin/cohorts/${cohort.id}`}>
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                  <Link href={`/admin/cohorts/${cohort.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {cohorts.length > pageSize && (
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={cohorts.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    )}
    </>
  );
}
