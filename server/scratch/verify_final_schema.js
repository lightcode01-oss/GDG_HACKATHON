const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'crisis-ai.db');
const db = new Database(dbPath);

console.log("[STARTING SELF-HEALING MIGRATION TEST]");

// Re-run the core logic just for verification
function ensureColumnExists(table, column, type) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = info.some(col => col.name === column);
  if (!exists) {
    console.log(`[MIGRATION]: Adding column ${column} to table ${table}...`);
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }
}

// Ensure all exist
ensureColumnExists('users', 'full_name', 'TEXT');
ensureColumnExists('users', 'phone', 'TEXT');
ensureColumnExists('incidents', 'action_status', 'TEXT DEFAULT "pending"');

const columns = db.prepare("PRAGMA table_info(users)").all();
console.log("FINAL_USERS_COLUMNS:", columns.map(c => c.name).join(', '));

const iColumns = db.prepare("PRAGMA table_info(incidents)").all();
console.log("FINAL_INCIDENTS_COLUMNS:", iColumns.map(c => c.name).join(', '));

db.close();
