import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Append width param to Supabase storage URLs for thumbnail optimization */
export function thumbUrl(url: string, width = 400): string {
  if (url.includes("w=") || url.includes("width=")) return url;
  if (url.includes("supabase.co/storage")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}`;
  }
  return url;
}

/** @deprecated Use thumbUrl(url, 400) instead */
export const thumb400 = (url: string) => thumbUrl(url, 400);
