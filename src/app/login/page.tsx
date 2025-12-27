import Link from 'next/link';

export default function LoginPage() {
  const devBypass = process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === '1';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-gray-600">Please sign in to continue.</p>
        <Link
          href="/api/auth/signin"
          className="block text-center bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
        >
          Continue with NextAuth
        </Link>
        {devBypass && (
          <div className="text-xs text-gray-500 border-t pt-3">
            DEV_BYPASS_AUTH=1 enabled. You can navigate directly to{' '}
            <Link href="/dashboard" className="text-blue-600 underline">
              dashboard
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}
