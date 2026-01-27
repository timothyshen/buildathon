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
  Sparkles,
  Home,
  Compass,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

  // Load badge counts
  useEffect(() => {
    async function loadCounts() {
      if (!user) return;

      const [submissionsRes, reviewsRes] = await Promise.all([
        submissionsService.list(),
        reviewsService.list(),
      ]);

      const submissions = submissionsRes.data;
      const reviews = reviewsRes.data;

      // Calculate dynamic badges
      const userSubmissions = submissions.filter((s) =>
        s.team?.members.some((m) => m.userId === user.id)
      );
      setDraftCount(userSubmissions.filter((s) => s.status === "draft").length);
      setPendingReviews(
        reviews.filter((r) => r.judgeId === user.id && r.status === "pending").length
      );
      setTotalSubmissions(submissions.length);
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
        { href: "/explore", label: "Templates", icon: Compass },
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "sponsor":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "judge":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "participant":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "";
    }
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-6 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <Link href="/" className="text-lg font-bold tracking-tight" onClick={handleNavClick}>
            SWA.XYZ
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Buildathon Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
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
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-transform group-hover:scale-110",
                          isActive ? "text-white" : "text-slate-400"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-auto h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px] font-semibold",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {!item.badge && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5",
                            isActive ? "text-white/60" : "text-slate-400"
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
      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
        <Link
          href="/"
          onClick={handleNavClick}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Role Switcher (Dev Tool) */}
      {user && (
        <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/50">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Dev Mode: Switch Role
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {(["participant", "judge", "sponsor", "admin"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                    user.role === role
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                      : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
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
        <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                }
                alt={user.name}
                className="h-11 w-11 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              />
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 rounded-md px-1.5 text-[10px] font-semibold capitalize",
                    getRoleBadgeColor(user.role)
                  )}
                >
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
              className="h-9 w-9 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
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
    <aside className="hidden md:flex h-full w-72 flex-col">
      <SidebarContent />
    </aside>
  );
}
