import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CouponCard from './CouponCard';
import { mockCoupons } from '../../test/mockData';

describe('CouponCard', () => {
  const onCopy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  it('should render coupon code and description', () => {
    const coupon = mockCoupons[0];
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    expect(screen.getByText(coupon.code)).toBeInTheDocument();
    expect(screen.getByText(coupon.description)).toBeInTheDocument();
  });

  it('should render success rate badge for coupons with attempts', () => {
    const coupon = mockCoupons[0]; // 150 success, 10 failure = 93.75%
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    expect(screen.getByText(/94% success/)).toBeInTheDocument();
  });

  it('should display green badge for high success rate (>50%)', () => {
    const coupon = mockCoupons[0]; // 93.75% success
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    const badge = screen.getByText(/94% success/);
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should display yellow badge for medium success rate (25-50%)', () => {
    const coupon = mockCoupons[1]; // 80 success, 120 failure = 40%
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    const badge = screen.getByText(/40% success/);
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should display red badge for low success rate (<25%)', () => {
    const lowSuccessCoupon = {
      ...mockCoupons[0],
      successCount: 10,
      failureCount: 90, // 10% success
    };
    render(<CouponCard coupon={lowSuccessCoupon} onCopy={onCopy} />);

    const badge = screen.getByText(/10% success/);
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should show expired badge for expired coupons', () => {
    const coupon = mockCoupons[2]; // Expired coupon
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('should show "Expires Soon" warning for coupons expiring within 7 days', () => {
    const coupon = mockCoupons[3]; // Expires in 3 days
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    expect(screen.getByText('Expires Soon')).toBeInTheDocument();
  });

  it('should disable copy button for expired coupons', () => {
    const coupon = mockCoupons[2]; // Expired
    render(<CouponCard coupon={coupon} onCopy={onCopy} />);

    const copyButton = screen.getByRole('button', { name: /copy coupon code/i });
    expect(copyButton).toBeDisabled();
  });
});
