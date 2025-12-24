import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorState from './ErrorState';

describe('ErrorState', () => {
  it('should render error message', () => {
    const error = new Error('Test error message');
    render(<ErrorState error={error} onRetry={() => {}} />);

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render default message when error has no message', () => {
    render(<ErrorState error={null} onRetry={() => {}} />);

    expect(screen.getByText('Failed to load coupons. Please try again.')).toBeInTheDocument();
  });

  it('should render retry button', () => {
    render(<ErrorState error={null} onRetry={() => {}} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState error={null} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render helper text about backend server', () => {
    render(<ErrorState error={null} onRetry={() => {}} />);

    expect(screen.getByText(/Make sure the backend server is running/)).toBeInTheDocument();
  });

  it('should render error icon', () => {
    const { container } = render(<ErrorState error={null} onRetry={() => {}} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
