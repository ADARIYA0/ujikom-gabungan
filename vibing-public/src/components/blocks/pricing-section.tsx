"use client";

import React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";

interface Feature {
  name: string;
  description: string;
  included: boolean;
}

export interface PricingTier {
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: Feature[];
  highlight?: boolean;
  badge?: string;
  icon: React.ReactNode;
}

interface PricingSectionProps {
  tiers: PricingTier[];
  className?: string;
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  const buttonStyles = {
    default: cn(
      "h-12 bg-white dark:bg-zinc-900 cursor-pointer",
      "hover:bg-zinc-50 dark:hover:bg-zinc-800",
      "text-zinc-900 dark:text-zinc-100",
      "border border-zinc-200 dark:border-zinc-800",
      "hover:border-zinc-300 dark:hover:border-zinc-700",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-zinc-900 dark:bg-zinc-100 cursor-pointer",
      "hover:bg-zinc-800 dark:hover:bg-zinc-300",
      "text-white dark:text-zinc-900",
      "shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
      "hover:shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
      "font-semibold text-base",
    ),
  };

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-zinc-900 dark:bg-zinc-100",
    "text-white dark:text-zinc-900",
    "border-none shadow-lg",
  );

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="text-xs uppercase tracking-[0.2em]">
            Pricing
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 md:text-4xl">
            Paket fleksibel untuk kebutuhan event Anda
          </h2>
          <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Pilih paket sesuai kebutuhan: gratis untuk peserta dan paket profesional untuk penyelenggara event.
          </p>
          <div className="inline-flex items-center rounded-full border border-slate-200 p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
            {["Monthly", "Yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Yearly")}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300 cursor-pointer",
                  (period === "Yearly") === isYearly
                    ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-3xl border transition-all duration-300 backdrop-blur-sm",
                tier.highlight
                  ? "bg-gradient-to-b from-slate-100/80 to-transparent dark:from-slate-400/10 border-slate-400/50 dark:border-slate-600/30 shadow-2xl"
                  : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-md",
                "hover:-translate-y-1 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-6">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="flex-1 p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={cn(
                      "rounded-xl p-3",
                      tier.highlight
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    {(() => {
                      const priceValue = isYearly ? tier.price.yearly : tier.price.monthly;
                      const isFreeTier = priceValue === 0;

                      return (
                        <>
                          <span className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                            {isFreeTier
                              ? "Gratis"
                              : `Rp ${priceValue.toLocaleString('id-ID')}`}
                          </span>
                          {!isFreeTier && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              /{isYearly ? "tahun" : "bulan"}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 rounded-full p-0.5 transition-colors duration-200",
                          feature.included
                            ? "text-primary"
                            : "text-slate-400 dark:text-slate-600",
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {feature.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-8 pt-0">
                <Button
                  className={cn(
                    "w-full transition-all duration-300",
                    tier.highlight ? buttonStyles.highlight : buttonStyles.default,
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tier.highlight ? (
                      <>
                        Bergabung sebagai Organizer
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Mulai secara gratis
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PricingSection };

