/**
 * RideNDine Shared Utilities
 */

import { OrderStatus, ORDER_STATUS_SEQUENCE, CANCELLABLE_STATUSES } from '../constants';

// ============ Formatting Utilities ============

/**
 * Format cents to currency string
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Format distance in miles
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

/**
 * Format duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString();
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// ============ Order Utilities ============

/**
 * Get human-readable order status
 */
export function getOrderStatusLabel(status: OrderStatus | string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    payment_pending: 'Payment Pending',
    payment_confirmed: 'Payment Confirmed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup',
    assigned_to_driver: 'Driver Assigned',
    picked_up: 'Picked Up',
    in_transit: 'On the Way',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: OrderStatus | string): string {
  const colors: Record<string, string> = {
    pending: '#9e9e9e',
    payment_pending: '#ff9800',
    payment_confirmed: '#4caf50',
    accepted: '#2196f3',
    rejected: '#f44336',
    preparing: '#ff9800',
    ready_for_pickup: '#4caf50',
    assigned_to_driver: '#2196f3',
    picked_up: '#2196f3',
    in_transit: '#2196f3',
    delivered: '#4caf50',
    cancelled: '#f44336',
    refunded: '#9c27b0',
  };
  return colors[status] || '#9e9e9e';
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status: OrderStatus | string): boolean {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

/**
 * Get order progress percentage
 */
export function getOrderProgress(status: OrderStatus | string): number {
  const index = ORDER_STATUS_SEQUENCE.indexOf(status as typeof ORDER_STATUS_SEQUENCE[number]);
  if (index === -1) return 0;
  return Math.round((index / (ORDER_STATUS_SEQUENCE.length - 1)) * 100);
}

/**
 * Check if order is in an active/pending state
 */
export function isOrderActive(status: OrderStatus | string): boolean {
  const activeStatuses = [
    'pending',
    'payment_pending',
    'payment_confirmed',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'assigned_to_driver',
    'picked_up',
    'in_transit',
  ];
  return activeStatuses.includes(status);
}

// ============ Geo Utilities ============

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate driving duration based on distance (rough approximation)
 */
export function estimateDrivingDuration(distanceMiles: number): number {
  // Assume average speed of 25 mph in urban areas
  return Math.round((distanceMiles / 25) * 60);
}

// ============ Validation Utilities ============

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[\d\W]/.test(password)) {
    errors.push('Password must contain a number or special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
}

// ============ Cart Utilities ============

/**
 * Calculate cart totals
 */
export function calculateCartTotals(
  subtotal: number,
  deliveryFee: number,
  serviceFeeRate: number,
  taxRate: number,
  tip: number
): {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip: number;
  total: number;
} {
  const serviceFee = Math.round(subtotal * serviceFeeRate);
  const taxableAmount = subtotal + serviceFee;
  const tax = Math.round(taxableAmount * taxRate);
  const total = subtotal + deliveryFee + serviceFee + tax + tip;

  return {
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    tip,
    total,
  };
}

// ============ String Utilities ============

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return first + last || '?';
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============ Async Utilities ============

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}
