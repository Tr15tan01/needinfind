export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Settings</h1>
      <p className="mt-2 max-w-md text-sm text-ink-500">
        General site settings (via the <code>SiteSetting</code> key/value table) get a UI
        in Phase 11, during the security/performance hardening pass.
      </p>
    </div>
  );
}
