import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renderiza o headline principal', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /gestão dos grupos de crescimento/i,
      }),
    ).toBeInTheDocument();
  });
});
