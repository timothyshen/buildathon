"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, FileText, Users, Building2, GraduationCap, UserCog, Star, Scale } from "lucide-react";

const adminNavItems = [
  {
    label: "Cohorts",
    href: "/admin/cohorts",
    icon: Calendar,
  },
  {
    label: "Submissions",
    href: "/admin/submissions",
    icon: FileText,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    label: "Judge",
    href: "/admin/judge",
    icon: Scale,
  },
  {
    label: "Judges",
    href: "/admin/judges",
    icon: Users,
  },
  {
    label: "Sponsors",
    href: "/admin/sponsors",
    icon: Building2,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UserCog,
  },
  {
    label: "Workshops",
    href: "/admin/workshops",
    icon: GraduationCap,
  },
];

interface AdminNavProps {
  className?: string;
}

export function AdminNav({ className }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("mb-6", className)}>
      <div className="border-b">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
