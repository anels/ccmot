const Database = require('better-sqlite3');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_DB_PATH = path.join(os.homedir(), '.ccmot', 'database.sqlite');

// Listed parents first, so rows can be copied in this order.
const TABLES = ['card_types', 'cards', 'offers', 'tracked_offers', 'rewards'];

const SCHEMA = `
    CREATE TABLE card_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        issuer TEXT NOT NULL,
        color TEXT NOT NULL
    );

    CREATE TABLE cards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        issuer TEXT NOT NULL,
        last4 TEXT NOT NULL,
        color TEXT NOT NULL,
        cardHolder TEXT,
        notes TEXT,
        cardTypeId TEXT REFERENCES card_types(id) ON DELETE SET NULL
    );

    CREATE TABLE offers (
        id TEXT PRIMARY KEY,
        merchantName TEXT NOT NULL,
        description TEXT NOT NULL,
        terms TEXT,
        category TEXT NOT NULL,
        expiryDate TEXT,
        url TEXT
    );

    CREATE TABLE tracked_offers (
        id TEXT PRIMARY KEY,
        offerId TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        cardId TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        UNIQUE (offerId, cardId)
    );

    CREATE TABLE rewards (
        id TEXT PRIMARY KEY,
        cardTypeId TEXT NOT NULL REFERENCES card_types(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        rewardValue REAL NOT NULL,
        rewardUnit TEXT NOT NULL,
        description TEXT
    );
`;

// Version 1 is the schema above. Databases written before versioning have the
// same tables without the constraints and with cards.card_type_id, so they are
// rebuilt. Rows the new constraints reject (a tracked offer whose card or offer
// is gone, a second tracked offer for the same card and offer, a reward whose
// card type is gone) were never shown by the app and are not copied.
function migrateToV1(db) {
    const existing = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all());
    const legacy = TABLES.filter(table => existing.has(table));

    for (const table of legacy) {
        db.exec(`ALTER TABLE ${table} RENAME TO legacy_${table}`);
    }
    db.exec(SCHEMA);

    const has = (table, column) => db.pragma(`table_info(legacy_${table})`).some(info => info.name === column);
    const copies = {
        card_types: () => `
            INSERT INTO card_types (id, name, issuer, color)
            SELECT id, name, issuer, ${has('card_types', 'color') ? "COALESCE(color, '#374151')" : "'#374151'"}
            FROM legacy_card_types`,
        cards: () => `
            INSERT INTO cards (id, name, issuer, last4, color, cardHolder, notes, cardTypeId)
            SELECT id, name, issuer, last4, color, cardHolder, notes,
                   ${has('cards', 'card_type_id') ? '(SELECT id FROM card_types WHERE id = card_type_id)' : 'NULL'}
            FROM legacy_cards`,
        offers: () => `
            INSERT INTO offers (id, merchantName, description, terms, category, expiryDate, url)
            SELECT id, merchantName, description, terms, category, expiryDate, ${has('offers', 'url') ? 'url' : 'NULL'}
            FROM legacy_offers`,
        tracked_offers: () => `
            INSERT OR IGNORE INTO tracked_offers (id, offerId, cardId, status, dateAdded)
            SELECT id, offerId, cardId, status, dateAdded
            FROM legacy_tracked_offers
            WHERE offerId IN (SELECT id FROM offers) AND cardId IN (SELECT id FROM cards)
            ORDER BY rowid`,
        rewards: () => `
            INSERT INTO rewards (id, cardTypeId, category, rewardValue, rewardUnit, description)
            SELECT id, cardTypeId, category, rewardValue, rewardUnit, description
            FROM legacy_rewards
            WHERE cardTypeId IN (SELECT id FROM card_types)`,
    };

    for (const table of legacy) {
        db.exec(copies[table]());
    }
    for (const table of legacy) {
        db.exec(`DROP TABLE legacy_${table}`);
    }
}

// MIGRATIONS[n] upgrades a database from user_version n to n + 1.
const MIGRATIONS = [migrateToV1];

function migrate(db) {
    const version = db.pragma('user_version', { simple: true });
    if (version >= MIGRATIONS.length) return;

    const hasData = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' LIMIT 1").get();
    if (hasData && !db.memory) {
        const backupPath = `${db.name}.v${version}.bak`;
        fs.copyFileSync(db.name, backupPath);
        console.log(`Database backed up to ${backupPath} before migrating`);
    }

    // SQLite ignores this pragma inside a transaction, and the rebuild needs it off.
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
        for (let from = version; from < MIGRATIONS.length; from++) {
            MIGRATIONS[from](db);
        }
        db.pragma(`user_version = ${MIGRATIONS.length}`);
    })();
    console.log(`Database migrated from version ${version} to ${MIGRATIONS.length}`);
}

function openDatabase(dbPath = process.env.CCMOT_DB_PATH || DEFAULT_DB_PATH) {
    if (dbPath !== ':memory:') {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    const db = new Database(dbPath);
    migrate(db);
    db.pragma('foreign_keys = ON');
    return db;
}

module.exports = { openDatabase };
