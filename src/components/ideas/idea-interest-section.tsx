"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, HandHeart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { ideasService } from "@/services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { IdeaInterest, IdeaInterestRole } from "@/types";

const ROLE_LABELS: Record<IdeaInterestRole, string> = {
  builder: "Builder",
  designer: "Designer",
  business: "Business",
  other: "Other",
};

const ROLE_COLORS: Record<IdeaInterestRole, string> = {
  builder: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  designer: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  business: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  other: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface IdeaInterestSectionProps {
  ideaId: string;
  interests: IdeaInterest[];
  onRefresh: () => void;
}

export function IdeaInterestSection({ ideaId, interests, onRefresh }: IdeaInterestSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [role, setRole] = useState<IdeaInterestRole>("builder");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserInterest = user ? interests.find((i) => i.userId === user.id) : null;

  const handleInterest = () => {
    if (!user) {
      router.push("/login?redirect=/ideas");
      return;
    }
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const res = await ideasService.addInterest(ideaId, user.id, role, message.trim() || undefined);
    if (res.success) {
      toast.success("Interest registered!");
      setShowDialog(false);
      setMessage("");
      onRefresh();
    } else {
      toast.error(res.error || "Failed to register interest");
    }
    setIsSubmitting(false);
  };

  const handleWithdraw = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const res = await ideasService.removeInterest(ideaId, user.id);
    if (res.success) {
      toast.success("Interest withdrawn");
      onRefresh();
    } else {
      toast.error("Failed to withdraw interest");
    }
    setIsSubmitting(false);
  };

  return (
    <section className="rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Interested ({interests.length})
        </h3>
      </div>

      {/* Action button */}
      {currentUserInterest ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={handleWithdraw}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
          Withdraw Interest
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleInterest}
        >
          <HandHeart className="mr-2 h-4 w-4" />
          I&apos;m Interested
        </Button>
      )}

      {/* Interest list */}
      {interests.length > 0 && (
        <div className="space-y-3">
          {interests.map((interest) => (
            <div key={interest.id} className="flex items-start gap-3">
              <Avatar size="sm">
                {interest.user?.avatar && (
                  <AvatarImage src={interest.user.avatar} alt={interest.user.name} />
                )}
                <AvatarFallback>
                  {interest.user ? getInitials(interest.user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {interest.user?.name || "Anonymous"}
                  </span>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full", ROLE_COLORS[interest.role])}>
                    {ROLE_LABELS[interest.role]}
                  </span>
                </div>
                {interest.message && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{interest.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {interests.length === 0 && (
        <div className="text-center py-4">
          <Users className="mx-auto h-6 w-6 text-muted-foreground/50" />
          <p className="mt-2 text-xs text-muted-foreground">No one yet — be the first!</p>
        </div>
      )}

      {/* Interest dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Express Interest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Your Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as IdeaInterestRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builder">Builder (Developer)</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="business">Business / Strategy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why are you interested? What can you bring to the team?"
                rows={3}
                className="text-sm"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
