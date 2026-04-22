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

/**
 * Minimal RFC 4180-ish CSV parser. Handles quoted fields, escaped quotes
 * (`""`), and CRLF/LF/CR line endings. Returns rows as string arrays; the
 * caller is responsible for header-to-object mapping and value coercion.
 * Empty trailing lines are dropped. A BOM at the start of the input is
 * stripped.
 */
export function parseCsv(input: string): string[][] {
  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1);
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      pushField();
      pushRow();
      if (input[i + 1] === "\n") i += 2;
      else i += 1;
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
