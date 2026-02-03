"use client";

import { useMemo, useState } from "react";
import type { TractionSnapshot } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    // Reverse to show oldest first (left to right timeline)
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
      // User metrics
      dau: snapshot.reportedDau ?? null,
      mau: snapshot.reportedMau ?? null,
      // Web analytics
      visits: snapshot.reportedMonthlyVisits ?? null,
      gaUsers: snapshot.gaActiveUsers ?? null,
      sessions: snapshot.gaSessions ?? null,
      // Social
      followers: snapshot.twitterFollowers ?? null,
      // On-chain
      dailyTx: snapshot.onchainDailyTxCount ?? null,
      weeklyTx: snapshot.onchainWeeklyTxCount ?? null,
      dailyVolume: snapshot.onchainDailyVolume ? parseFloat(snapshot.onchainDailyVolume) : null,
    }));
  }, [snapshots]);

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Metrics History
          </CardTitle>
          <CardDescription>
            Historical snapshots of your project metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No metrics recorded yet</p>
            <p className="text-sm">Submit your first metrics snapshot above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (activeCategory) {
      case "users":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dau"
                name="DAU"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="mau"
                name="MAU"
                stroke={COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "web":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="gaUsers"
                name="GA Users"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke={COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="visits"
                name="Monthly Visits"
                stroke={COLORS.tertiary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "social":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="followers"
                name="Twitter Followers"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "onchain":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate ?? label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dailyTx"
                name="Daily Tx"
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="weeklyTx"
                name="Weekly Tx"
                stroke={COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Metrics History
        </CardTitle>
        <CardDescription>
          {snapshots.length} snapshots recorded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_CONFIG) as MetricCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {CATEGORY_CONFIG[category].label}
            </button>
          ))}
        </div>

        {/* Category description */}
        <p className="text-sm text-muted-foreground">
          {CATEGORY_CONFIG[activeCategory].description}
        </p>

        {/* Chart */}
        <div className="pt-2">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
