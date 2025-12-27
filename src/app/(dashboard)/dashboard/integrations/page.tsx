'use client';

import Link from 'next/link';

export default function DashboardIntegrationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Integrations</h1>
      <p className="text-sm text-gray-600">Manage connections and channel mappings.</p>
      <Link className="px-3 py-1 bg-blue-600 text-white rounded text-sm" href="/integrations">
        Go to Integrations
      </Link>
    </div>
  );
}
