"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  Sun,
  Moon,
  Search,
  Palette,
  Type,
  Maximize,
  Circle,
} from "lucide-react";

// Design tokens extracted from globals.css
const colorTokens = {
  light: {
    background: { value: "oklch(1 0 0)", css: "--background", hex: "#ffffff" },
    foreground: { value: "oklch(0.145 0 0)", css: "--foreground", hex: "#1a1a1a" },
    card: { value: "oklch(1 0 0)", css: "--card", hex: "#ffffff" },
    cardForeground: { value: "oklch(0.145 0 0)", css: "--card-foreground", hex: "#1a1a1a" },
    popover: { value: "oklch(1 0 0)", css: "--popover", hex: "#ffffff" },
    popoverForeground: { value: "oklch(0.145 0 0)", css: "--popover-foreground", hex: "#1a1a1a" },
    primary: { value: "oklch(0.205 0 0)", css: "--primary", hex: "#262626" },
    primaryForeground: { value: "oklch(0.985 0 0)", css: "--primary-foreground", hex: "#fafafa" },
    secondary: { value: "oklch(0.97 0 0)", css: "--secondary", hex: "#f5f5f5" },
    secondaryForeground: { value: "oklch(0.205 0 0)", css: "--secondary-foreground", hex: "#262626" },
    muted: { value: "oklch(0.97 0 0)", css: "--muted", hex: "#f5f5f5" },
    mutedForeground: { value: "oklch(0.556 0 0)", css: "--muted-foreground", hex: "#737373" },
    accent: { value: "oklch(0.97 0 0)", css: "--accent", hex: "#f5f5f5" },
    accentForeground: { value: "oklch(0.205 0 0)", css: "--accent-foreground", hex: "#262626" },
    destructive: { value: "oklch(0.577 0.245 27.325)", css: "--destructive", hex: "#dc2626" },
    border: { value: "oklch(0.922 0 0)", css: "--border", hex: "#e5e5e5" },
    input: { value: "oklch(0.922 0 0)", css: "--input", hex: "#e5e5e5" },
    ring: { value: "oklch(0.708 0 0)", css: "--ring", hex: "#a3a3a3" },
  },
  dark: {
    background: { value: "oklch(0.145 0 0)", css: "--background", hex: "#1a1a1a" },
    foreground: { value: "oklch(0.985 0 0)", css: "--foreground", hex: "#fafafa" },
    card: { value: "oklch(0.205 0 0)", css: "--card", hex: "#262626" },
    cardForeground: { value: "oklch(0.985 0 0)", css: "--card-foreground", hex: "#fafafa" },
    popover: { value: "oklch(0.205 0 0)", css: "--popover", hex: "#262626" },
    popoverForeground: { value: "oklch(0.985 0 0)", css: "--popover-foreground", hex: "#fafafa" },
    primary: { value: "oklch(0.922 0 0)", css: "--primary", hex: "#e5e5e5" },
    primaryForeground: { value: "oklch(0.205 0 0)", css: "--primary-foreground", hex: "#262626" },
    secondary: { value: "oklch(0.269 0 0)", css: "--secondary", hex: "#333333" },
    secondaryForeground: { value: "oklch(0.985 0 0)", css: "--secondary-foreground", hex: "#fafafa" },
    muted: { value: "oklch(0.269 0 0)", css: "--muted", hex: "#333333" },
    mutedForeground: { value: "oklch(0.708 0 0)", css: "--muted-foreground", hex: "#a3a3a3" },
    accent: { value: "oklch(0.269 0 0)", css: "--accent", hex: "#333333" },
    accentForeground: { value: "oklch(0.985 0 0)", css: "--accent-foreground", hex: "#fafafa" },
    destructive: { value: "oklch(0.704 0.191 22.216)", css: "--destructive", hex: "#f87171" },
    border: { value: "oklch(1 0 0 / 10%)", css: "--border", hex: "#ffffff1a" },
    input: { value: "oklch(1 0 0 / 15%)", css: "--input", hex: "#ffffff26" },
    ring: { value: "oklch(0.556 0 0)", css: "--ring", hex: "#737373" },
  },
};

const typography = {
  scale: [
    { name: "xs", size: "0.75rem", lineHeight: "1rem", class: "text-xs" },
    { name: "sm", size: "0.875rem", lineHeight: "1.25rem", class: "text-sm" },
    { name: "base", size: "1rem", lineHeight: "1.5rem", class: "text-base" },
    { name: "lg", size: "1.125rem", lineHeight: "1.75rem", class: "text-lg" },
    { name: "xl", size: "1.25rem", lineHeight: "1.75rem", class: "text-xl" },
    { name: "2xl", size: "1.5rem", lineHeight: "2rem", class: "text-2xl" },
    { name: "3xl", size: "1.875rem", lineHeight: "2.25rem", class: "text-3xl" },
    { name: "4xl", size: "2.25rem", lineHeight: "2.5rem", class: "text-4xl" },
  ],
};

