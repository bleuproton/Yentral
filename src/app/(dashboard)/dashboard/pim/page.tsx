'use client';

import Link from 'next/link';

export default function PimPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">PIM</h1>
      <p className="text-sm text-gray-600">Manage products, variants, and media.</p>
      <div className="flex gap-3 text-sm">
        <Link className="px-3 py-1 bg-blue-600 text-white rounded" href="/products">
          Go to Products
        </Link>
        <Link className="px-3 py-1 bg-gray-200 rounded" href="/inventory">
          Inventory
        </Link>
      </div>
    </div>
  );
}
