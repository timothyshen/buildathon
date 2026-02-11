"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import type { TractionSnapshot } from "@/types";

interface ProjectTractionProps {
  snapshots: TractionSnapshot[];
  latestSnapshot: TractionSnapshot | null;
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  getValue: (s: TractionSnapshot) => number | undefined;
}

const METRICS: MetricConfig[] = [
  { key: "visits", label: "Visits", color: "#8b5cf6", getValue: (s) => s.reportedMonthlyVisits ?? s.gaPageviews },
  { key: "dau", label: "DAU", color: "#3b82f6", getValue: (s) => s.reportedDau ?? s.gaActiveUsers },
  { key: "mau", label: "MAU", color: "#10b981", getValue: (s) => s.reportedMau ?? s.gaTotalUsers },
  { key: "txCount", label: "TX Count", color: "#f59e0b", getValue: (s) => s.onchainTxCount },
  { key: "tvl", label: "TVL", color: "#ec4899", getValue: (s) => s.onchainTvlUsd },
  { key: "followers", label: "Followers", color: "#06b6d4", getValue: (s) => s.twitterFollowers },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function ProjectTractionStats({ latestSnapshot }: { latestSnapshot: TractionSnapshot }) {
  const stats = [
    { label: "DAU", value: latestSnapshot.reportedDau ?? latestSnapshot.gaActiveUsers, color: "text-blue-600" },
    { label: "MAU", value: latestSnapshot.reportedMau ?? latestSnapshot.gaTotalUsers, color: "text-emerald-600" },
    { label: "Visits", value: latestSnapshot.reportedMonthlyVisits ?? latestSnapshot.gaPageviews, color: "text-violet-600" },
    { label: "TX Count", value: latestSnapshot.onchainTxCount, color: "text-amber-600" },
    { label: "TVL (USD)", value: latestSnapshot.onchainTvlUsd, color: "text-pink-600" },
    { label: "Followers", value: latestSnapshot.twitterFollowers, color: "text-cyan-600" },
  ].filter((s) => s.value != null && s.value > 0);

  if (stats.length === 0) return null;

  return (
    <div className="rounded-xl border flex divide-x overflow-x-auto">
      {stats.map((stat) => (
        <div key={stat.label} className="flex-1 min-w-[120px] px-5 py-4">
          <div className={cn("text-2xl font-mono font-semibold tabular-nums", stat.color)}>
            {formatNumber(stat.value!)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ProjectTractionChart({ snapshots }: { snapshots: TractionSnapshot[] }) {
  const availableMetrics = useMemo(() => {
    return METRICS.filter((m) => snapshots.some((s) => m.getValue(s) != null));
  }, [snapshots]);

  const [activeMetric, setActiveMetric] = useState<string>(
    availableMetrics[0]?.key ?? "visits"
  );

  const metric = availableMetrics.find((m) => m.key === activeMetric) ?? availableMetrics[0];

  const chartData = useMemo(() => {
    return [...snapshots]
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
      .map((s) => ({
        date: formatDate(new Date(s.snapshotDate)),
        value: metric?.getValue(s) ?? 0,
      }));
  }, [snapshots, metric]);

  if (availableMetrics.length === 0 || snapshots.length < 2) return null;

  return (
    <section className="rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Traction
        </h3>
        <div className="flex gap-1">
          {availableMetrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md transition-colors",
                activeMetric === m.key
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickFormatter={formatNumber}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number | undefined) => [formatNumber(value ?? 0), metric?.label ?? ""]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric?.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
