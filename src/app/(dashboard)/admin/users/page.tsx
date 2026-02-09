"use client";

import { useState, useEffect } from "react";
import { usersService, sponsorsService } from "@/services";
import type { User, SponsorOrg, UserRole } from "@/types";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  UserCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sponsorOrgs, setSponsorOrgs] = useState<SponsorOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("participant");
  const [editSponsorOrgId, setEditSponsorOrgId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersResult, sponsorOrgsResult] = await Promise.all([
          usersService.list(),
          sponsorsService.listOrgs(),
        ]);

        if (usersResult.success) {
          setUsers(usersResult.data || []);
        } else {
          setLoadError(usersResult.error || "Failed to load users");
        }
        if (sponsorOrgsResult.success) {
          setSponsorOrgs(sponsorOrgsResult.data || []);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-10">
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin/cohorts" },
            { label: "Users" },
          ]}
        />
        <AdminNav />
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold">Failed to Load Users</h3>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Format date safely (handles both Date objects and ISO strings)
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === "" ||
      (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const adminCount = users.filter((u) => u.role === "admin").length;
  const sponsorCount = users.filter((u) => u.role === "sponsor").length;
  const judgeCount = users.filter((u) => u.role === "judge").length;
  const participantCount = users.filter((u) => u.role === "participant").length;

  // Get sponsor org name for a user
  const getSponsorOrgName = (sponsorOrgId?: string) => {
    if (!sponsorOrgId) return "-";
    const org = sponsorOrgs.find((o) => o.id === sponsorOrgId);
    return org?.name || "-";
  };

  // Handle edit dialog open
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditSponsorOrgId(user.sponsorOrgId || "");
  };

  // Handle save
  const handleSave = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    const result = await usersService.update(editingUser.id, {
      role: editRole,
      sponsorOrgId: editRole === "sponsor" ? editSponsorOrgId || undefined : undefined,
    });

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                role: editRole,
                sponsorOrgId: editRole === "sponsor" ? editSponsorOrgId || undefined : undefined,
              }
            : u
        )
      );
      toast.success("User role updated successfully");
      setEditingUser(null);
    } else {
      toast.error(result.error || "Failed to update user");
    }
    setIsSaving(false);
  };

  // Role dot color helper
  const getRoleDotColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-violet-500";
      case "sponsor":
        return "bg-blue-500";
      case "judge":
        return "bg-emerald-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="space-y-10">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/cohorts" },
          { label: "Users" },
        ]}
      />
      <AdminNav />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user roles and permissions
        </p>
      </div>

      {/* Stats Strip */}
      <div className="rounded-xl border bg-card divide-x flex">
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{users.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{participantCount} participants</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-violet-600">Admins</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{adminCount}</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Sponsors</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{sponsorCount}</p>
        </div>
        <div className="flex-1 px-6 py-4">
          <p className="text-sm text-muted-foreground">Judges</p>
          <p className="text-3xl font-mono font-semibold tabular-nums mt-1">{judgeCount}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sponsor">Sponsor</SelectItem>
            <SelectItem value="judge">Judge</SelectItem>
            <SelectItem value="participant">Participant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-8 w-8 opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">No Users Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search || roleFilter !== "all"
              ? "Try adjusting your search or filter."
              : "No users have registered yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Sponsor Org</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {user.email || "-"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.email || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${getRoleDotColor(user.role)}`} />
                      <span className="text-xs capitalize">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getSponsorOrgName(user.sponsorOrgId)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEditClick(user)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for this user
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 pt-4">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b">
                {editingUser.avatar ? (
                  <img
                    src={editingUser.avatar}
                    alt={editingUser.name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{editingUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {editingUser.email}
                  </p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editRole}
                  onValueChange={(value) => setEditRole(value as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sponsor Org Selection (only for sponsor role) */}
              {editRole === "sponsor" && (
                <div className="space-y-2">
                  <Label htmlFor="sponsorOrg">Sponsor Organization</Label>
                  <Select
                    value={editSponsorOrgId}
                    onValueChange={setEditSponsorOrgId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {sponsorOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sponsorOrgs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No sponsor organizations available. Create one first.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
