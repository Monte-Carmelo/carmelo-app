import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Logo } from '@/components/layout/Logo';

describe('Logo Component', () => {
  it('renders image with correct alt text', () => {
    render(<Logo />);
    const img = screen.getByAltText(/igreja monte carmelo/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('igreja-monte-carmelo.png'));
  });

  it('shows fallback text when image fails', async () => {
    render(<Logo />);
    const img = screen.getByAltText(/igreja monte carmelo/i);
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText('Igreja Monte Carmelo')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<Logo className="h-24" />);
    expect(container.firstChild).toHaveClass('h-24');
  });
});
