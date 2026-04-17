const Database = require('better-sqlite3');
const path = require('path');

// Initialize local SQLite database
const dbPath = path.resolve(__dirname, '..', 'crisis-ai.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // High performance mode

// Helper to ensure columns exist (Self-Healing Migration)
function ensureColumnExists(table, column, type) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = info.some(col => col.name === column);
  if (!exists) {
    console.log(`[MIGRATION]: Adding column ${column} to table ${table}...`);
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }
}

// Create tables with latest schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    dob TEXT,
    country TEXT,
    state TEXT,
    gender TEXT,
    profile_pic TEXT,
    settings TEXT,
    role TEXT DEFAULT 'citizen',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    action_status TEXT DEFAULT 'pending',
    action_detail TEXT,
    reported_by INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reported_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- RUN MIGRATIONS FOR EXISTING TABLES ---
try {
  // Users Migrations (Exhaustive)
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

  // Incidents Migrations (Exhaustive)
  ensureColumnExists('incidents', 'action_status', 'TEXT DEFAULT "pending"');
  ensureColumnExists('incidents', 'action_detail', 'TEXT');
} catch (err) {
  console.error("[ERROR]: Migration failed - ", err.message);
}

module.exports = db;
