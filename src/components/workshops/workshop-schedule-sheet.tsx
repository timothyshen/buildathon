"use client";

import { useState, useEffect } from "react";
import type { Workshop, SponsorOrg } from "@/types";
import { workshopsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const categories = ["Basics", "Advanced", "Business", "Technical"];

const commonTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

function formatTimezoneLabel(tz: string): string {
  try {
    const now = new Date();
    const offset = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value || "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") || tz;
    return `${city} (${offset})`;
  } catch {
    return tz;
  }
}

function getLocalTimezone(): string {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (commonTimezones.includes(local)) return local;
  return "UTC";
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeForInput(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

interface WorkshopScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialHour?: number;
  editWorkshop?: Workshop | null;
  sponsorOrg: SponsorOrg;
  onSaved: () => void;
}

export function WorkshopScheduleSheet({
  open,
  onOpenChange,
  initialDate,
  initialHour,
  editWorkshop,
  sponsorOrg,
  onSaved,
}: WorkshopScheduleSheetProps) {
  const isEdit = !!editWorkshop;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState(getLocalTimezone());
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [isLoading, setIsLoading] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<Workshop[]>([]);

  // Reset form when sheet opens
  useEffect(() => {
    if (!open) return;

    if (editWorkshop) {
      setTitle(editWorkshop.title);
      setDescription(editWorkshop.description);
      setCategory(editWorkshop.category);
      setTimezone(editWorkshop.timezone || getLocalTimezone());
      setLocation(editWorkshop.location || "");
      setMeetingUrl(editWorkshop.meetingUrl || "");
      setStatus(editWorkshop.status === "archived" ? "draft" : editWorkshop.status);

      if (editWorkshop.scheduledAt) {
        setDate(formatDateForInput(editWorkshop.scheduledAt));
        setStartTime(formatTimeForInput(editWorkshop.scheduledAt));
      } else {
        setDate("");
        setStartTime("");
      }
      if (editWorkshop.endTime) {
        setEndTime(formatTimeForInput(editWorkshop.endTime));
      } else {
        setEndTime("");
      }
    } else {
      // Create mode — pre-fill from slot click
      setTitle("");
      setDescription("");
      setCategory("");
      setTimezone(getLocalTimezone());
      setLocation("");
      setMeetingUrl("");
      setStatus("draft");

      if (initialDate) {
        setDate(formatDateForInput(initialDate));
        if (initialHour !== undefined) {
          const h = String(initialHour).padStart(2, "0");
          setStartTime(`${h}:00`);
          const endH = String(initialHour + 1).padStart(2, "0");
          setEndTime(`${endH}:00`);
        } else {
          setStartTime("");
          setEndTime("");
        }
      } else {
        setDate("");
        setStartTime("");
        setEndTime("");
      }
    }
  }, [open, editWorkshop, initialDate, initialHour]);

  function buildDates(): { scheduledAt: Date | undefined; endTimeDt: Date | undefined } {
    if (!date || !startTime) return { scheduledAt: undefined, endTimeDt: undefined };

    const scheduledAt = new Date(`${date}T${startTime}:00`);
    const endTimeDt = endTime ? new Date(`${date}T${endTime}:00`) : undefined;
    return { scheduledAt, endTimeDt };
  }

  async function handleSave(skipConflictCheck = false) {
    setIsLoading(true);

    try {
      const { scheduledAt, endTimeDt } = buildDates();

      // Check for conflicts if we have schedule data
      if (!skipConflictCheck && scheduledAt && endTimeDt) {
        const { data: conflicting } = await workshopsService.checkConflicts(
          scheduledAt,
          endTimeDt,
          editWorkshop?.id
        );
        if (conflicting && conflicting.length > 0) {
          setConflicts(conflicting);
          setConflictDialogOpen(true);
          setIsLoading(false);
          return;
        }
      }

      const workshopData = {
        title,
        description,
        category,
        status,
        scheduledAt,
        endTime: endTimeDt,
        timezone,
        location: location || undefined,
        meetingUrl: meetingUrl || undefined,
        sponsorOrgId: sponsorOrg.id,
        partnerName: sponsorOrg.name,
        partnerLogo: sponsorOrg.logo,
        isEvergreen: false,
        cohortIds: editWorkshop?.cohortIds || [],
      };

      let result;
      if (isEdit) {
        result = await workshopsService.update(editWorkshop!.id, workshopData);
      } else {
        result = await workshopsService.create(workshopData);
      }

      if (!result.success) {
        toast.error(result.error || `Failed to ${isEdit ? "update" : "create"} workshop`);
        return;
      }

      toast.success(isEdit ? "Workshop updated" : "Workshop created");
      onOpenChange(false);
      onSaved();
    } finally {
      setIsLoading(false);
    }
  }

  function handleConflictProceed() {
    setConflictDialogOpen(false);
    handleSave(true);
  }

  const canSubmit = title && category;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{isEdit ? "Edit Workshop" : "New Workshop"}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update workshop details and schedule."
                : "Create a new workshop session."}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-5"
          >
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="sheet-title" className="text-xs text-muted-foreground">
                Title *
              </Label>
              <Input
                id="sheet-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Workshop title..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <div className="max-h-[200px] overflow-y-auto rounded-md border">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe what participants will learn..."
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule section header */}
            <div className="pt-2">
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Schedule
              </h3>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="sheet-date" className="text-xs text-muted-foreground">
                Date
              </Label>
              <Input
                id="sheet-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Start & End Time — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sheet-start" className="text-xs text-muted-foreground">
                  Start Time
                </Label>
                <Input
                  id="sheet-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sheet-end" className="text-xs text-muted-foreground">
                  End Time
                </Label>
                <Input
                  id="sheet-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {commonTimezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {formatTimezoneLabel(tz)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location & Meeting URL */}
            <div className="space-y-1.5">
              <Label htmlFor="sheet-location" className="text-xs text-muted-foreground">
                Location
              </Label>
              <Input
                id="sheet-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Physical venue (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sheet-meeting" className="text-xs text-muted-foreground">
                Meeting URL
              </Label>
              <Input
                id="sheet-meeting"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "draft" | "published")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Create Workshop"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Conflict Warning Dialog */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Conflict</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  There are other events scheduled during this time slot:
                </p>
                <ul className="space-y-1.5">
                  {conflicts.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-medium text-foreground">
                        {c.title}
                      </span>
                      {c.scheduledAt && (
                        <span className="text-muted-foreground">
                          {" — "}
                          {c.scheduledAt.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                          {c.endTime && (
                            <>
                              {" – "}
                              {c.endTime.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </>
                          )}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  Are you sure you want to schedule your session in this time slot?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConflictProceed}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Schedule Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
