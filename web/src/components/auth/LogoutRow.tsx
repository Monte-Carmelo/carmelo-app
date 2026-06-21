'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';

/** Linha "Sair" no padrão de conta do DS (tile danger + ação de logout). */
export function LogoutRow() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="flex w-full items-center gap-3.5 rounded-card bg-white px-4 py-3.5 text-left shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-soft text-danger">
        <LogOut className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[14px] font-semibold text-danger">
        {isLoading ? 'Saindo…' : 'Sair'}
      </span>
    </button>
  );
}
