"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usersService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push("/");
  }, [logout, router]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setTwitter(user.twitter || "");
      setGithub(user.github || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await usersService.update(user.id, {
        name: name.trim(),
        bio: bio.trim() || undefined,
        twitter: twitter.trim() || undefined,
        github: github.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save settings");
        return;
      }

      if (refreshUser) refreshUser();
      toast.success("Settings saved");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile */}
      <section className="space-y-5 rounded-xl border p-5">
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Profile
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your public profile information
          </p>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt={user?.name}
            className="h-20 w-20 rounded-full"
          />
          <Button variant="outline" size="sm">Change Avatar</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs text-muted-foreground">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} disabled />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-xs text-muted-foreground">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-5 rounded-xl border p-5">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Social Links
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="twitter" className="text-xs text-muted-foreground">Twitter</Label>
            <div className="flex">
              <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="twitter"
                className="rounded-l-none"
                placeholder="username"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="github" className="text-xs text-muted-foreground">GitHub</Label>
            <div className="flex">
              <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                github.com/
              </span>
              <Input
                id="github"
                className="rounded-l-none"
                placeholder="username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Wallet */}
      <section className="space-y-5 rounded-xl border p-5">
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Wallet
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your wallet for IP registration
          </p>
        </div>
        <WalletConnect />
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Danger Zone */}
      <section className="space-y-5 rounded-xl border border-destructive/30 p-5">
        <h2 className="text-[11px] uppercase tracking-widest text-destructive font-medium">
          Danger Zone
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
          <div className="border-t" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
