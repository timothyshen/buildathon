"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSponsorSchema, type InviteSponsorFormData } from "@/lib/schemas";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SponsorOrg } from "@/types";

interface InviteSponsorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InviteSponsorFormData) => void;
  defaultSponsor?: SponsorOrg;
  sponsorOrgs: SponsorOrg[];
}

export function InviteSponsorForm({
  open,
  onOpenChange,
  onSubmit,
  defaultSponsor,
  sponsorOrgs,
}: InviteSponsorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<InviteSponsorFormData>({
    resolver: zodResolver(inviteSponsorSchema),
    defaultValues: {
      email: defaultSponsor?.contactEmail || "",
      name: defaultSponsor?.contactName || "",
      sponsorId: defaultSponsor?.id || "",
    },
  });

  // Reset form values when dialog opens with different sponsor
  useEffect(() => {
    if (open) {
      reset({
        email: defaultSponsor?.contactEmail || "",
        name: defaultSponsor?.contactName || "",
        sponsorId: defaultSponsor?.id || "",
      });
    }
  }, [open, defaultSponsor, reset]);

  const onFormSubmit = (data: InviteSponsorFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Sponsor User</DialogTitle>
          <DialogDescription>
            Assign the sponsor role to an existing user by their email address
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sponsorId" className="text-xs text-muted-foreground">Sponsor Organization *</Label>
            {defaultSponsor ? (
              <p className="text-sm font-medium py-2">{defaultSponsor.name}</p>
            ) : (
              <Select
                value={watch("sponsorId")}
                onValueChange={(value) => setValue("sponsorId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {sponsorOrgs.map((sponsor) => (
                    <SelectItem key={sponsor.id} value={sponsor.id}>
                      {sponsor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.sponsorId && (
              <p className="text-xs text-destructive">{errors.sponsorId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs text-muted-foreground">Name *</Label>
            <Input id="name" {...register("name")} placeholder="John Doe" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email *</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90">Assign Sponsor Role</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
