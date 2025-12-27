export default function SettingsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-gray-600">Manage tenants, roles, branding, and security.</p>
      <div className="rounded border bg-white p-4 text-sm text-gray-700">
        Tenant management lives under <a className="text-blue-600 underline" href="/settings/tenants">Settings / Tenants</a>.
        Additional settings panels will be added here.
      </div>
    </div>
  );
}
