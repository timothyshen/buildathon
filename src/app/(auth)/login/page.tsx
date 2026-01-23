"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setIsLoading(true);
    const result = await login(demoEmail, "demo");
    if (result.success) {
      router.push("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your SWA.XYZ account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter any password (demo)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Demo Accounts
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDemoLogin("admin@story.foundation")}
              disabled={isLoading}
            >
              <span className="mr-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Admin
              </span>
              admin@story.foundation
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDemoLogin("judge@example.com")}
              disabled={isLoading}
            >
              <span className="mr-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Judge
              </span>
              judge@example.com
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDemoLogin("builder@example.com")}
              disabled={isLoading}
            >
              <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Builder
              </span>
              builder@example.com
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/#waitlist" className="font-medium text-primary hover:underline">
              Join the waitlist
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
