"use client";

import { useState, useCallback } from "react";
import { getPresetTerms } from "@/services/story-protocol/licensing";
import type { PilTermsFormValues, PilPreset } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  DollarSign,
  GitFork,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIPProps {
  data: {
    pilTerms: PilTermsFormValues | null;
    pilPreset: PilPreset | null;
  };
  onChange: (field: string, value: unknown) => void;
}

const PRESETS: {
  id: PilPreset;
  title: string;
  description: string;
  icon: typeof Shield;
  highlights: { label: string; allowed: boolean }[];
}[] = [
  {
    id: "non-commercial-remix",
    title: "Non-Commercial Remix",
    description: "Others can remix your work freely, but not for profit.",
    icon: Shield,
    highlights: [
      { label: "Derivatives allowed", allowed: true },
      { label: "Attribution required", allowed: true },
      { label: "Commercial use", allowed: false },
      { label: "Minting fee", allowed: false },
    ],
  },
  {
    id: "commercial-use",
    title: "Commercial Use",
    description: "Others can use your work commercially, but cannot remix it.",
    icon: DollarSign,
    highlights: [
      { label: "Commercial use", allowed: true },
      { label: "Attribution required", allowed: true },
      { label: "Derivatives allowed", allowed: false },
      { label: "1 WIP minting fee", allowed: true },
    ],
  },
  {
    id: "commercial-remix",
    title: "Commercial Remix",
    description:
      "Others can remix and monetize, with 50% revenue share back to you.",
    icon: GitFork,
    highlights: [
      { label: "Commercial use", allowed: true },
      { label: "Derivatives allowed", allowed: true },
      { label: "50% rev share", allowed: true },
      { label: "1 WIP minting fee", allowed: true },
    ],
  },
  {
    id: "cc-attribution",
    title: "CC Attribution",
    description:
      "Maximum freedom -- anyone can use, remix, and commercialize with attribution.",
    icon: Award,
    highlights: [
      { label: "Commercial use", allowed: true },
      { label: "Derivatives allowed", allowed: true },
      { label: "Attribution required", allowed: true },
      { label: "No minting fee", allowed: true },
    ],
  },
];

const TOGGLE_FIELDS: {
  key: keyof PilTermsFormValues;
  label: string;
  description: string;
}[] = [
  {
    key: "commercialUse",
    label: "Commercial Use",
    description: "Allow others to use your IP commercially",
  },
  {
    key: "commercialAttribution",
    label: "Commercial Attribution",
    description: "Require attribution for commercial use",
  },
  {
    key: "derivativesAllowed",
    label: "Derivatives Allowed",
    description: "Allow others to create derivative works",
  },
  {
    key: "derivativesAttribution",
    label: "Derivatives Attribution",
    description: "Require attribution on derivative works",
  },
  {
    key: "derivativesReciprocal",
    label: "Derivatives Reciprocal",
    description: "Derivatives must use the same license terms",
  },
  {
    key: "derivativesApproval",
    label: "Derivatives Approval",
    description: "Require your approval before derivatives can be created",
  },
  {
    key: "transferable",
    label: "Transferable",
    description: "Allow the license to be transferred to others",
  },
];

export function StepIP({ data, onChange }: StepIPProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const terms = data.pilTerms;
  const selectedPreset = data.pilPreset;

  const handleSelectPreset = useCallback(
    (preset: PilPreset) => {
      const presetTerms = getPresetTerms(preset);
      onChange("pilTerms", presetTerms);
      onChange("pilPreset", preset);
    },
    [onChange]
  );

  const updateTerm = useCallback(
    <K extends keyof PilTermsFormValues>(
      key: K,
      value: PilTermsFormValues[K]
    ) => {
      const base = terms ?? getPresetTerms("non-commercial-remix");
      const updated = { ...base, [key]: value };
      onChange("pilTerms", updated);
      onChange("pilPreset", null);
    },
    [terms, onChange]
  );

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          License Terms
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how others can use your intellectual property
        </p>
      </div>

      {/* Preset Picker */}
      <section className="space-y-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          Choose a Preset
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            const Icon = preset.icon;

            return (
              <div
                key={preset.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleSelectPreset(preset.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectPreset(preset.id);
                  }
                }}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  isSelected && "ring-2 ring-foreground"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">{preset.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {preset.highlights.map((h) => (
                        <li
                          key={h.label}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              h.allowed
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            )}
                          />
                          {h.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Advanced Settings */}
      <section className="rounded-xl border">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="flex w-full items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors rounded-xl"
        >
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              Advanced Settings
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Fine-tune individual license parameters
            </p>
          </div>
          {advancedOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {advancedOpen && (
          <div className="border-t px-5 pb-5 pt-4 space-y-6">
            {/* Toggle Fields */}
            <div className="space-y-4">
              {TOGGLE_FIELDS.map((field) => {
                const currentValue = terms
                  ? (terms[field.key] as boolean)
                  : false;

                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {field.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                    <Switch
                      checked={currentValue}
                      onCheckedChange={(checked: boolean) =>
                        updateTerm(
                          field.key as keyof PilTermsFormValues,
                          checked as never
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* Number Fields */}
            <div className="space-y-5 border-t pt-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Fee & Expiry Settings
              </p>

              {/* Revenue Share */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Commercial Revenue Share
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={terms?.commercialRevShare ?? 0}
                    onChange={(e) =>
                      updateTerm(
                        "commercialRevShare",
                        Math.min(100, Math.max(0, Number(e.target.value) || 0))
                      )
                    }
                    className="w-24 font-mono text-sm"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of revenue derivatives must share (0-100)
                </p>
              </div>

              {/* Default Minting Fee */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Default Minting Fee
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={terms?.defaultMintingFee ?? "0"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) {
                        updateTerm("defaultMintingFee", val);
                      }
                    }}
                    className="w-32 font-mono text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted-foreground">WIP</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fee in WIP tokens charged to mint a license
                </p>
              </div>

              {/* Expiration */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Expiration
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={terms?.expiration ?? 0}
                    onChange={(e) =>
                      updateTerm(
                        "expiration",
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="w-32 font-mono text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted-foreground">seconds</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  License duration in seconds (0 = no expiry)
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Info note */}
      <div className="rounded-xl border p-4">
        <p className="text-xs text-muted-foreground">
          License terms are optional. If you skip this step, default terms can be
          configured later. Your IP will be registered on Story Protocol when you
          submit your project.
        </p>
      </div>
    </div>
  );
}
