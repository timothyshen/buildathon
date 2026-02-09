"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { tractionService } from "@/services";
import type { SubmissionTraction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ExternalLink, X } from "lucide-react";

const tractionConfigSchema = z.object({
  twitterHandle: z.string(),
  websiteUrl: z.string(),
  testnetContractAddress: z.string(),
  mainnetContractAddress: z.string(),
});

type TractionConfigFormData = z.infer<typeof tractionConfigSchema>;

interface TractionConfigFormProps {
  submissionId: string;
  traction: SubmissionTraction | null;
  onUpdate: (traction: SubmissionTraction) => void;
}

export function TractionConfigForm({
  submissionId,
  traction,
  onUpdate,
}: TractionConfigFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingGA, setIsConnectingGA] = useState(false);
  const [isDisconnectingGA, setIsDisconnectingGA] = useState(false);

  const isGAConnected = !!traction?.gaPropertyId;

  const handleConnectGA = async () => {
    setIsConnectingGA(true);
    try {
      const response = await fetch(`/api/traction/ga/authorize?submissionId=${submissionId}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to start Google Analytics connection");
        return;
      }

      window.location.href = data.authUrl;
    } catch {
      toast.error("Failed to connect Google Analytics");
    } finally {
      setIsConnectingGA(false);
    }
  };

  const handleDisconnectGA = async () => {
    setIsDisconnectingGA(true);
    const result = await tractionService.disconnectGA(submissionId);

    if (result.success) {
      toast.success("Google Analytics disconnected");
      if (traction) {
        onUpdate({
          ...traction,
          gaPropertyId: undefined,
          gaRefreshToken: undefined,
          gaConnectedAt: undefined,
          gaConnectedBy: undefined,
        });
      }
    } else {
      toast.error(result.error || "Failed to disconnect");
    }
    setIsDisconnectingGA(false);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TractionConfigFormData>({
    resolver: zodResolver(tractionConfigSchema),
    defaultValues: {
      twitterHandle: traction?.twitterHandle || "",
      websiteUrl: traction?.websiteUrl || "",
      testnetContractAddress: traction?.testnetContractAddress || "",
      mainnetContractAddress: traction?.mainnetContractAddress || "",
    },
  });

  const onSubmit = async (data: TractionConfigFormData) => {
    setIsSaving(true);

    const twitterHandle = data.twitterHandle.replace(/^@/, "");

    const result = await tractionService.upsertTraction(submissionId, {
      twitterHandle: twitterHandle || undefined,
      websiteUrl: data.websiteUrl || undefined,
      testnetContractAddress: data.testnetContractAddress || undefined,
      mainnetContractAddress: data.mainnetContractAddress || undefined,
    });

    if (result.success) {
      toast.success("Configuration saved");
      onUpdate(result.data);
    } else {
      toast.error(result.error || "Failed to save");
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Google Analytics */}
      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Google Analytics
        </h2>

        {isGAConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-emerald-600 font-medium">Connected</span>
              <span className="text-xs text-muted-foreground font-mono">
                {traction?.gaPropertyId}
              </span>
            </div>
            {traction?.gaConnectedAt && (
              <p className="text-[11px] text-muted-foreground">
                Connected {new Date(traction.gaConnectedAt).toLocaleDateString()}
              </p>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Google Analytics?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the Google Analytics connection. You can reconnect at any time.
                    Existing metrics data will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnectGA}
                    disabled={isDisconnectingGA}
                  >
                    {isDisconnectingGA ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      "Disconnect"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Connect your Google Analytics 4 property to automatically pull website traffic metrics.
            </p>
            <Button
              onClick={handleConnectGA}
              disabled={isConnectingGA}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              {isConnectingGA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Connect Google Analytics
                </>
              )}
            </Button>
          </div>
        )}
      </section>

      {/* Project Links */}
      <section className="rounded-xl border p-5 space-y-5">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Project Links
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Twitter */}
          <div className="space-y-1.5">
            <Label htmlFor="twitterHandle" className="text-xs text-muted-foreground">
              Twitter Handle
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                @
              </span>
              <Input
                id="twitterHandle"
                {...register("twitterHandle")}
                placeholder="yourproject"
                className="rounded-l-none"
              />
            </div>
            {errors.twitterHandle && (
              <p className="text-xs text-destructive">{errors.twitterHandle.message}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl" className="text-xs text-muted-foreground">
              Website URL
            </Label>
            <Input
              id="websiteUrl"
              {...register("websiteUrl")}
              placeholder="https://yourproject.com"
            />
            {errors.websiteUrl && (
              <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>
            )}
          </div>

          {/* Contract Addresses */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Story Protocol Contracts
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="testnetContractAddress" className="text-xs text-muted-foreground">
                Testnet
              </Label>
              <Input
                id="testnetContractAddress"
                {...register("testnetContractAddress")}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mainnetContractAddress" className="text-xs text-muted-foreground">
                Mainnet
              </Label>
              <Input
                id="mainnetContractAddress"
                {...register("mainnetContractAddress")}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
