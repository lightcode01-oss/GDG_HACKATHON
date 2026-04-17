const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'crisis-ai.db');
const db = new Database(dbPath);

const columns = db.prepare("PRAGMA table_info(users)").all();
console.log(JSON.stringify(columns, null, 2));
db.close();
