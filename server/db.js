const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const os = require('os');
const fs = require('fs');

const customDbPath = process.env.CCMOT_DB_PATH;

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

const defaultDataDir = path.join(os.homedir(), '.ccmot');
const dbPath = customDbPath || path.join(defaultDataDir, 'database.sqlite');
ensureDir(path.dirname(dbPath));

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Error enabling foreign keys', pragmaErr.message);
                return;
            }
            initDb();
        });
    }
});

function initDb() {
    db.serialize(() => {
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

        db.run(`CREATE TABLE IF NOT EXISTS offers (
            id TEXT PRIMARY KEY,
            merchantName TEXT NOT NULL,
            description TEXT NOT NULL,
            terms TEXT,
            category TEXT NOT NULL,
            expiryDate TEXT,
            url TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS tracked_offers (
            id TEXT PRIMARY KEY,
            offerId TEXT NOT NULL,
            cardId TEXT NOT NULL,
            status TEXT NOT NULL,
            dateAdded TEXT NOT NULL,
            FOREIGN KEY(offerId) REFERENCES offers(id) ON DELETE CASCADE,
            FOREIGN KEY(cardId) REFERENCES cards(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS card_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            issuer TEXT NOT NULL,
            color TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS rewards (
            id TEXT PRIMARY KEY,
            cardTypeId TEXT NOT NULL,
            category TEXT NOT NULL,
            rewardValue REAL NOT NULL,
            rewardUnit TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY(cardTypeId) REFERENCES card_types(id) ON DELETE CASCADE
        )`);

        ensureColumn('cards', 'card_type_id', 'TEXT');
        ensureColumn('card_types', 'color', 'TEXT');
    });
}

function ensureColumn(tableName, columnName, definition) {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) {
            console.error(`Error checking ${tableName}.${columnName}`, err);
            return;
        }

        if (!rows.some(row => row.name === columnName)) {
            console.log(`Migrating: Adding ${columnName} to ${tableName} table`);
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
        }
    });
}

module.exports = db;
