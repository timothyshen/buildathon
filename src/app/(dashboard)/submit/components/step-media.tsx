"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiImageUploader } from "@/components/ui/multi-image-uploader";

interface StepMediaProps {
  data: {
    screenshots: string[];
  };
  onChange: (field: string, value: string[]) => void;
  errors: Record<string, string>;
}

export function StepMedia({ data, onChange, errors }: StepMediaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Screenshots</CardTitle>
        <CardDescription>
          Upload at least 3 screenshots of your project. These will be displayed on your public project page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MultiImageUploader
          value={data.screenshots}
          onChange={(urls) => onChange("screenshots", urls)}
          bucket="screenshots"
          label="Screenshots"
          minImages={3}
          maxImages={10}
        />
        {errors.screenshots && (
          <p className="text-sm text-destructive">{errors.screenshots}</p>
        )}
      </CardContent>
    </Card>
  );
}
