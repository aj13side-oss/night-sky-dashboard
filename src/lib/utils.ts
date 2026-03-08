import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Append width=400 to Supabase storage URLs for thumbnail optimization */
export function thumb400(url: string): string {
  if (url.includes("w=") || url.includes("width=")) return url;
  if (url.includes("supabase.co/storage")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=400`;
  }
  return url;
}
