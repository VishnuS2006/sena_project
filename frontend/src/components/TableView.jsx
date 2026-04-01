function TableView({ data, columns }) {
  if (!data || !data.length) {
    return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No rows available.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="w-full overflow-x-auto overscroll-x-contain">
        <table className="min-w-max divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.accessor} className="whitespace-nowrap px-5 py-4 font-semibold text-slate-600">
                  {column.Header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row[columns[0].accessor] ?? rowIndex}`} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.accessor} className="px-5 py-4 align-top text-slate-700">
                    <div className="min-w-[90px] break-words">
                      {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableView;
