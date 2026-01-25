"use client";

import { useState } from "react";
import Link from "next/link";
import { mockSubmissions, mockCohorts } from "@/data/mock-data";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ExternalLink, Eye } from "lucide-react";

export default function AdminSubmissionsPage() {
  const [search, setSearch] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredSubmissions = mockSubmissions.filter((submission) => {
    const matchesSearch =
      search === "" ||
      submission.title.toLowerCase().includes(search.toLowerCase()) ||
      submission.team?.name.toLowerCase().includes(search.toLowerCase());

    const matchesCohort =
      selectedCohort === "all" || submission.cohortId === selectedCohort;

    const matchesStatus =
      selectedStatus === "all" || submission.status === selectedStatus;

    return matchesSearch && matchesCohort && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "winner":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "under_review":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <AdminNav />

      <div>
        <h1 className="text-3xl font-bold">All Submissions</h1>
        <p className="mt-2 text-muted-foreground">
          Manage all buildathon submissions across cohorts
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCohort} onValueChange={setSelectedCohort}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Cohorts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            {mockCohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {cohort.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="winner">Winner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{submission.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.tagline?.slice(0, 40)}
                        {submission.tagline && submission.tagline.length > 40 ? "..." : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{submission.team?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{submission.cohort?.name}</Badge>
                  </TableCell>
                  <TableCell>{submission.track?.name || "Open"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {submission.demoUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={submission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing {filteredSubmissions.length} of {mockSubmissions.length} submissions
      </p>
    </div>
  );
}
