const Database = require('better-sqlite3');
const path = require('path');

// Define the path for the database file within the backend directory
const dbPath = path.resolve(__dirname, 'qrcodes.db');

// Initialize the database connection
// The verbose option logs executed statements to the console, useful for debugging.
const db = new Database(dbPath, { verbose: console.log });

function initDb() {
  // Create 'files' table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT,
      custom_name TEXT,
      saved_filename TEXT UNIQUE,
      file_url TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create 'tags' table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );
  `);

  // Create 'file_tags' join table
  // This table links files to tags, establishing a many-to-many relationship.
  // ON DELETE CASCADE ensures that if a file or a tag is deleted,
  // the corresponding entries in this table are also automatically deleted.
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_tags (
      file_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (file_id, tag_id),
      FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized successfully.');
  return db;
}

// Initialize the database and create tables if they don't exist
// This function call ensures that the database schema is set up when the module is first loaded.
initDb();

// Export the db instance for use in other parts of the backend
module.exports = db;
