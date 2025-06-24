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

export function generateColorFromString(str: string): string {
  if (!str) return '#cccccc'; // Default color for empty string

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    // Adjusting the value to get more pleasant, less saturated colors
    const adjustedValue = 100 + (value % 156); // Range from 100 to 255
    color += ('00' + adjustedValue.toString(16)).substr(-2);
  }

  return color;
}
