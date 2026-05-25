import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { exec, query } from "@/lib/db";

const TABLES = [
  "settings",
  "schedule_template",
  "sessions",
  "mocks",
  "notes",
  "focus_sessions",
  "reflections",
  "skill_targets",
  "achievements",
  "xp_log",
];

export async function exportBackup(): Promise<void> {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    data[t] = await query<unknown>(`SELECT * FROM ${t}`);
  }
  const path = await save({
    title: "Export ASCEND backup",
    defaultPath: `ascend-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path) return;
  await writeTextFile(path, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2));
}

export async function importBackup(): Promise<void> {
  const selected = await open({
    title: "Import ASCEND backup",
    multiple: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!selected || Array.isArray(selected)) return;
  const text = await readTextFile(selected);
  const parsed = JSON.parse(text) as { data: Record<string, Array<Record<string, unknown>>> };
  if (!parsed?.data) throw new Error("Invalid backup file");
  for (const table of TABLES) {
    const rows = parsed.data[table];
    if (!rows || rows.length === 0) continue;
    await exec(`DELETE FROM ${table}`);
    for (const row of rows) {
      const keys = Object.keys(row);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map((k) => row[k]);
      await exec(
        `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})`,
        values,
      );
    }
  }
}
