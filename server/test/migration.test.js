import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const { openDatabase } = require('../db');

// The schema server/db.js created before the database was versioned.
const UNVERSIONED_SCHEMA = `
    CREATE TABLE cards (id TEXT PRIMARY KEY, name TEXT NOT NULL, issuer TEXT NOT NULL, last4 TEXT NOT NULL,
        color TEXT NOT NULL, cardHolder TEXT, notes TEXT, card_type_id TEXT);
    CREATE TABLE offers (id TEXT PRIMARY KEY, merchantName TEXT NOT NULL, description TEXT NOT NULL, terms TEXT,
        category TEXT NOT NULL, expiryDate TEXT, url TEXT);
    CREATE TABLE tracked_offers (id TEXT PRIMARY KEY, offerId TEXT NOT NULL, cardId TEXT NOT NULL,
        status TEXT NOT NULL, dateAdded TEXT NOT NULL);
    CREATE TABLE card_types (id TEXT PRIMARY KEY, name TEXT NOT NULL, issuer TEXT NOT NULL, color TEXT);
    CREATE TABLE rewards (id TEXT PRIMARY KEY, cardTypeId TEXT NOT NULL, category TEXT NOT NULL,
        rewardValue REAL NOT NULL, rewardUnit TEXT NOT NULL, description TEXT);

    INSERT INTO card_types VALUES ('t1', 'Gold', 'Amex', NULL);
    INSERT INTO cards VALUES ('c1', 'Gold', 'Amex', '1234', '#52525B', '', '', 't1');
    INSERT INTO cards VALUES ('c2', 'Old', 'Chase', '9999', '#0A4F89', '', '', 'deleted-type');
    INSERT INTO offers VALUES ('o1', 'Best Buy', 'Spend $100', '', 'Shopping', '2030-01-31', 'https://example.com');
    INSERT INTO tracked_offers VALUES ('x1', 'o1', 'c1', 'Used', '2029-12-01');
    INSERT INTO tracked_offers VALUES ('x2', 'o1', 'c1', 'Added', '2029-12-02');
    INSERT INTO tracked_offers VALUES ('x3', 'o1', 'deleted-card', 'Added', '2029-12-03');
    INSERT INTO rewards VALUES ('r1', 't1', 'Dining', 4, '%', '');
    INSERT INTO rewards VALUES ('r2', 'deleted-type', 'Dining', 1, '%', '');
`;

let dir;
let dbPath;

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmot-test-'));
    dbPath = path.join(dir, 'database.sqlite');
});

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
});

describe('openDatabase', () => {
    it('creates the schema in a new file', () => {
        const db = openDatabase(dbPath);

        expect(db.pragma('user_version', { simple: true })).toBe(1);
        expect(db.prepare('SELECT COUNT(*) FROM cards').pluck().get()).toBe(0);
        expect(fs.existsSync(`${dbPath}.v0.bak`)).toBe(false);
        db.close();
    });

    it('rebuilds an unversioned database and keeps its valid rows', () => {
        const old = new Database(dbPath);
        old.exec(UNVERSIONED_SCHEMA);
        old.close();

        const db = openDatabase(dbPath);
        const all = (sql) => db.prepare(sql).all();

        expect(all('SELECT id, cardTypeId FROM cards ORDER BY id')).toEqual([
            { id: 'c1', cardTypeId: 't1' },
            { id: 'c2', cardTypeId: null },
        ]);
        expect(all('SELECT id, color FROM card_types')).toEqual([{ id: 't1', color: '#374151' }]);
        expect(all('SELECT id, status FROM tracked_offers')).toEqual([{ id: 'x1', status: 'Used' }]);
        expect(all('SELECT id FROM rewards')).toEqual([{ id: 'r1' }]);
        expect(all('SELECT url FROM offers')).toEqual([{ url: 'https://example.com' }]);
        expect(all("SELECT name FROM sqlite_master WHERE name LIKE 'legacy_%'")).toEqual([]);
        expect(db.pragma('foreign_key_check')).toEqual([]);
        db.close();
    });

    it('backs up an unversioned database before rebuilding it', () => {
        const old = new Database(dbPath);
        old.exec(UNVERSIONED_SCHEMA);
        old.close();

        openDatabase(dbPath).close();

        const backup = new Database(`${dbPath}.v0.bak`, { readonly: true });
        expect(backup.prepare('SELECT COUNT(*) FROM tracked_offers').pluck().get()).toBe(3);
        backup.close();
    });

    it('enforces foreign keys after opening', () => {
        const db = openDatabase(dbPath);

        expect(() => db.prepare("INSERT INTO rewards VALUES ('r', 'missing', 'Dining', 1, '%', '')").run()).toThrow(/FOREIGN KEY/);
        db.close();
    });

    it('leaves a current database untouched on reopen', () => {
        openDatabase(dbPath).close();
        const db = openDatabase(dbPath);

        expect(db.pragma('user_version', { simple: true })).toBe(1);
        expect(fs.existsSync(`${dbPath}.v1.bak`)).toBe(false);
        db.close();
    });
});
