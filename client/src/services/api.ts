import type { Coupon, CouponResponse, CacheEntry } from '@/types';
import { getApiUrl } from '@/config';
import { apiRateLimiter } from '@/utils/rateLimiter';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Extracts hostname from a URL
 */
export function extractHostname(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Gets cached data from chrome.storage.local
 */
async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    const cacheEntry = result[key] as CacheEntry<T> | undefined;

    if (!cacheEntry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cacheEntry.timestamp > CACHE_DURATION_MS;

    if (isExpired) {
      await chrome.storage.local.remove(key);
      return null;
    }

    return cacheEntry.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Saves data to chrome.storage.local with timestamp
 */
async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    await chrome.storage.local.set({ [key]: cacheEntry });
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Makes a fetch request with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Makes a fetch request with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

/**
 * Fetches coupons for a given domain
 */
export async function fetchCouponsForDomain(domain: string): Promise<Coupon[]> {
  const cacheKey = `coupons_${domain}`;

  // Try to get from cache first
  const cachedData = await getFromCache<Coupon[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Rate limiting: Check if we can make this request
  try {
    await apiRateLimiter.acquire();
  } catch (error) {
    console.warn('[API] Rate limit exceeded:', error);
    throw error;
  }

  // Get API base URL from config
  const apiBaseUrl = await getApiUrl();
  const url = `${apiBaseUrl}/coupons?domain=${encodeURIComponent(domain)}`;

  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      if (response.status === 404) {
        // No coupons found for this domain
        return [];
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: CouponResponse = await response.json();
    const coupons = data.data || [];

    // Cache the result
    await saveToCache(cacheKey, coupons);

    return coupons;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
}

/**
 * Gets the current active tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

/**
 * Checks if a URL is valid for coupon lookup
 */
export function isValidUrl(url?: string): boolean {
  if (!url) return false;

  // Exclude chrome:// URLs, new tab, local files, etc.
  const invalidPrefixes = ['chrome://', 'chrome-extension://', 'about:', 'file://'];
  return !invalidPrefixes.some(prefix => url.startsWith(prefix));
}
