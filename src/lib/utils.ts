import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Slugify a heading string for use as an anchor ID. */
export function slugifyHeading(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Only allow safe URL protocols via allowlist approach. */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  // Reject protocol-relative URLs (//evil.com) before checking relative paths
  if (trimmed.startsWith("//")) return false;
  // Relative URLs and fragment-only are safe
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) return true;
  // Allow only http(s), mailto, and tel protocols
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("mailto:") || lower.startsWith("tel:")) return true;
  // Reject everything else (javascript:, data:, vbscript:, unknown protocols)
  return !trimmed.includes(":");
}
