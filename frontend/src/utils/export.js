export const exportToCsv = (filename, headers, data, rowMapper) => {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  
  const rows = [
    headers,
    ...data.map(rowMapper),
  ];
  
  const csv = '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
