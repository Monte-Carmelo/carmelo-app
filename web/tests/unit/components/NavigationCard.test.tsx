import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { NavigationCard } from '@/components/dashboard/NavigationCard';

describe('NavigationCard Component', () => {
  it('renders title and icon', () => {
    render(<NavigationCard title="GC" icon={Users} href="/gc" />);
    expect(screen.getByText('GC')).toBeInTheDocument();
    // Icon rendered (check svg presence)
    const svg = screen.getByRole('link').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('navigates to href on click', () => {
    render(<NavigationCard title="GC" icon={Users} href="/gc" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/gc');
  });

  it('displays description when provided', () => {
    render(
      <NavigationCard
        title="GC"
        icon={Users}
        href="/gc"
        description="Gerencie grupos"
      />
    );
    expect(screen.getByText('Gerencie grupos')).toBeInTheDocument();
  });
});
