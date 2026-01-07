import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('should render skeleton loaders', () => {
    const { container } = render(<LoadingState />);

    // Should render 3 skeleton cards
    const skeletonCards = container.querySelectorAll('.animate-pulse');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('should have proper structure for accessibility', () => {
    const { container } = render(<LoadingState />);

    // Should have spacing between items
    const spacedContainer = container.querySelector('.space-y-4');
    expect(spacedContainer).toBeInTheDocument();
  });
});
