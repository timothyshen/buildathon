"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";

interface StepProfileProps {
  data: {
    name: string;
    bio: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepProfile({ data, onChange, errors }: StepProfileProps) {
  const avatarUrl = data.name
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome! Let's set up your profile</CardTitle>
        <CardDescription>
          Tell us a bit about yourself so others can get to know you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex justify-center">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-24 w-24 rounded-full border-4 border-violet-100 dark:border-violet-900"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <User className="h-10 w-10 text-slate-400" />
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Your avatar is generated from your name
        </p>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Your name"
            maxLength={50}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio (optional)</Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            placeholder="Tell us about yourself, your interests, and what you're building..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {data.bio.length}/200 characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
