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
  Home,
  Compass,
  BookOpen,
  Settings,
  Share2,
  MessageSquare,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
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
  const { user, logout } = useAuth();

  const [draftCount, setDraftCount] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      if (!user) return;

      const promises: Promise<unknown>[] = [];

      if (user.role === "participant") {
        promises.push(
          submissionsService.getByUser(user.id).then((res) => {
            const drafts = res.data.filter((s) => s.status === "draft").length;
            setDraftCount(drafts);
          })
        );
      }

      if (user.role === "judge") {
        promises.push(
          reviewsService.getByJudge(user.id).then((res) => {
            const pending = res.data.filter((r) => r.status === "pending").length;
            setPendingReviews(pending);
          })
        );
      }

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
      title: "Builder",
      roles: ["participant"],
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        {
          href: "/submissions",
          label: "My Submissions",
          icon: FileText,
          badge: draftCount > 0 ? `${draftCount}` : undefined,
        },
        { href: "/submit", label: "New Submission", icon: PlusCircle },
        { href: "/teams", label: "My Teams", icon: Users2 },
        { href: "/referrals", label: "Referrals", icon: Share2 },
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
        { href: "/sponsor/tracks", label: "My Sponsorships", icon: Trophy },
        {
          href: "/sponsor/reviews",
          label: "Review Queue",
          icon: Star,
          badge: pendingReviews > 0 ? pendingReviews : undefined,
        },
        { href: "/sponsor/workshops", label: "My Resources", icon: BookOpen },
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
        { href: "/admin/workshops", label: "Resources", icon: BookOpen },
        { href: "/admin/referrals", label: "Referrals", icon: Share2 },
      ],
    },
    {
      title: "Explore",
      items: [
        { href: "/cohorts", label: "Cohorts", icon: GraduationCap },
        { href: "/workshops", label: "Events", icon: Calendar },
        { href: "/resources", label: "Resources", icon: BookOpen },
        { href: "/explore", label: "Projects", icon: Compass },
        { href: "/ideas", label: "Ideas", icon: Lightbulb },
        { href: "/feedback", label: "Feedback", icon: MessageSquare },
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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
          onClick={handleNavClick}
        >
          SWA.XYZ
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-6">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="mb-1.5 px-2 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  {section.title}
                </h3>
              )}
              <div className="space-y-px">
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
                        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                        isActive
                          ? "text-foreground bg-muted/80 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge !== 0 && (
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-2 space-y-px">
        <Link
          href="/settings"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
            pathname === "/settings"
              ? "text-foreground bg-muted/80 font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <Link
          href="/"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* User profile */}
      {user && (
        <div className="border-t px-3 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src={
                user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
              }
              alt={user.name}
              className="h-7 w-7 rounded-md object-cover border shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">
                {user.name}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r">
      <SidebarContent />
    </aside>
  );
}
