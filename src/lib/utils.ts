import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Bitcoin
export function formatCurrency(amount: number, currency: string = 'BTC'): string {
  if (currency === 'BTC') {
    return amount.toFixed(8);
  }
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency
  });
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}