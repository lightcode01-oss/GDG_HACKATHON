const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'crisis-ai.db');
const db = new Database(dbPath);

console.log("[STARTING EXHAUSTIVE MIGRATION]");

function ensureColumnExists(table, column, type) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = info.some(col => col.name === column);
  if (!exists) {
    try {
      console.log(`[MIGRATION]: Adding column ${column} to table ${table}...`);
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
      console.log(`[OK] Added ${column}`);
    } catch (err) {
      console.error(`[ERROR] Failed to add ${column}:`, err.message);
    }
  } else {
    console.log(`[SKIP] Column ${column} already exists in ${table}`);
  }
}

// Exhaustive list for USERS
ensureColumnExists('users', 'full_name', 'TEXT');
ensureColumnExists('users', 'phone', 'TEXT');
ensureColumnExists('users', 'address', 'TEXT');
ensureColumnExists('users', 'dob', 'TEXT');
ensureColumnExists('users', 'country', 'TEXT');
ensureColumnExists('users', 'state', 'TEXT');
ensureColumnExists('users', 'gender', 'TEXT');
ensureColumnExists('users', 'profile_pic', 'TEXT');
ensureColumnExists('users', 'settings', 'TEXT');
ensureColumnExists('users', 'role', 'TEXT DEFAULT "citizen"');

// Exhaustive list for INCIDENTS
ensureColumnExists('incidents', 'action_status', 'TEXT DEFAULT "pending"');
ensureColumnExists('incidents', 'action_detail', 'TEXT');

const usersCols = db.prepare("PRAGMA table_info(users)").all();
console.log("FINAL_USERS_COLUMNS:", usersCols.map(c => c.name).join(', '));

db.close();
