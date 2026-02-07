"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { feedbackService } from "@/services";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { FeedbackStatus } from "@/types";

const statuses: { value: FeedbackStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

interface FeedbackStatusSelectProps {
  postId: string;
  currentStatus: FeedbackStatus;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
}

export function FeedbackStatusSelect({ postId, currentStatus, onStatusChange }: FeedbackStatusSelectProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState(currentStatus);

  const handleChange = async (value: string) => {
    const newStatus = value as FeedbackStatus;
    if (!user || newStatus === status) return;

    const oldStatus = status;
    setStatus(newStatus);

    const res = await feedbackService.updateStatus(postId, newStatus, user.id);
    if (res.success) {
      toast.success(`Status updated to "${statuses.find((s) => s.value === newStatus)?.label}"`);
      onStatusChange?.(newStatus);
    } else {
      setStatus(oldStatus);
      toast.error("Failed to update status");
    }
  };

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
