/**
 * Parse a single CSV line respecting double-quoted fields (and "" as escaped quote).
 */
function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let cell = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        if (line[i] === '"') {
          i++;
          break;
        }
        cell += line[i];
        i++;
      }
      out.push(cell);
    } else {
      let cell = "";
      while (i < line.length && line[i] !== ",") {
        cell += line[i];
        i++;
      }
      out.push(cell.trim());
      if (line[i] === ",") i++;
    }
  }
  return out;
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

/** Normalize years-producing value from CSV to our schema (3-5, 6-10, 10+). */
export function normalizeYearsProducing(value: string): string {
  const v = value.trim().toLowerCase();
  if (v.includes("10+") || v === "10+") return "10+";
  if (v.includes("6") && v.includes("10")) return "6-10";
  if (v.includes("3") && v.includes("5")) return "3-5";
  return "10+";
}
