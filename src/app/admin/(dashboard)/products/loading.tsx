export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-ink-100" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-ink-100" />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Offers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3">
                  <div className="h-4 w-32 rounded bg-ink-100" />
                  <div className="mt-2 h-3 w-20 rounded bg-ink-100/70" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-3 w-20 rounded bg-ink-100" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-3 w-14 rounded bg-ink-100" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-3 w-6 rounded bg-ink-100" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-3 w-6 rounded bg-ink-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
