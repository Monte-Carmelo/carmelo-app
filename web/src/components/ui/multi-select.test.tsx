import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './multi-select';

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('HTMLElement', HTMLElement);
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('MultiSelect', () => {
  it('renders available options when the field is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { container } = render(
      <MultiSelect
        options={[
          { value: '1', label: 'Lider 1' },
          { value: '2', label: 'Supervisor 1' },
        ]}
        selected={[]}
        onChange={onChange}
        placeholder="Selecione"
      />,
    );

    const field = container.querySelector('.group');
    if (!field) {
      throw new Error('MultiSelect root field not found');
    }

    await user.click(field);

    expect(await screen.findByText('Lider 1')).toBeInTheDocument();
    expect(screen.getByText('Supervisor 1')).toBeInTheDocument();
  });
});
