'use client';

import { TenantSwitcher } from './tenantSwitcher';

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="w-full border-b px-4 py-2 flex items-center justify-between bg-white">
      <div className="text-sm text-gray-600">Admin Console</div>
      <div className="flex items-center gap-4">
        <TenantSwitcher />
        <div className="text-sm text-gray-800">{userEmail}</div>
      </div>
    </header>
  );
}
