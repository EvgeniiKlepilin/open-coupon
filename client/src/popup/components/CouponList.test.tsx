import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CouponList from './CouponList';
import { mockCoupons, mockTab, mockInvalidTab } from '../../test/mockData';
import { mockFetch, mockChromeTabs, mockChromeStorage } from '../../test/testUtils';

// Mock the logo import
vi.mock('@/assets/logo.png', () => ({
  default: 'mocked-logo.png',
}));

describe('CouponList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChromeStorage({});
  });

  describe('Initial Load', () => {
    it('should show loading state initially', () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      // Should show loading skeleton
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should display domain in header after loading', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText('example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Coupon Fetch', () => {
    it('should display coupons after successful fetch', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText(mockCoupons[0].code)).toBeInTheDocument();
        expect(screen.getByText(mockCoupons[1].code)).toBeInTheDocument();
      });
    });

    it('should display coupon count', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText(/Found 4 coupons for this site/)).toBeInTheDocument();
      });
    });

    it('should display singular "coupon" for single coupon', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: [mockCoupons[0]] });

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText(/Found 1 coupon for this site/)).toBeInTheDocument();
      });
    });

    it('should sort coupons by success count DESC', async () => {
      mockChromeTabs([mockTab]);
      const unsortedCoupons = [...mockCoupons].reverse();
      mockFetch({ data: unsortedCoupons });

      render(<CouponList />);

      await waitFor(() => {
        const couponCodes = screen.getAllByRole('button', { name: /copy/i })
          .map(btn => btn.closest('.bg-white'))
          .map(card => card?.querySelector('code')?.textContent);

        // Should be sorted by successCount (200, 150, 80, 50)
        expect(couponCodes[0]).toBe('EXPIRED10'); // 200 success
        expect(couponCodes[1]).toBe('SAVE20'); // 150 success
        expect(couponCodes[2]).toBe('FREESHIP'); // 80 success
        expect(couponCodes[3]).toBe('EXPIRING30'); // 50 success
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no coupons found', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: [] });

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText('No Coupons Available')).toBeInTheDocument();
      });
    });

    it('should show empty state for 404 response', async () => {
      mockChromeTabs([mockTab]);
      mockFetch(null, false, 404);

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText('No Coupons Available')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error state on API failure', async () => {
      mockChromeTabs([mockTab]);
      mockFetch(null, false, 500);

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      });
    });

    it('should show error for invalid URL', async () => {
      mockChromeTabs([mockInvalidTab]);

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
        expect(screen.getByText(/Invalid page/)).toBeInTheDocument();
      });
    });

    it('should show error when no tab found', async () => {
      mockChromeTabs([]);

      render(<CouponList />);

      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      const user = userEvent.setup();
      mockChromeTabs([mockTab]);

      // First call fails
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Server Error',
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: mockCoupons }),
        } as Response);
      });

      render(<CouponList />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should now show coupons
      await waitFor(() => {
        expect(screen.getByText(mockCoupons[0].code)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      await waitFor(() => {
        const refreshButton = screen.getByLabelText('Refresh coupons');
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('should disable refresh button while loading', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      const refreshButton = screen.getByLabelText('Refresh coupons');
      expect(refreshButton).toBeDisabled();
    });

    it('should show spinner animation on refresh button when loading', async () => {
      mockChromeTabs([mockTab]);
      mockFetch({ data: mockCoupons });

      render(<CouponList />);

      const refreshButton = screen.getByLabelText('Refresh coupons');
      const svg = refreshButton.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });
  });

});
