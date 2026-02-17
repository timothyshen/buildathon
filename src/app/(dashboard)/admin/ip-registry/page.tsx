"use client";

import { useState, useEffect } from "react";
import { ipAssetsService, submissionsService } from "@/services";
import { STORY_EXPLORER_URL } from "@/services/story-protocol/constants";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { IpAsset, Submission } from "@/types";
import Link from "next/link";

function truncateAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function AdminIpRegistryPage() {
  const [ipAssets, setIpAssets] = useState<(IpAsset & { submission?: Submission })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Computed stats
  const total = ipAssets.length;
  const derivatives = ipAssets.filter((a) => a.parentIpId).length;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await ipAssetsService.getAll();
        if (!res.success || res.data.length === 0) {
          setIpAssets([]);
          return;
        }

        // Enrich each IP asset with its submission title
        const enriched = await Promise.all(
          res.data.map(async (asset) => {
            const subRes = await submissionsService.getById(asset.submissionId);
            return {
              ...asset,
              submission: subRes.success ? subRes.data ?? undefined : undefined,
            };
          })
        );

        setIpAssets(enriched);
      } catch {
        toast.error("Failed to load IP assets");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/story-protocol/sync-royalties", { method: "POST" });
      const data = await res.json();
      toast.success(`Synced ${data.synced} IP assets`);
    } catch {
      toast.error("Failed to sync royalties");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "IP Registry" },
        ]}
      />
      <AdminNav />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IP Registry</h1>
          <p className="text-xs text-muted-foreground mt-1">
            All registered IP Assets across submissions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Royalties
        </Button>
      </div>

      {/* Stats Row */}
      {!isLoading && ipAssets.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="font-mono font-semibold tabular-nums">{total}</span>{" "}
            <span className="text-muted-foreground">IPs registered</span>
          </div>
          <div>
            <span className="font-mono font-semibold tabular-nums text-violet-600">
              {derivatives}
            </span>{" "}
            <span className="text-muted-foreground">derivatives</span>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : ipAssets.length === 0 ? (
        <div className="rounded-xl border py-12 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="text-sm mt-3">No IP assets registered</p>
          <p className="text-xs text-muted-foreground mt-1">
            IP assets will appear here once participants register their submissions.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-3 px-4 text-left font-medium">Submission</th>
                <th className="py-3 px-4 text-left font-medium">IP Asset ID</th>
                <th className="py-3 px-4 text-left font-medium hidden md:table-cell">
                  Owner
                </th>
                <th className="py-3 px-4 text-left font-medium">Derivatives</th>
                <th className="py-3 px-4 text-left font-medium hidden md:table-cell">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {ipAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/submissions/${asset.submissionId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {asset.submission?.title || "Untitled Submission"}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={`${STORY_EXPLORER_URL}/address/${asset.ipId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      {truncateAddress(asset.ipId)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs hidden md:table-cell">
                    {truncateAddress(asset.ownerAddress)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums">
                    {asset.parentIpId ? (
                      <span className="text-violet-600">Derivative</span>
                    ) : (
                      <span className="text-muted-foreground">Root</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(asset.registeredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
