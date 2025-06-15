import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SHA-256 hashing helper for PIN (used by useSession)
export async function sha256(str: string): Promise<string> {
  // Accepts a string, returns hex string hash
  const data = new TextEncoder().encode(str);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
