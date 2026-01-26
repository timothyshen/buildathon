"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepIPProps {
  data: {
    licenseType: string;
  };
  onChange: (field: string, value: string) => void;
}

export function StepIP({ data, onChange }: StepIPProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Registration</CardTitle>
        <CardDescription>
          Register your project as IP on Story Protocol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="licenseType">License Type</Label>
          <Select
            value={data.licenseType}
            onValueChange={(value) => onChange("licenseType", value)}
          >
            <SelectTrigger id="licenseType">
              <SelectValue placeholder="Select license type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non-commercial">
                Non-Commercial (free to fork, no commercial use)
              </SelectItem>
              <SelectItem value="commercial-use">
                Commercial Use (free to fork and monetize)
              </SelectItem>
              <SelectItem value="commercial-remix">
                Commercial Remix (fork, monetize, with royalties)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            IP registration will happen when you submit your project. Your work
            will be protected and can be forked by others according to the
            license you choose.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
