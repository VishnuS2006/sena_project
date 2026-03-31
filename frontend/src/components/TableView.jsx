function TableView({ data, columns }) {
  if (!data || !data.length) {
    return <div className="rounded-3xl bg-white p-6 shadow-soft">No rows available.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.accessor} className="px-6 py-4 font-medium text-slate-600">
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.accessor} className="px-6 py-4 text-slate-700">
                  {row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableView;
