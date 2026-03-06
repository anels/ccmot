const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const os = require('os');
const fs = require('fs');

// Support custom database path via environment variable
const customDbPath = process.env.CCMOT_DB_PATH;
let dbPath;

if (customDbPath) {
    // Use custom path from environment variable
    dbPath = customDbPath;
    // Ensure parent directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
} else {
    // Default to user home directory
    const dataDir = path.join(os.homedir(), '.ccmot');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'database.sqlite');
}

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Cards Table
        db.run(`CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            issuer TEXT NOT NULL,
            last4 TEXT NOT NULL,
            color TEXT NOT NULL,
            cardHolder TEXT,
            notes TEXT,
            card_type_id TEXT,
            FOREIGN KEY(card_type_id) REFERENCES card_types(id)
        )`);

        // Offers Table
        db.run(`CREATE TABLE IF NOT EXISTS offers (
            id TEXT PRIMARY KEY,
            merchantName TEXT NOT NULL,
            description TEXT NOT NULL,
            terms TEXT,
            category TEXT NOT NULL,
            expiryDate TEXT,
            url TEXT
        )`);

        // Tracked Offers Table
        db.run(`CREATE TABLE IF NOT EXISTS tracked_offers (
            id TEXT PRIMARY KEY,
            offerId TEXT NOT NULL,
            cardId TEXT NOT NULL,
            status TEXT NOT NULL,
            dateAdded TEXT NOT NULL,
            FOREIGN KEY(offerId) REFERENCES offers(id) ON DELETE CASCADE,
            FOREIGN KEY(cardId) REFERENCES cards(id) ON DELETE CASCADE
        )`);

        // Card Types Table
        db.run(`CREATE TABLE IF NOT EXISTS card_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            issuer TEXT NOT NULL,
            color TEXT NOT NULL
        )`);

        // Rewards Table
        db.run(`CREATE TABLE IF NOT EXISTS rewards (
            id TEXT PRIMARY KEY,
            cardTypeId TEXT NOT NULL,
            category TEXT NOT NULL,
            rewardValue REAL NOT NULL,
            rewardUnit TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY(cardTypeId) REFERENCES card_types(id) ON DELETE CASCADE
        )`);

        // Add columns if they don't exist (migrations)
        // Add card_type_id to cards if needed
        db.run(`PRAGMA user_version`, (err, row) => {
            if (err) {
                console.error("Error getting user_version", err);
                return;
            }
            // Simple migration check - if we need more complex ones we should use a proper migration system
            // For now, ensuring columns exist via ALTER TABLE if needed is safer but specialized.
            // Since we use IF NOT EXISTS for tables, that handles new DBs.
            // For existing DBs, we might need to add columns.

            // Check if card_type_id exists in cards
            db.all("PRAGMA table_info(cards)", (err, rows) => {
                if (!err && rows) {
                    const hasCardTypeId = rows.some(r => r.name === 'card_type_id');
                    if (!hasCardTypeId) {
                        console.log("Migrating: Adding card_type_id to cards table");
                        db.run("ALTER TABLE cards ADD COLUMN card_type_id TEXT");
                    }
                }
            });
            // Check if color exists in card_types
            db.all("PRAGMA table_info(card_types)", (err, rows) => {
                if (!err && rows) {
                    const hasColor = rows.some(r => r.name === 'color');
                    if (!hasColor) {
                        console.log("Migrating: Adding color to card_types table");
                        db.run("ALTER TABLE card_types ADD COLUMN color TEXT");
                    }
                }
            });
        });
    });
}

module.exports = db;
