import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCouponsForDomain, getCurrentTab, extractHostname, isValidUrl } from './api';
import { mockCoupons, mockTab } from '../test/mockData';
import { mockFetch, mockFetchError, mockChromeStorage, mockChromeTabs } from '../test/testUtils';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChromeStorage({});
  });

  describe('extractHostname', () => {
    it('should extract hostname from valid URL', () => {
      expect(extractHostname('https://example.com/path')).toBe('example.com');
      expect(extractHostname('http://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should return null for invalid URL', () => {
      expect(extractHostname('not-a-url')).toBe(null);
      expect(extractHostname('')).toBe(null);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should return false for chrome:// URLs', () => {
      expect(isValidUrl('chrome://extensions/')).toBe(false);
      expect(isValidUrl('chrome-extension://abc123')).toBe(false);
    });

    it('should return false for about: and file: URLs', () => {
      expect(isValidUrl('about:blank')).toBe(false);
      expect(isValidUrl('file:///path/to/file')).toBe(false);
    });

    it('should return false for undefined or empty', () => {
      expect(isValidUrl(undefined)).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getCurrentTab', () => {
    it('should return current active tab', async () => {
      mockChromeTabs([mockTab]);
      const tab = await getCurrentTab();
      expect(tab).toEqual(mockTab);
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    it('should return null if no tab found', async () => {
      mockChromeTabs([]);
      const tab = await getCurrentTab();
      expect(tab).toBe(null);
    });

    it('should return null on error', async () => {
      vi.mocked(chrome.tabs.query).mockRejectedValue(new Error('Query failed'));
      const tab = await getCurrentTab();
      expect(tab).toBe(null);
    });
  });

  describe('fetchCouponsForDomain', () => {
    const domain = 'example.com';

    it('should fetch coupons from API', async () => {
      mockFetch({ data: mockCoupons });

      const coupons = await fetchCouponsForDomain(domain);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/coupons?domain=${domain}`),
        expect.any(Object),
      );
      expect(coupons).toEqual(mockCoupons);
    });

    it('should return cached coupons if available', async () => {
      const cachedData = {
        data: mockCoupons.slice(0, 2),
        timestamp: Date.now(),
      };
      mockChromeStorage({ [`coupons_${domain}`]: cachedData });

      const coupons = await fetchCouponsForDomain(domain);

      expect(coupons).toEqual(mockCoupons.slice(0, 2));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch new data if cache is expired', async () => {
      const expiredData = {
        data: mockCoupons.slice(0, 1),
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      };
      mockChromeStorage({ [`coupons_${domain}`]: expiredData });
      mockFetch({ data: mockCoupons });

      const coupons = await fetchCouponsForDomain(domain);

      expect(coupons).toEqual(mockCoupons);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return empty array for 404 response', async () => {
      mockFetch(null, false, 404);

      const coupons = await fetchCouponsForDomain(domain);

      expect(coupons).toEqual([]);
    });

    it('should throw error for other API errors', async () => {
      mockFetch(null, false, 500);

      await expect(fetchCouponsForDomain(domain)).rejects.toThrow('API error: 500');
    });

    it('should retry on network failure', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: mockCoupons }),
        } as Response);
      });

      const coupons = await fetchCouponsForDomain(domain);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(coupons).toEqual(mockCoupons);
    });

    it('should throw after max retries', async () => {
      mockFetchError(new Error('Network error'));

      await expect(fetchCouponsForDomain(domain)).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should cache successful responses', async () => {
      mockFetch({ data: mockCoupons });

      await fetchCouponsForDomain(domain);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          [`coupons_${domain}`]: expect.objectContaining({
            data: mockCoupons,
            timestamp: expect.any(Number),
          }),
        }),
      );
    });
  });
});
