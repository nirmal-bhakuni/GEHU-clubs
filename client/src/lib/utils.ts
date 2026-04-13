import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (/^(https?:|data:|blob:)/i.test(url)) {
    return encodeURI(url);
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const resolvedUrl = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`
    : url;

  return encodeURI(resolvedUrl);
}
