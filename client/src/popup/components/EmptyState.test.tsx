import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('should render generic message without domain', () => {
    render(<EmptyState />);

    expect(screen.getByText('No Coupons Available')).toBeInTheDocument();
    expect(screen.getByText('No coupon codes are available for this website.')).toBeInTheDocument();
  });

  it('should render domain-specific message when domain is provided', () => {
    render(<EmptyState domain="example.com" />);

    expect(screen.getByText('No Coupons Available')).toBeInTheDocument();
    expect(screen.getByText(/We don't have any coupon codes for example.com yet/)).toBeInTheDocument();
  });

  it('should render help text about contributing', () => {
    render(<EmptyState />);

    expect(screen.getByText(/Check back later or help contribute/)).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(<EmptyState />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
