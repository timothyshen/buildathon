"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2 } from "lucide-react";

interface InviteInfo {
  orgName: string;
  orgLogo: string | null;
  restrictedEmail: string | null;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [isValidatingInvite, setIsValidatingInvite] = useState(!!inviteToken);

  // Validate invite token on mount
  useEffect(() => {
    if (!inviteToken) return;

    async function validateInvite() {
      try {
        const res = await fetch(`/api/invites/${inviteToken}`);
        const data = await res.json();

        if (!res.ok) {
          setInviteError(data.error || "Invalid invite link");
          return;
        }

        setInviteInfo(data);
        if (data.restrictedEmail) {
          setEmail(data.restrictedEmail);
        }
      } catch {
        setInviteError("Failed to validate invite link");
      } finally {
        setIsValidatingInvite(false);
      }
    }
    validateInvite();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    setIsLoading(true);

    const normalizedEmail = email.toLowerCase().trim();
    const result = await register({ email: normalizedEmail, password, name });

    if (result.success) {
      // If this is an invite registration, consume the invite token
      if (inviteToken && inviteInfo) {
        try {
          const consumeRes = await fetch(`/api/invites/${inviteToken}`, {
            method: "POST",
          });
          if (!consumeRes.ok) {
            const data = await consumeRes.json();
            setError(data.error || "Failed to activate sponsor account");
            setIsLoading(false);
            return;
          }
        } catch {
          setError("Failed to activate sponsor account");
          setIsLoading(false);
          return;
        }
      }

      // Record pending referral if ref_code cookie exists (non-blocking)
      try {
        await fetch("/api/referrals/record", { method: "POST" });
      } catch {
        // Referral tracking failure should not block registration
      }

      router.push("/onboarding");
    } else {
      setError(result.error || "Registration failed");
    }

    setIsLoading(false);
  };

  if (isValidatingInvite) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <p className="text-lg font-medium text-destructive">Invalid Invite</p>
              <p className="text-sm text-muted-foreground">{inviteError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setInviteError("");
                  setInviteInfo(null);
                  router.replace("/register");
                }}
              >
                Register without invite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            {inviteInfo
              ? "You've been invited to join as a sponsor"
              : "Join SWA.XYZ and start building"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteInfo && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              {inviteInfo.orgLogo ? (
                <img
                  src={inviteInfo.orgLogo}
                  alt={inviteInfo.orgName}
                  className="h-10 w-10 rounded object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{inviteInfo.orgName}</p>
                <Badge variant="secondary" className="mt-0.5 text-xs">
                  Sponsor
                </Badge>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !!inviteInfo?.restrictedEmail}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
