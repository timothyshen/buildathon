"use client";

import { use, useState, useEffect, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { submissionsService, ipAssetsService } from "@/services";
import type { DerivativeWithSubmission } from "@/services/ip-assets.service";
import type {
  Submission,
  IpAsset,
  IpLicenseTerms,
  RoyaltySnapshot,
} from "@/types";
import { claimAllRevenue } from "@/services/story-protocol/royalties";
import {
  getIpExplorerUrl,
  getTxExplorerUrl,
} from "@/services/story-protocol/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Coins,
  GitFork,
  ExternalLink,
  Loader2,
  Info,
  ArrowLeft,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface IpDetailPageProps {
  params: Promise<{ id: string }>;
}

function truncateAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatWip(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function deriveLicenseLabel(terms: IpLicenseTerms): string {
  if (terms.commercialUse && terms.derivativesAllowed) {
    return `Commercial Remix (${terms.commercialRevShare}%)`;
  } else if (terms.commercialUse) {
    return "Commercial Use";
  } else if (terms.derivativesAllowed) {
    return "Non-Commercial Remix";
  }
  return "Non-Commercial";
}

const licenseDescriptions: Record<
  string,
  { summary: string; permissions: string[]; restrictions: string[] }
> = {
  "Non-Commercial Remix": {
    summary: "Free to remix, no commercial use.",
    permissions: [
      "Remix and create derivatives",
      "Attribution required",
      "Derivatives must use same terms",
    ],
    restrictions: ["No commercial use", "No minting fee"],
  },
  "Commercial Use": {
    summary: "Licensed for commercial use, no derivatives.",
    permissions: ["Commercial use allowed", "Transferable license"],
    restrictions: [
      "No derivatives or remixes",
      "Minting fee required (1 WIP)",
    ],
  },
  "Commercial Remix": {
    summary: "Commercial use with remix rights and revenue sharing.",
    permissions: [
      "Commercial use allowed",
      "Remix and create derivatives",
      "Transferable license",
    ],
    restrictions: [
      "Revenue share to original creator",
      "Minting fee required (1 WIP)",
      "Attribution required",
    ],
  },
  "CC Attribution": {
    summary: "Free to use commercially and remix with attribution.",
    permissions: [
      "Commercial use allowed",
      "Free to remix",
      "No minting fee",
      "Transferable license",
    ],
    restrictions: ["Attribution required", "Derivatives must use same terms"],
  },
};

export default function IpDetailPage({ params }: IpDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { primaryWallet } = useDynamicContext();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [ipAsset, setIpAsset] = useState<IpAsset | null>(null);
  const [licenseTerms, setLicenseTerms] = useState<IpLicenseTerms[]>([]);
  const [derivatives, setDerivatives] = useState<DerivativeWithSubmission[]>(
    []
  );
  const [snapshot, setSnapshot] = useState<RoyaltySnapshot | null>(null);
  const [snapshots, setSnapshots] = useState<RoyaltySnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const walletAddress = user?.walletAddress;
  const isWalletOwner =
    walletAddress && ipAsset
      ? ipAsset.ownerAddress.toLowerCase() === walletAddress.toLowerCase()
      : false;
  const isTeamSubmission = !!submission?.team;

  // Resolve the registrant name from team members by matching wallet address
  const registrantMember =
    isTeamSubmission && ipAsset
      ? submission.team?.members.find(
          (m) =>
            m.user.walletAddress?.toLowerCase() ===
            ipAsset.ownerAddress.toLowerCase()
        )
      : null;
  const registrantName = registrantMember?.user.name;

  useEffect(() => {
    async function loadData() {
      if (!user || authLoading) return;

      const { data: submissionData } =
        await submissionsService.getById(id);

      if (!submissionData) {
        setIsLoading(false);
        return;
      }

      // Verify access: team member, solo owner, or admin
      const isTeamMember = submissionData.team?.members.some(
        (m) => m.userId === user.id
      );
      const isSoloOwner =
        !submissionData.teamId && submissionData.createdBy === user.id;
      const isAdmin = user.role === "admin";
      if (!isTeamMember && !isSoloOwner && !isAdmin) {
        router.push("/submissions");
        return;
      }

      setSubmission(submissionData);

      // Load IP asset data
      const ipRes = await ipAssetsService.getBySubmissionId(id);
      if (!ipRes.success || !ipRes.data) {
        setIsLoading(false);
        return;
      }

      const asset = ipRes.data;
      setIpAsset(asset);

      // Load all related data in parallel
      const [termsRes, derivRes, snapshotRes, snapshotsRes] =
        await Promise.all([
          ipAssetsService.getLicenseTerms(asset.id),
          ipAssetsService.getDerivativesWithSubmissions(asset.ipId),
          ipAssetsService.getLatestRoyaltySnapshot(asset.id),
          ipAssetsService.getRoyaltySnapshots(asset.id),
        ]);

      if (termsRes.success) setLicenseTerms(termsRes.data);
      if (derivRes.success) setDerivatives(derivRes.data);
      if (snapshotRes.success) setSnapshot(snapshotRes.data);
      if (snapshotsRes.success) setSnapshots(snapshotsRes.data);

      setIsLoading(false);
    }
    loadData();
  }, [id, user, authLoading, router]);

  const handleClaim = useCallback(async () => {
    if (!primaryWallet || !ipAsset || !walletAddress) return;
    if (!isEthereumWallet(primaryWallet)) {
      toast.error("Please connect an Ethereum wallet");
      return;
    }

    setIsClaiming(true);
    try {
      const walletClient =
        (await primaryWallet.getWalletClient()) as unknown as import("viem").WalletClient;

      const childIpIds = derivatives.map((d) => d.ipId);

      await claimAllRevenue(
        walletClient,
        ipAsset.ipId,
        walletAddress,
        childIpIds
      );

      toast.success("Revenue claimed successfully!");

      // Refresh snapshot
      const snapshotRes = await ipAssetsService.getLatestRoyaltySnapshot(
        ipAsset.id
      );
      if (snapshotRes.success) setSnapshot(snapshotRes.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to claim revenue";
      toast.error(message);
    } finally {
      setIsClaiming(false);
    }
  }, [primaryWallet, ipAsset, walletAddress, derivatives]);

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    notFound();
  }

  // No IP registered
  if (!ipAsset) {
    return (
      <div className="space-y-8">
        <Breadcrumb
          items={[
            { label: "Submissions", href: "/submissions" },
            {
              label: submission.title,
              href: `/submissions/${submission.id}`,
            },
            { label: "IP Dashboard" },
          ]}
          showHome={false}
        />
        <div className="rounded-xl border py-12 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="text-sm mt-3">No IP registered for this project</p>
          <p className="text-xs text-muted-foreground mt-1">
            Register IP on the submission detail page to view license and
            royalty data.
          </p>
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link href={`/submissions/${submission.id}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to Submission
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const terms = licenseTerms[0];
  const licenseLabel = terms ? deriveLicenseLabel(terms) : "No license";
  const licenseInfo =
    licenseDescriptions[licenseLabel.replace(/ \(\d+%\)$/, "")];
  const claimable = parseFloat(snapshot?.claimableWip || "0");
  const revenue = parseFloat(snapshot?.totalRevenueWip || "0");
  const derivativeCount = snapshot?.derivativeCount || derivatives.length;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Submissions", href: "/submissions" },
          {
            label: submission.title,
            href: `/submissions/${submission.id}`,
          },
          { label: "IP Dashboard" },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-violet-500 shrink-0" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {submission.title}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            IP registration and royalty management
          </p>
        </div>
        {isWalletOwner && claimable > 0 && (
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="bg-foreground text-background hover:bg-foreground/90 shrink-0"
          >
            {isClaiming ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Coins className="h-4 w-4 mr-2" />
            )}
            Claim {formatWip(claimable.toString())} WIP
          </Button>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[120px]">
          <Coins className="h-4 w-4 text-emerald-500" />
          <div>
            <div className="text-3xl font-mono font-bold tabular-nums text-emerald-600">
              {formatWip(revenue.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Revenue (WIP)
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[120px]">
          <Coins className="h-4 w-4 text-amber-500" />
          <div>
            <div className="text-3xl font-mono font-bold tabular-nums text-amber-600">
              {formatWip(claimable.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Claimable (WIP)
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[120px]">
          <GitFork className="h-4 w-4 text-violet-500" />
          <div>
            <div className="text-3xl font-mono font-bold tabular-nums text-violet-600">
              {derivativeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              License Holders
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-6 flex flex-col justify-between min-h-[120px]">
          <Shield className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-3xl font-mono font-bold tabular-nums text-blue-600">
              {snapshot?.royaltyTokenBalance ?? 100}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Royalty Token Share
            </p>
          </div>
        </div>
      </div>

      {/* Team claimer info — always shown for team submissions */}
      {isTeamSubmission && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          isWalletOwner
            ? "border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200"
            : "border-border bg-muted/30 text-muted-foreground"
        }`}>
          <Wallet className="h-4 w-4 shrink-0" />
          <p className="flex-1">
            {isWalletOwner ? (
              "You are the IP registrant. Only your wallet can claim royalties."
            ) : registrantName ? (
              <>
                <span className="font-medium text-foreground">{registrantName}</span> registered this IP and is the designated claimer.
                Revenue distribution among team members happens off-chain.
              </>
            ) : (
              <>
                Registered by wallet{" "}
                <span className="font-mono text-xs">{truncateAddress(ipAsset.ownerAddress)}</span>.
                Only the registrant&apos;s wallet can claim royalties.
              </>
            )}
          </p>
        </div>
      )}

      {/* Solo submission — no wallet connected */}
      {!isTeamSubmission && !isWalletOwner && claimable > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
          <Wallet className="h-4 w-4 shrink-0" />
          <p>
            {walletAddress
              ? "The connected wallet does not own this IP asset. Connect the registering wallet to claim."
              : "Connect a wallet in Settings to claim revenue."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 col) */}
        <div className="lg:col-span-2 space-y-8">
          {/* License Holders (Derivatives) */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
              License Holders
            </h2>

            {derivatives.length === 0 ? (
              <div className="rounded-xl border py-8 text-center">
                <GitFork className="mx-auto h-6 w-6 text-muted-foreground opacity-50" />
                <p className="text-sm mt-2">No forks yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  When others fork your project, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {derivatives.map((deriv) => (
                  <div
                    key={deriv.id}
                    className="rounded-xl border py-3 px-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/submissions/${deriv.submissionId}`}
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {deriv.submissionTitle}
                        </Link>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {truncateAddress(deriv.ownerAddress)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {deriv.registeredAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a
                        href={getIpExplorerUrl(deriv.ipId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
                      >
                        {truncateAddress(deriv.ipId)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Revenue History */}
          {snapshots.length > 1 && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
                Revenue History
              </h2>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left text-[11px] text-muted-foreground font-medium px-4 py-2">
                        Date
                      </th>
                      <th className="text-right text-[11px] text-muted-foreground font-medium px-4 py-2">
                        Revenue (WIP)
                      </th>
                      <th className="text-right text-[11px] text-muted-foreground font-medium px-4 py-2 hidden md:table-cell">
                        Claimable (WIP)
                      </th>
                      <th className="text-right text-[11px] text-muted-foreground font-medium px-4 py-2 hidden md:table-cell">
                        Derivatives
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snap) => (
                      <tr
                        key={snap.id}
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {snap.snapshotAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-mono tabular-nums text-emerald-600">
                          {formatWip(snap.totalRevenueWip)}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-mono tabular-nums text-amber-600 hidden md:table-cell">
                          {formatWip(snap.claimableWip)}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-mono tabular-nums hidden md:table-cell">
                          {snap.derivativeCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* IP Asset Info */}
          <section className="rounded-xl border p-5 space-y-3">
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              IP Asset
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  IP ID
                </span>
                <div className="flex items-center gap-1">
                  <a
                    href={getIpExplorerUrl(ipAsset.ipId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-500 hover:underline"
                  >
                    {truncateAddress(ipAsset.ipId)}
                  </a>
                  <button
                    onClick={() => handleCopy(ipAsset.ipId, "ipId")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "ipId" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isTeamSubmission ? "Registrant" : "Owner"}
                </span>
                <div className="flex items-center gap-1">
                  {registrantName && (
                    <span className="text-xs mr-1">{registrantName}</span>
                  )}
                  <span className="text-xs font-mono text-muted-foreground">
                    {truncateAddress(ipAsset.ownerAddress)}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(ipAsset.ownerAddress, "owner")
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "owner" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Registered
                </span>
                <span className="text-xs">
                  {ipAsset.registeredAt.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Transaction
                </span>
                <a
                  href={getTxExplorerUrl(ipAsset.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-500 hover:underline"
                >
                  {ipAsset.txHash.slice(0, 10)}...
                </a>
              </div>
              {ipAsset.metadataUri && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Metadata
                  </span>
                  <a
                    href={ipAsset.metadataUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                  >
                    IPFS
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* License Terms */}
          {terms && (
            <section className="rounded-xl border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  License Terms
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs inline-flex items-center gap-1 cursor-help">
                        {licenseLabel}
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    {licenseInfo ? (
                      <TooltipContent
                        side="left"
                        className="max-w-[260px] p-3 space-y-2"
                      >
                        <p className="font-medium text-xs">
                          {licenseInfo.summary}
                        </p>
                        <div>
                          <p className="text-[10px] text-emerald-300 font-medium mb-0.5">
                            Allowed
                          </p>
                          <ul className="text-[10px] space-y-0.5">
                            {licenseInfo.permissions.map((p) => (
                              <li key={p}>+ {p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-300 font-medium mb-0.5">
                            Conditions
                          </p>
                          <ul className="text-[10px] space-y-0.5">
                            {licenseInfo.restrictions.map((r) => (
                              <li key={r}>- {r}</li>
                            ))}
                          </ul>
                        </div>
                      </TooltipContent>
                    ) : (
                      <TooltipContent side="left">
                        <p className="text-xs">Custom license terms</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Commercial Use
                  </span>
                  <span className="text-xs">
                    {terms.commercialUse ? (
                      <span className="text-emerald-600">Yes</span>
                    ) : (
                      "No"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Derivatives
                  </span>
                  <span className="text-xs">
                    {terms.derivativesAllowed ? (
                      <span className="text-emerald-600">Yes</span>
                    ) : (
                      "No"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Attribution
                  </span>
                  <span className="text-xs">
                    {terms.derivativesAttribution ? "Required" : "Not required"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Reciprocal
                  </span>
                  <span className="text-xs">
                    {terms.derivativesReciprocal ? "Yes" : "No"}
                  </span>
                </div>
                {terms.commercialRevShare > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Rev Share
                    </span>
                    <span className="text-xs font-mono">
                      {terms.commercialRevShare}%
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Minting Fee
                  </span>
                  <span className="text-xs font-mono">
                    {terms.defaultMintingFee} WIP
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Transferable
                  </span>
                  <span className="text-xs">
                    {terms.transferable ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Terms ID
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {terms.licenseTermsId}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
