import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BranchCard } from '@/components/branch/branch-card';
import type { Branch } from '@/lib/db/schema';

const mockBranch: Branch = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Sandton Main Branch',
  address: '123 Sandton Drive, Johannesburg, 2196',
  openingTime: '08:00:00',
  closingTime: '17:00:00',
  timezone: 'Africa/Johannesburg',
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

describe('BranchCard', () => {
  it('renders branch name', () => {
    render(<BranchCard branch={mockBranch} />);
    expect(screen.getByText('Sandton Main Branch')).toBeInTheDocument();
  });

  it('renders branch address', () => {
    render(<BranchCard branch={mockBranch} />);
    expect(screen.getByText('123 Sandton Drive, Johannesburg, 2196')).toBeInTheDocument();
  });

  it('renders opening hours', () => {
    render(<BranchCard branch={mockBranch} />);
    expect(screen.getByText(/08:00\s*–\s*17:00/)).toBeInTheDocument();
  });

  it('has correct link to appointments page', () => {
    render(<BranchCard branch={mockBranch} />);
    const link = screen.getByRole('link', { name: /book appointment at sandton main branch/i });
    expect(link).toHaveAttribute('href', '/branches/appointments/550e8400-e29b-41d4-a716-446655440001');
  });
});