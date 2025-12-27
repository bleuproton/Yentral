// @ts-nocheck
export function DataTable({ columns, rows }: { columns: Array<{ key: string; label: string }>; rows: any[] }) {
  return (
    <table className="min-w-full text-sm border bg-white">
      <thead>
        <tr className="bg-gray-50 text-gray-700">
          {columns.map((c) => (
            <th key={c.key} className="px-3 py-2 text-left">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-t hover:bg-gray-50">
            {columns.map((c) => (
              <td key={c.key} className="px-3 py-2">
                {row[c.key] ?? '-'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