const spacing = {
  scale: [
    { name: "0", value: "0px", class: "p-0" },
    { name: "px", value: "1px", class: "p-px" },
    { name: "0.5", value: "0.125rem", class: "p-0.5" },
    { name: "1", value: "0.25rem", class: "p-1" },
    { name: "1.5", value: "0.375rem", class: "p-1.5" },
    { name: "2", value: "0.5rem", class: "p-2" },
    { name: "2.5", value: "0.625rem", class: "p-2.5" },
    { name: "3", value: "0.75rem", class: "p-3" },
    { name: "4", value: "1rem", class: "p-4" },
    { name: "5", value: "1.25rem", class: "p-5" },
    { name: "6", value: "1.5rem", class: "p-6" },
    { name: "8", value: "2rem", class: "p-8" },
    { name: "10", value: "2.5rem", class: "p-10" },
    { name: "12", value: "3rem", class: "p-12" },
    { name: "16", value: "4rem", class: "p-16" },
  ],
};

const radius = {
  scale: [
    { name: "sm", value: "calc(0.625rem - 4px)", class: "rounded-sm" },
    { name: "md", value: "calc(0.625rem - 2px)", class: "rounded-md" },
    { name: "lg", value: "0.625rem", class: "rounded-lg" },
    { name: "xl", value: "calc(0.625rem + 4px)", class: "rounded-xl" },
    { name: "2xl", value: "calc(0.625rem + 8px)", class: "rounded-2xl" },
    { name: "3xl", value: "calc(0.625rem + 12px)", class: "rounded-3xl" },
    { name: "full", value: "9999px", class: "rounded-full" },
  ],
};

export default function ThemeGuidePage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"colors" | "typography" | "spacing" | "radius">("colors");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const copyToClipboard = (value: string, token: string) => {
    navigator.clipboard.writeText(value);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const colors = theme === "light" ? colorTokens.light : colorTokens.dark;
  const selectedColorData = selectedColor ? colors[selectedColor as keyof typeof colors] : null;

  // Filter tokens based on search
  const filteredColors = Object.entries(colors).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const sections = [
    { id: "colors" as const, label: "Colors", icon: Palette, count: Object.keys(colors).length },
    { id: "typography" as const, label: "Typography", icon: Type, count: typography.scale.length },
    { id: "spacing" as const, label: "Spacing", icon: Maximize, count: spacing.scale.length },
    { id: "radius" as const, label: "Radius", icon: Circle, count: radius.scale.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Theme Guide</h1>
        <p className="text-muted-foreground">
          Design system tokens for colors, typography, spacing, and border radius
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="w-full md:w-48 shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </div>
                <Badge
                  variant={activeSection === section.id ? "secondary" : "outline"}
                  className="text-xs hidden md:inline-flex"
                >
                  {section.count}
                </Badge>
              </button>
            ))}
          </nav>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Theme Preview</p>
            <div className="flex gap-1">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3 w-3 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3 w-3 mr-1" />
                Dark
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "colors" && (
            <div className="space-y-4">
              {/* Color Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredColors.map(([name, token]) => (
                  <button
                    key={name}
                    onClick={() => setSelectedColor(name)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedColor === name
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:border-primary"
                    }`}
                  >
                    <div
                      className="w-full aspect-video rounded mb-2"
                      style={{ backgroundColor: token.hex }}
                    />
                    <p className="text-xs font-medium truncate">
                      {name.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </button>
                ))}
              </div>

              {/* Detail Panel */}
              {selectedColorData && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="capitalize">
                        {selectedColor?.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div
                        className="w-8 h-8 rounded-lg border"
                        style={{ backgroundColor: selectedColorData.hex }}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "CSS Variable", value: `var(${selectedColorData.css})` },
                      { label: "OKLCH Value", value: selectedColorData.value },
                      { label: "Hex Fallback", value: selectedColorData.hex },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <code className="text-sm">{item.value}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(item.value, `${selectedColor}-${item.label}`)}
                        >
                          {copiedToken === `${selectedColor}-${item.label}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === "typography" && (
            <div className="space-y-6">
              {/* Interactive Type Tester */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Type Scale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {typography.scale.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => copyToClipboard(item.class, item.name)}
                      >
                        <span className={item.class}>The quick brown fox</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.name}</Badge>
                          <span className="text-xs text-muted-foreground">{item.size}</span>
                          {copiedToken === item.name ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "spacing" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spacing Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {spacing.scale.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-4 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => copyToClipboard(item.value, `space-${item.name}`)}
                    >
                      <Badge variant="outline" className="w-10 justify-center">
                        {item.name}
                      </Badge>
                      <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: item.value }}
                        />
                      </div>
                      <code className="text-xs text-muted-foreground w-16">
                        {item.value}
                      </code>
                      {copiedToken === `space-${item.name}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 opacity-30" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "radius" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Border Radius</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {radius.scale.map((item) => (
                    <button
                      key={item.name}
                      className="p-4 border rounded-lg hover:bg-muted/50 text-center transition-colors"
                      onClick={() => copyToClipboard(item.class, `radius-${item.name}`)}
                    >
                      <div
                        className={`w-16 h-16 bg-primary mx-auto mb-2 ${item.class}`}
                      />
                      <p className="font-medium text-sm">{item.name}</p>
                      <code className="text-xs text-muted-foreground">
                        {item.value}
                      </code>
                      {copiedToken === `radius-${item.name}` && (
                        <p className="text-xs text-green-500 mt-1">Copied!</p>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
