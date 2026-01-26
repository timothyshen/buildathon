"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface StepLinksTechProps {
  data: {
    demoUrl: string;
    repoUrl: string;
    videoUrl: string;
    presentationUrl: string;
    techStack: string[];
    builtWithStory: boolean;
  };
  onChange: (field: string, value: string | string[] | boolean) => void;
  errors: Record<string, string>;
}

export function StepLinksTech({ data, onChange, errors }: StepLinksTechProps) {
  const [newTech, setNewTech] = useState("");

  const addTech = () => {
    if (newTech.trim() && !data.techStack.includes(newTech.trim())) {
      onChange("techStack", [...data.techStack, newTech.trim()]);
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    onChange("techStack", data.techStack.filter((t) => t !== tech));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Share your project resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demoUrl">Demo URL</Label>
            <Input
              id="demoUrl"
              type="url"
              value={data.demoUrl}
              onChange={(e) => onChange("demoUrl", e.target.value)}
              placeholder="https://your-demo.com"
            />
            {errors.demoUrl && (
              <p className="text-sm text-destructive">{errors.demoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL</Label>
            <Input
              id="repoUrl"
              type="url"
              value={data.repoUrl}
              onChange={(e) => onChange("repoUrl", e.target.value)}
              placeholder="https://github.com/username/repo"
            />
            {errors.repoUrl && (
              <p className="text-sm text-destructive">{errors.repoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Demo Video URL</Label>
            <Input
              id="videoUrl"
              type="url"
              value={data.videoUrl}
              onChange={(e) => onChange("videoUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            {errors.videoUrl && (
              <p className="text-sm text-destructive">{errors.videoUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentationUrl">Presentation URL</Label>
            <Input
              id="presentationUrl"
              type="url"
              value={data.presentationUrl}
              onChange={(e) => onChange("presentationUrl", e.target.value)}
              placeholder="https://docs.google.com/presentation/..."
            />
            {errors.presentationUrl && (
              <p className="text-sm text-destructive">{errors.presentationUrl}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tech Stack</CardTitle>
          <CardDescription>What technologies did you use?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Add technology (e.g., React, Python)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTech} aria-label="Add technology">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {data.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="gap-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remove ${tech}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {errors.techStack && (
            <p className="text-sm text-destructive">{errors.techStack}</p>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="builtWithStory"
              checked={data.builtWithStory}
              onCheckedChange={(checked) => onChange("builtWithStory", !!checked)}
            />
            <Label htmlFor="builtWithStory" className="text-sm font-normal">
              Built with Story Protocol
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
