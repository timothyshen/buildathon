"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Trophy,
  Star,
  Users,
  Users2,
  FolderKanban,
  GraduationCap,
  LogOut,
  ChevronRight,
  Home,
  Compass,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleBadgeColor } from "@/lib/utils/colors";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submissionsService, reviewsService } from "@/services";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("admin" | "sponsor" | "judge" | "participant")[];
  badge?: number | string;
  external?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  roles?: ("admin" | "sponsor" | "judge" | "participant")[];
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();

  // Badge count state
  const [draftCount, setDraftCount] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // Load badge counts - using targeted queries for efficiency
  useEffect(() => {
    async function loadCounts() {
      if (!user) return;

      // Only fetch what's needed based on user role
      const promises: Promise<unknown>[] = [];

      // Participants need their own submissions for draft count
      if (user.role === "participant") {
        promises.push(
          submissionsService.getByUser(user.id).then((res) => {
            const drafts = res.data.filter((s) => s.status === "draft").length;
            setDraftCount(drafts);
          })
        );
      }

      // Judges need their pending reviews
      if (user.role === "judge") {
        promises.push(
          reviewsService.getByJudge(user.id).then((res) => {
            const pending = res.data.filter((r) => r.status === "pending").length;
            setPendingReviews(pending);
          })
        );
      }

      // Admins need total submission count
      if (user.role === "admin") {
        promises.push(
          submissionsService.list({ pageSize: 1 }).then((res) => {
            setTotalSubmissions(res.total);
          })
        );
      }

      await Promise.all(promises);
    }
    loadCounts();
  }, [user]);

  const navSections: NavSection[] = [
    {
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Builder",
      roles: ["participant"],
      items: [
        {
          href: "/submissions",
          label: "My Submissions",
          icon: FileText,
          badge: draftCount > 0 ? `${draftCount} draft` : undefined,
        },
        { href: "/submit", label: "New Submission", icon: PlusCircle },
        { href: "/teams", label: "My Teams", icon: Users2 },
      ],
    },
    {
      title: "Judging",
      roles: ["judge"],
      items: [
        {
          href: "/reviews",
          label: "Review Queue",
          icon: Star,
          badge: pendingReviews > 0 ? pendingReviews : undefined,
        },
      ],
    },
    {
      title: "Sponsor",
      roles: ["sponsor"],
      items: [
        { href: "/sponsor/workshops", label: "My Workshops", icon: GraduationCap },
        { href: "/sponsor/tracks", label: "My Sponsorships", icon: Trophy },
        {
          href: "/sponsor/reviews",
          label: "Review Queue",
          icon: Star,
          badge: pendingReviews > 0 ? pendingReviews : undefined,
        },
      ],
    },
    {
      title: "Admin",
      roles: ["admin"],
      items: [
        { href: "/admin/cohorts", label: "Cohorts", icon: Trophy },
        {
          href: "/admin/submissions",
          label: "All Submissions",
          icon: FolderKanban,
          badge: totalSubmissions,
        },
        { href: "/admin/judges", label: "Judges", icon: Users },
        { href: "/admin/sponsors", label: "Sponsors", icon: Users },
        { href: "/admin/workshops", label: "Workshops", icon: GraduationCap },
      ],
    },
    {
      title: "Explore",
      items: [
        { href: "/cohorts", label: "Cohorts", icon: GraduationCap },
        { href: "/workshops", label: "Workshops", icon: BookOpen },
        { href: "/explore", label: "Projects", icon: Compass },
      ],
    },
  ];

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
      }),
    }))
    .filter((section) => {
      if (section.roles && user && !section.roles.includes(user.role)) {
        return false;
      }
      return section.items.length > 0;
    });

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo Section */}
      <div className="flex h-14 items-center gap-3 border-b px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground" onClick={handleNavClick}>
          SWA.XYZ
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-auto h-5 min-w-[20px] justify-center rounded px-1.5 text-[10px] font-medium",
                            isActive
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {!item.badge && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100",
                            "text-muted-foreground"
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Quick Actions */}
      <div className="border-t p-3">
        <Link
          href="/"
          onClick={handleNavClick}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Role Switcher (Dev Tool) */}
      {user && (
        <div className="border-t p-3">
          <div className="rounded-md bg-muted p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dev Mode
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["participant", "judge", "sponsor", "admin"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className={cn(
                    "rounded px-2 py-1.5 text-xs font-medium transition-colors",
                    user.role === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Profile */}
      {user && (
        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                }
                alt={user.name}
                className="h-9 w-9 rounded-md object-cover border"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success-foreground" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name}
              </p>
              <Badge
                className={cn(
                  "mt-0.5 h-5 rounded px-1.5 text-[10px] font-medium capitalize border-0",
                  getRoleBadgeColor(user.role)
                )}
              >
                {user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r">
      <SidebarContent />
    </aside>
  );
}
