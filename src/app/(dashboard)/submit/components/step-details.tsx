"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface StepDetailsProps {
  data: {
    title: string;
    tagline: string;
    description: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function StepDetails({ data, onChange, errors }: StepDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <CardDescription>Tell us about your project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="My Awesome Project"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={data.tagline}
            onChange={(e) => onChange("tagline", e.target.value)}
            placeholder="A short description of your project"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {data.tagline.length}/100 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label id="description-label">Description *</Label>
          <div aria-labelledby="description-label">
            <RichTextEditor
              value={data.description}
              onChange={(value) => onChange("description", value)}
              placeholder="Describe what your project does, the problem it solves, and how it works..."
            />
          </div>
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
