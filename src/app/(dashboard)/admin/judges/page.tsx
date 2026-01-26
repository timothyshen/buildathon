"use client";

import { useState, useEffect } from "react";
import { usersService, reviewsService } from "@/services";
import type { User, Review } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Star, CheckCircle, Clock, Users, Loader2 } from "lucide-react";

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [usersResult, reviewsResult] = await Promise.all([
        usersService.list({ role: "judge" }),
        reviewsService.list(),
      ]);

      if (usersResult.success) setJudges(usersResult.data as User[]);
      if (reviewsResult.success) setReviews(reviewsResult.data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredJudges = judges.filter(
    (judge) =>
      search === "" ||
      judge.name.toLowerCase().includes(search.toLowerCase()) ||
      judge.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminNav />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/dashboard" },
          { label: "Judges" }
        ]}
        className="mb-4"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Judges</h1>
          <p className="mt-2 text-muted-foreground">
            Manage judges and their review assignments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Judge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Judge</DialogTitle>
              <DialogDescription>
                Send an invitation to a new judge
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="judge@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Judge Name" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Judges</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search judges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Judges Table */}
      {filteredJudges.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Judges Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add judges to help evaluate submissions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="hidden md:table-cell">Pending</TableHead>
                  <TableHead className="hidden md:table-cell">Avg Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJudges.map((judge) => {
                  const judgeReviews = reviews.filter(
                    (r) => r.judgeId === judge.id
                  );
                  const completed = judgeReviews.filter(
                    (r) => r.status === "completed"
                  );
                  const pending = judgeReviews.filter((r) => r.status === "pending");
                  const avgScore =
                    completed.length > 0
                      ? completed.reduce((acc, r) => acc + (r.overallScore || 0), 0) /
                        completed.length
                      : 0;

                  return (
                    <TableRow key={judge.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={judge.avatar}
                            alt={judge.name}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{judge.name}</p>
                            {judge.bio && (
                              <p className="text-xs text-muted-foreground">
                                {judge.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{judge.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{judgeReviews.length}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {completed.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {pending.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {avgScore > 0 ? avgScore.toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Assign Reviews
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
