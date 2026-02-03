"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InviteFormProps {
  currentMemberCount: number;
  existingEmails: string[];
  onInvite: (email: string) => Promise<void>;
}

export function InviteForm({
  currentMemberCount,
  existingEmails,
  onInvite,
}: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canInvite = currentMemberCount < 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (existingEmails.includes(trimmedEmail)) {
      toast.error("This person is already on the team or has a pending invite");
      return;
    }

    if (!canInvite) {
      toast.error("Team is full (maximum 5 members)");
      return;
    }

    setIsLoading(true);
    try {
      await onInvite(trimmedEmail);
      setEmail("");
      toast.success("Invitation sent!");
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Invite by Email</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !canInvite}
          />
          <Button type="submit" disabled={isLoading || !canInvite}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Invite
              </>
            )}
          </Button>
        </div>
        {!canInvite && (
          <p className="text-sm text-amber-600">
            Team is full. Remove a member to invite someone new.
          </p>
        )}
      </div>
    </form>
  );
}
