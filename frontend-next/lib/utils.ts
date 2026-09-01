import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency with proper locale support.
 */
export function getCurrencyCode(currency?: string): "INR" | "USD" {
  const normalized = (currency || "USD").toUpperCase();
  return normalized === "INR" ? "INR" : "USD";
}

export function formatCurrency(
  value: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  const normalizedCurrency = getCurrencyCode(currency);

  if (normalizedCurrency === "INR") {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return formatted.replace("₹", "Rs ");
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as percentage.
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with compact notation.
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Relative time formatting.
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
