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
});

describe('MultiSelect', () => {
  it('renders available options when the input receives focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
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

    await user.click(screen.getByPlaceholderText('Selecione'));

    expect(await screen.findByText('Lider 1')).toBeInTheDocument();
    expect(screen.getByText('Supervisor 1')).toBeInTheDocument();
  });
});
