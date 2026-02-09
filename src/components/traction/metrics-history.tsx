"use client";

import { useMemo, useState } from "react";
import type { TractionSnapshot } from "@/types";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MetricsHistoryProps {
  snapshots: TractionSnapshot[];
}

type MetricCategory = "users" | "web" | "social" | "onchain";

const CATEGORY_CONFIG: Record<MetricCategory, { label: string; description: string }> = {
  users: { label: "User Metrics", description: "DAU & MAU over time" },
  web: { label: "Web Analytics", description: "GA users, sessions & visits" },
  social: { label: "Social", description: "Twitter followers" },
  onchain: { label: "On-chain", description: "Transaction counts & volume" },
};

const COLORS = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  tertiary: "#059669",
  quaternary: "#d97706",
};

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "-";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatYAxis(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

export function MetricsHistory({ snapshots }: MetricsHistoryProps) {
  const [activeCategory, setActiveCategory] = useState<MetricCategory>("users");

  const chartData = useMemo(() => {
    return [...snapshots].reverse().map((snapshot) => ({
      date: new Date(snapshot.snapshotDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: new Date(snapshot.snapshotDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      dau: snapshot.reportedDau ?? null,
      mau: snapshot.reportedMau ?? null,
      visits: snapshot.reportedMonthlyVisits ?? null,
      gaUsers: snapshot.gaActiveUsers ?? null,
      sessions: snapshot.gaSessions ?? null,
      followers: snapshot.twitterFollowers ?? null,
      dailyTx: snapshot.onchainDailyTxCount ?? null,
      weeklyTx: snapshot.onchainWeeklyTxCount ?? null,
      dailyVolume: snapshot.onchainDailyVolume ? parseFloat(snapshot.onchainDailyVolume) : null,
    }));
  }, [snapshots]);

  if (snapshots.length === 0) {
    return (
      <section className="rounded-xl border p-5">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Metrics History
        </h2>
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No metrics recorded yet</p>
          <p className="text-xs mt-1">Submit your first metrics snapshot above</p>
        </div>
      </section>
    );
  }

  const renderChart = () => {
    const tooltipStyle = {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px',
      fontSize: '12px',
    };

    switch (activeCategory) {
      case "users":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Line type="monotone" dataKey="dau" name="DAU" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="mau" name="MAU" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        );

      case "web":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Line type="monotone" dataKey="gaUsers" name="GA Users" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="sessions" name="Sessions" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="visits" name="Monthly Visits" stroke={COLORS.tertiary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        );

      case "social":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Line type="monotone" dataKey="followers" name="Twitter Followers" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        );

      case "onchain":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={tooltipStyle}
              />
              <Legend />
              <Line type="monotone" dataKey="dailyTx" name="Daily Tx" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="weeklyTx" name="Weekly Tx" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <section className="rounded-xl border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Metrics History
        </h2>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {snapshots.length} snapshots
        </span>
      </div>

      {/* Category filters */}
      <div className="flex gap-1">
        {(Object.keys(CATEGORY_CONFIG) as MetricCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              activeCategory === category
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {CATEGORY_CONFIG[category].label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {CATEGORY_CONFIG[activeCategory].description}
      </p>

      <div>{renderChart()}</div>
    </section>
  );
}
