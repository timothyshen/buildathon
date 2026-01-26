"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { teamsService, cohortsService } from "@/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Cohort } from "@/types";

export default function NewTeamPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([]);
  const [cohortId, setCohortId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCohorts() {
      if (!user) return;

      const { data: cohorts } = await cohortsService.list();

      // Filter to cohorts where user doesn't already have a team
      const available: Cohort[] = [];
      for (const cohort of cohorts) {
        const isActiveOrUpcoming = cohort.status === "active" || cohort.status === "upcoming";
        if (!isActiveOrUpcoming || !cohort.isPublic) continue;

        const { data: existingTeam } = await teamsService.getByUserAndCohort(user.id, cohort.id);
        if (!existingTeam) {
          available.push(cohort);
        }
      }

      setAvailableCohorts(available);
      setIsLoadingCohorts(false);
    }
    loadCohorts();
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!cohortId) newErrors.cohortId = "Please select a cohort";
    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = "Team name must be at least 3 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data: newTeam, success, error } = await teamsService.create({
        cohortId,
        name: name.trim(),
        description: description.trim() || undefined,
        leadUserId: user.id,
      });

      if (success && newTeam) {
        toast.success("Team created successfully!");
        router.push(`/teams/${newTeam.id}`);
      } else {
        toast.error(error || "Failed to create team");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams" aria-label="Back to teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Team</h1>
          <p className="mt-1 text-muted-foreground">
            Start a new team for a buildathon
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>
            You'll be the team lead and can invite up to 4 more members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCohorts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cohort">Cohort *</Label>
                <Select value={cohortId} onValueChange={setCohortId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a buildathon" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cohortId && (
                  <p className="text-sm text-destructive">{errors.cohortId}</p>
                )}
                {availableCohorts.length === 0 && (
                  <p className="text-sm text-amber-600">
                    You already have a team in all active buildathons.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g., IP Innovators"
                  maxLength={50}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is your team building?"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/200 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/teams">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || availableCohorts.length === 0}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
