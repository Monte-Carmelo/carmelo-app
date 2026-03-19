'use client';

import type { FormHTMLAttributes, ReactNode } from 'react';
import { useClientReady } from '@/lib/hooks/use-client-ready';

interface ClientFormShellProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  pending?: boolean;
}

export function ClientFormShell({
  children,
  pending = false,
  ...formProps
}: ClientFormShellProps) {
  const isClientReady = useClientReady();

  return (
    <form {...formProps}>
      <fieldset disabled={!isClientReady || pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
