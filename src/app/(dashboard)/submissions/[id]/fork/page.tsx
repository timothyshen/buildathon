"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { submissionsService, ipAssetsService } from "@/services";
import { registerDerivativeIp, recordDerivative } from "@/services/story-protocol/derivatives";
import { SPG_NFT_CONTRACT, getIpExplorerUrl } from "@/services/story-protocol/constants";
import { StepIP } from "@/app/(dashboard)/submit/components/step-ip";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, GitFork, ExternalLink, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Submission, IpAsset, IpLicenseTerms, PilTermsFormValues, PilPreset } from "@/types";

type ForkStatus = "idle" | "creating" | "uploading" | "signing" | "confirming" | "recording" | "done" | "error";

interface ForkPageProps {
  params: Promise<{ id: string }>;
}

export default function ForkPage({ params }: ForkPageProps) {
  const { id: parentId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { primaryWallet } = useDynamicContext();

  // Parent data
  const [parentSubmission, setParentSubmission] = useState<Submission | null>(null);
  const [parentIpAsset, setParentIpAsset] = useState<IpAsset | null>(null);
  const [parentLicenseTerms, setParentLicenseTerms] = useState<IpLicenseTerms[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fork form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pilTerms, setPilTerms] = useState<PilTermsFormValues | null>(null);
  const [pilPreset, setPilPreset] = useState<PilPreset | null>(null);

  // Submission state
  const [forkStatus, setForkStatus] = useState<ForkStatus>("idle");
  const [forkError, setForkError] = useState<string | null>(null);

  // Load parent submission and IP data
  useEffect(() => {
    async function loadParent() {
      if (!user || authLoading) return;

      const { data: submissionData } = await submissionsService.getById(parentId);

      if (!submissionData) {
        setIsLoading(false);
        return;
      }

      // Cannot fork your own submission
      const isTeamMember = submissionData.team?.members.some((m) => m.userId === user.id);
      const isSoloOwner = !submissionData.teamId && submissionData.createdBy === user.id;
      if (isTeamMember || isSoloOwner) {
        toast.error("You cannot fork your own submission");
        router.push(`/submissions/${parentId}`);
        return;
      }

      // Must have IP registered
      if (!submissionData.ipAssetId) {
        toast.error("This submission has no registered IP to fork");
        router.push(`/submissions/${parentId}`);
        return;
      }

      setParentSubmission(submissionData);
      setTitle(`Fork of ${submissionData.title}`);
      setDescription(
        `A derivative project based on "${submissionData.title}". Built upon the original work with additional features and modifications.`
      );

      // Load IP asset and license terms
      const ipResult = await ipAssetsService.getBySubmissionId(submissionData.id);
      if (ipResult.success && ipResult.data) {
        setParentIpAsset(ipResult.data);
        const termsResult = await ipAssetsService.getLicenseTerms(ipResult.data.id);
        if (termsResult.success) {
          setParentLicenseTerms(termsResult.data);
        }
      }

      setIsLoading(false);
    }
    loadParent();
  }, [parentId, user, authLoading, router]);

  const handleStepIpChange = useCallback((field: string, value: unknown) => {
    if (field === "pilTerms") setPilTerms(value as PilTermsFormValues | null);
    if (field === "pilPreset") setPilPreset(value as PilPreset | null);
  }, []);

  const handleSubmitFork = async () => {
    if (!parentSubmission || !parentIpAsset || !user || !primaryWallet) return;

    if (!isEthereumWallet(primaryWallet)) {
      toast.error("Please connect an Ethereum wallet first");
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (parentLicenseTerms.length === 0) {
      toast.error("Parent IP has no license terms to fork under");
      return;
    }

    try {
      setForkStatus("creating");
      setForkError(null);

      // Step 1: Create new submission
      const submissionResult = await submissionsService.create({
        cohortId: parentSubmission.cohortId,
        createdBy: user.id,
        title: title.trim(),
        description: description.trim(),
        screenshots: [],
        techStack: parentSubmission.techStack || [],
        builtWithStory: true,
        status: "draft",
        forkedFromSubmissionId: parentSubmission.id,
      });

      if (!submissionResult.success || !submissionResult.data) {
        throw new Error(submissionResult.error || "Failed to create fork submission");
      }

      const newSubmission = submissionResult.data;

      // Step 2: Upload metadata to IPFS
      setForkStatus("uploading");
      const metadataResponse = await fetch("/api/story-protocol/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          description: description.trim(),
          image: parentSubmission.logoUrl || "",
          attributes: [
            { key: "Fork of", value: parentSubmission.title },
            { key: "Parent IP", value: parentIpAsset.ipId },
            { key: "Tech Stack", value: (parentSubmission.techStack || []).join(", ") },
          ].filter((a) => a.value),
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      const metadata = (await metadataResponse.json()) as {
        ipMetadataURI: string;
        ipMetadataHash: string;
        nftMetadataURI: string;
        nftMetadataHash: string;
      };

      // Step 3: Register derivative IP on-chain
      setForkStatus("signing");
      const walletClient = (await primaryWallet.getWalletClient()) as unknown as import("viem").WalletClient;

      const parentTermsId = parentLicenseTerms[0].licenseTermsId;

      setForkStatus("confirming");
      const derivResult = await registerDerivativeIp(
        walletClient,
        parentIpAsset.ipId,
        parentTermsId,
        metadata,
        parentLicenseTerms[0].defaultMintingFee
      );

      // Step 4: Record in DB
      setForkStatus("recording");
      const licenseTermsForRecord: Record<string, unknown> = pilTerms
        ? { ...pilTerms }
        : {
            commercialUse: parentLicenseTerms[0].commercialUse,
            commercialAttribution: parentLicenseTerms[0].commercialAttribution,
            commercialRevShare: parentLicenseTerms[0].commercialRevShare,
            defaultMintingFee: parentLicenseTerms[0].defaultMintingFee,
            derivativesAllowed: parentLicenseTerms[0].derivativesAllowed,
            derivativesAttribution: parentLicenseTerms[0].derivativesAttribution,
            derivativesReciprocal: parentLicenseTerms[0].derivativesReciprocal,
            derivativesApproval: parentLicenseTerms[0].derivativesApproval,
            transferable: parentLicenseTerms[0].transferable,
            expiration: parentLicenseTerms[0].expiration,
          };

      await recordDerivative({
        parentSubmissionId: parentSubmission.id,
        childSubmissionId: newSubmission.id,
        childIpId: derivResult.childIpId,
        tokenId: derivResult.tokenId,
        txHash: derivResult.txHash,
        nftContract: SPG_NFT_CONTRACT,
        ownerAddress: walletClient.account?.address || "",
        parentIpId: parentIpAsset.ipId,
        metadataUri: metadata.ipMetadataURI,
        metadataHash: metadata.ipMetadataHash,
        licenseTermsId: parentTermsId,
        licenseTerms: licenseTermsForRecord,
      });

      setForkStatus("done");
      toast.success("Fork created and derivative IP registered!");

      // Redirect to the new submission
      setTimeout(() => {
        router.push(`/submissions/${newSubmission.id}`);
      }, 1000);
    } catch (err) {
      setForkStatus("error");
      const message = err instanceof Error ? err.message : "Fork failed";
      setForkError(message);
      toast.error(message);
    }
  };

  const statusMessages: Record<ForkStatus, string> = {
    idle: "",
    creating: "Creating fork submission...",
    uploading: "Uploading metadata to IPFS...",
    signing: "Please sign the transaction in your wallet...",
    confirming: "Confirming transaction on-chain...",
    recording: "Recording derivative registration...",
    done: "Fork created successfully!",
    error: forkError || "Fork failed",
  };

  const isProcessing =
    forkStatus === "creating" ||
    forkStatus === "uploading" ||
    forkStatus === "signing" ||
    forkStatus === "confirming" ||
    forkStatus === "recording";

  // Build parent license summary
  const parentLicenseSummary =
    parentLicenseTerms.length > 0
      ? parentLicenseTerms[0].commercialUse
        ? parentLicenseTerms[0].derivativesAllowed
          ? "Commercial Remix"
          : "Commercial Use"
        : parentLicenseTerms[0].derivativesAllowed
          ? "Non-Commercial Remix"
          : "Non-Commercial"
      : "Unknown";

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!parentSubmission || !parentIpAsset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          Unable to load the parent submission for forking.
        </p>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/submissions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Submissions", href: "/submissions" },
          { label: parentSubmission.title, href: `/submissions/${parentId}` },
          { label: "Fork" },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <GitFork className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fork Project</h1>
            <p className="text-sm text-muted-foreground">
              Create a derivative of &ldquo;{parentSubmission.title}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Parent IP Info */}
      <section className="rounded-xl border p-5 space-y-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Parent IP Asset
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Project</span>
            <Link
              href={`/submissions/${parentId}`}
              className="text-xs font-medium hover:underline"
            >
              {parentSubmission.title}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">IP Asset ID</span>
            <a
              href={getIpExplorerUrl(parentIpAsset.ipId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-blue-500 hover:underline inline-flex items-center gap-1"
            >
              {parentIpAsset.ipId.slice(0, 10)}...{parentIpAsset.ipId.slice(-8)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">License</span>
            <span className="text-xs">{parentLicenseSummary}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Registered</span>
            <span className="text-xs">
              {parentIpAsset.registeredAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      {/* Fork Details Form */}
      <section className="rounded-xl border p-5 space-y-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Fork Details
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="fork-title" className="text-xs text-muted-foreground">
            Title *
          </Label>
          <Input
            id="fork-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your fork"
            disabled={isProcessing}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fork-description" className="text-xs text-muted-foreground">
            Description *
          </Label>
          <Textarea
            id="fork-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you're building on top of the original"
            rows={4}
            disabled={isProcessing}
          />
        </div>
      </section>

      {/* License Terms */}
      <section className="rounded-xl border p-5">
        <StepIP
          data={{ pilTerms, pilPreset }}
          onChange={handleStepIpChange}
        />
      </section>

      {/* Status Feedback */}
      {forkStatus !== "idle" && (
        <div className="flex items-center gap-3 rounded-xl border p-4">
          {forkStatus === "error" ? (
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          ) : forkStatus === "done" ? (
            <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
          <p
            className={`text-sm ${
              forkStatus === "error"
                ? "text-destructive"
                : forkStatus === "done"
                  ? "text-emerald-600"
                  : "text-muted-foreground"
            }`}
          >
            {statusMessages[forkStatus]}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="ghost" asChild disabled={isProcessing}>
          <Link href={`/submissions/${parentId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        <Button
          onClick={handleSubmitFork}
          disabled={!primaryWallet || isProcessing || forkStatus === "done"}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Forking...
            </>
          ) : forkStatus === "done" ? (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Done
            </>
          ) : (
            <>
              <GitFork className="h-4 w-4 mr-2" />
              Fork & Register Derivative
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
