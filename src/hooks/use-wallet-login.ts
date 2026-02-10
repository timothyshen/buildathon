"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createClient } from "@/lib/supabase/client";

interface WalletLoginResult {
  connectWallet: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useWalletLogin(
  onSuccess: () => void
): WalletLoginResult {
  const { primaryWallet, setShowAuthFlow, handleLogOut } =
    useDynamicContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptingLoginRef = useRef(false);

  const connectWallet = useCallback(() => {
    setError(null);
    attemptingLoginRef.current = true;
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  // Watch for wallet connection then attempt login
  useEffect(() => {
    if (!primaryWallet?.address || !attemptingLoginRef.current) return;

    let cancelled = false;

    async function attemptLogin(address: string) {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/wallet-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          if (data.error === "NO_ACCOUNT") {
            setError(
              "No account found with this wallet. Register with email first, then connect your wallet in Settings."
            );
          } else {
            setError(data.message || "Login failed");
          }
          await handleLogOut();
          attemptingLoginRef.current = false;
          return;
        }

        // Verify OTP to complete Supabase auth
        const supabase = createClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (cancelled) return;

        if (verifyError) {
          setError("Authentication failed. Please try again.");
          await handleLogOut();
          attemptingLoginRef.current = false;
          return;
        }

        attemptingLoginRef.current = false;
        onSuccess();
      } catch {
        if (!cancelled) {
          setError("Network error. Please try again.");
          await handleLogOut();
          attemptingLoginRef.current = false;
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    attemptLogin(primaryWallet.address);

    return () => {
      cancelled = true;
    };
  }, [primaryWallet?.address, handleLogOut, onSuccess]);

  // Clean up Dynamic session on unmount if login wasn't completed
  useEffect(() => {
    return () => {
      if (attemptingLoginRef.current) {
        handleLogOut();
      }
    };
  }, [handleLogOut]);

  return { connectWallet, isLoading, error };
}
