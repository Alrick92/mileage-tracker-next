export function toCsv(
  rows: Array<Record<string, string | number | null | undefined>>,
  columns: Array<{ key: string; header: string }>,
): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(","))
    .join("\n");

  return body ? `${header}\n${body}\n` : `${header}\n`;
}
