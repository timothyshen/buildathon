"use client";

import { useState, useCallback } from "react";
import type { Submission, PilTermsFormValues } from "@/types";
import { registerSubmissionAsIp, recordRegistration } from "@/services/story-protocol/ip-registration";
import { SPG_NFT_CONTRACT } from "@/services/story-protocol/constants";
import type { WalletClient } from "viem";

type RegistrationStatus = "idle" | "uploading" | "signing" | "confirming" | "recording" | "done" | "error";

export function useIpRegistration() {
  const [status, setStatus] = useState<RegistrationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ipId: string; txHash: string } | null>(null);

  const register = useCallback(
    async (
      walletClient: WalletClient,
      submission: Submission,
      licenseTerms: PilTermsFormValues
    ) => {
      try {
        setStatus("uploading");
        setError(null);

        setStatus("signing");
        const regResult = await registerSubmissionAsIp(
          walletClient,
          submission,
          licenseTerms
        );

        setStatus("recording");
        await recordRegistration({
          submissionId: submission.id,
          ipId: regResult.ipId,
          tokenId: regResult.tokenId,
          txHash: regResult.txHash,
          nftContract: SPG_NFT_CONTRACT,
          ownerAddress: walletClient.account?.address || "",
          metadataUri: "",
          metadataHash: "",
          licenseTermsId: regResult.licenseTermsIds[0] || "",
          licenseTerms,
        });

        setStatus("done");
        setResult({ ipId: regResult.ipId, txHash: regResult.txHash });
        return regResult;
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Registration failed");
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return { register, status, error, result, reset };
}
