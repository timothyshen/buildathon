"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Twitter, Github } from "lucide-react";

interface StepSocialProps {
  data: {
    twitter: string;
    github: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepSocial({ data, onChange, errors }: StepSocialProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect your socials</CardTitle>
        <CardDescription>
          Add your social profiles so others can find and connect with you.
          These are optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Twitter */}
        <div className="space-y-2">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter / X
          </Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="twitter"
              value={data.twitter}
              onChange={(e) => onChange("twitter", e.target.value.replace("@", ""))}
              placeholder="username"
              className="rounded-l-none"
              maxLength={30}
            />
          </div>
          {errors.twitter && (
            <p className="text-sm text-destructive">{errors.twitter}</p>
          )}
        </div>

        {/* GitHub */}
        <div className="space-y-2">
          <Label htmlFor="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub
          </Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              github.com/
            </span>
            <Input
              id="github"
              value={data.github}
              onChange={(e) => onChange("github", e.target.value)}
              placeholder="username"
              className="rounded-l-none"
              maxLength={40}
            />
          </div>
          {errors.github && (
            <p className="text-sm text-destructive">{errors.github}</p>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="text-sm text-muted-foreground">
            You can always update these later in your profile settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
