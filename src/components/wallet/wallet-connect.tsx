"use client";

import { useState, useEffect, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAuth } from "@/contexts/auth-context";
import { usersService } from "@/services";
import { Button } from "@/components/ui/button";
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
import { Wallet, Copy, Check, Loader2, Unplug } from "lucide-react";
import { toast } from "sonner";

export function WalletConnect() {
  const { user, refreshUser } = useAuth();
  const { primaryWallet, setShowAuthFlow, handleLogOut, sdkHasLoaded } =
    useDynamicContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletAddress = user?.walletAddress;

  // When Dynamic connects a wallet and user doesn't have one saved yet, bind it
  const bindWallet = useCallback(async () => {
    if (!user || !primaryWallet?.address || walletAddress) return;

    setIsConnecting(true);
    try {
      const address = primaryWallet.address;

      // Check if another user already has this wallet
      const existing = await usersService.getByWalletAddress(address);
      if (existing.data && existing.data.id !== user.id) {
        toast.error("This wallet is already connected to another account");
        await handleLogOut();
        return;
      }

      const result = await usersService.update(user.id, {
        walletAddress: address,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to connect wallet");
        await handleLogOut();
        return;
      }

      await refreshUser();
      toast.success("Wallet connected");
    } catch {
      toast.error("Failed to connect wallet");
      await handleLogOut();
    } finally {
      setIsConnecting(false);
    }
  }, [user, primaryWallet, walletAddress, handleLogOut, refreshUser]);

  // Watch for wallet connection from Dynamic
  useEffect(() => {
    if (primaryWallet?.address && !walletAddress && !isConnecting) {
      bindWallet();
    }
  }, [primaryWallet?.address, walletAddress, isConnecting, bindWallet]);

  const handleConnect = () => {
    setShowAuthFlow(true);
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setIsDisconnecting(true);
    try {
      const result = await usersService.update(user.id, {
        walletAddress: undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to disconnect wallet");
        return;
      }

      await handleLogOut();
      await refreshUser();
      toast.success("Wallet disconnected");
    } catch {
      toast.error("Failed to disconnect wallet");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!sdkHasLoaded) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading wallet SDK...
      </div>
    );
  }

  if (walletAddress) {
    return (
      <div className="flex items-center justify-between rounded-xl border py-3 px-4">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <div>
            <p className="font-mono text-sm">{truncateAddress(walletAddress)}</p>
            <p className="text-[11px] text-muted-foreground">Connected</p>
          </div>
          <button
            onClick={copyAddress}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect wallet?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the wallet from your account. You can reconnect
                it later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisconnect}>
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
