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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Twitter, Globe, FileCode, BarChart3, Check, X, ExternalLink } from "lucide-react";

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

      // Redirect to Google OAuth
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
      // Update local state by clearing GA fields
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

    // Strip @ from twitter handle if present
    const twitterHandle = data.twitterHandle.replace(/^@/, "");

    const result = await tractionService.upsertTraction(submissionId, {
      twitterHandle: twitterHandle || undefined,
      websiteUrl: data.websiteUrl || undefined,
      testnetContractAddress: data.testnetContractAddress || undefined,
      mainnetContractAddress: data.mainnetContractAddress || undefined,
    });

    if (result.success) {
      toast.success("Traction config saved");
      onUpdate(result.data);
    } else {
      toast.error(result.error || "Failed to save");
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Google Analytics Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Connect Google Analytics to automatically track website metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGAConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Connected</span>
                <span className="text-muted-foreground">
                  Property: {traction?.gaPropertyId}
                </span>
              </div>
              {traction?.gaConnectedAt && (
                <p className="text-xs text-muted-foreground">
                  Connected on {new Date(traction.gaConnectedAt).toLocaleDateString()}
                </p>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <X className="mr-2 h-4 w-4" />
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
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google Analytics 4 property to automatically pull website traffic metrics.
              </p>
              <Button
                onClick={handleConnectGA}
                disabled={isConnectingGA}
                variant="outline"
              >
                {isConnectingGA ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect Google Analytics
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Links */}
      <Card>
        <CardHeader>
          <CardTitle>Project Links</CardTitle>
          <CardDescription>
            Connect your project&apos;s social and blockchain presence for automated tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="twitterHandle" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter Handle
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
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
              <p className="text-sm text-red-500">{errors.twitterHandle.message}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website URL
            </Label>
            <Input
              id="websiteUrl"
              {...register("websiteUrl")}
              placeholder="https://yourproject.com"
            />
            {errors.websiteUrl && (
              <p className="text-sm text-red-500">{errors.websiteUrl.message}</p>
            )}
          </div>

          {/* Contract Addresses */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Story Protocol Contract Addresses
            </Label>

            <div className="space-y-2">
              <Label htmlFor="testnetContractAddress" className="text-sm text-muted-foreground">
                Testnet
              </Label>
              <Input
                id="testnetContractAddress"
                {...register("testnetContractAddress")}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainnetContractAddress" className="text-sm text-muted-foreground">
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

          <Button type="submit" disabled={isSaving || !isDirty}>
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
      </CardContent>
    </Card>
    </div>
  );
}
