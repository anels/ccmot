const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { AsyncLocalStorage } = require('node:async_hooks');
const db = require('./db');

const app = express();
const PORT = 3001;
// Loopback only by default: the API has no authentication.
const HOST = process.env.CCMOT_HOST || '127.0.0.1';
const ALLOWED_ORIGINS = (process.env.CCMOT_ALLOWED_ORIGINS
    || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
    .split(',').map(origin => origin.trim()).filter(Boolean);

// Middleware
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '10mb' })); // backups exceed the 100kb default
app.use(morgan('dev')); // Logs HTTP requests

// Utility for logging with timestamp
const log = (message, data) => {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
};

const logError = (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error);
};

// --- Database Helpers ---

// Every request shares one connection, so a statement issued while another
// request's transaction is open would join that transaction. Run each
// statement or transaction to completion before the next one starts.
const inTransaction = new AsyncLocalStorage();
let dbQueue = Promise.resolve();

const exclusive = (task) => {
    if (inTransaction.getStore()) return task();
    const result = dbQueue.then(task);
    dbQueue = result.catch(() => {});
    return result;
};

const dbAllAsync = (sql, params = []) => exclusive(() => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

const dbRunAsync = (sql, params = []) => exclusive(() => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
});

const withTransaction = (operation, rollbackMessage = 'Transaction rollback failed') => exclusive(() => inTransaction.run(true, async () => {
    let transactionStarted = false;
    try {
        await dbRunAsync("BEGIN IMMEDIATE TRANSACTION");
        transactionStarted = true;
        const result = await operation();
        await dbRunAsync("COMMIT");
        return result;
    } catch (err) {
        if (transactionStarted) {
            try {
                await dbRunAsync("ROLLBACK");
            } catch (rollbackErr) {
                logError(rollbackMessage, rollbackErr);
            }
        }
        throw err;
    }
}));

// --- Cards ---

app.get('/api/cards', async (req, res) => {
    log('Fetching all cards...');
    try {
        const rows = await dbAllAsync("SELECT * FROM cards");
        log(`Fetched ${rows.length} cards`);
        res.json({ data: rows });
    } catch (err) {
        logError('Fetching cards failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/cards', async (req, res) => {
    log('Adding new card...', req.body);
    const { id, name, issuer, last4, color, cardHolder, notes, card_type_id } = req.body;

    if (!id || !name || !issuer || !last4 || !color) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO cards (id, name, issuer, last4, color, cardHolder, notes, card_type_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, name, issuer, last4, color, cardHolder, notes, card_type_id];

    try {
        await dbRunAsync(sql, params);
        log('Card added successfully', { id });
        res.json({ message: "success", data: req.body });
    } catch (err) {
        logError('Adding card failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/cards/:id', async (req, res) => {
    log(`Updating card ${req.params.id}...`, req.body);
    const { name, issuer, last4, color, cardHolder, notes, card_type_id } = req.body;
    const sql = `UPDATE cards SET name = ?, issuer = ?, last4 = ?, color = ?, cardHolder = ?, notes = ?, card_type_id = ? WHERE id = ?`;
    const params = [name, issuer, last4, color, cardHolder, notes, card_type_id, req.params.id];

    try {
        const result = await dbRunAsync(sql, params);
        log(`Card ${req.params.id} updated successfully`);
        res.json({ message: "success", changes: result.changes });
    } catch (err) {
        logError(`Updating card ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/cards/:id', async (req, res) => {
    log(`Deleting card ${req.params.id}...`);
    try {
        const result = await dbRunAsync(`DELETE FROM cards WHERE id = ?`, req.params.id);
        log(`Card ${req.params.id} deleted successfully`);
        res.json({ message: "deleted", changes: result.changes });
    } catch (err) {
        logError(`Deleting card ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

// --- Offers ---

app.get('/api/offers', async (req, res) => {
    log('Fetching all offers...');
    try {
        const rows = await dbAllAsync("SELECT * FROM offers");
        log(`Fetched ${rows.length} offers`);
        res.json({ data: rows });
    } catch (err) {
        logError('Fetching offers failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/offers', async (req, res) => {
    log('Adding new offer...', req.body);
    const { id, merchantName, description, terms, category, expiryDate, url } = req.body;

    if (!id || !merchantName || !description) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO offers (id, merchantName, description, terms, category, expiryDate, url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, merchantName, description, terms, category, expiryDate, url];

    try {
        await dbRunAsync(sql, params);
        log('Offer added successfully', { id });
        res.json({ message: "success", data: req.body });
    } catch (err) {
        logError('Adding offer failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/offers/:id', async (req, res) => {
    log(`Updating offer ${req.params.id}...`, req.body);
    const { merchantName, description, terms, category, expiryDate, url } = req.body;
    const sql = `UPDATE offers SET merchantName = ?, description = ?, terms = ?, category = ?, expiryDate = ?, url = COALESCE(?, url) WHERE id = ?`;
    const params = [merchantName, description, terms, category, expiryDate, url, req.params.id];

    try {
        const result = await dbRunAsync(sql, params);
        log(`Offer ${req.params.id} updated successfully`);
        res.json({ message: "success", changes: result.changes });
    } catch (err) {
        logError(`Updating offer ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/offers/:id', async (req, res) => {
    log(`Deleting offer ${req.params.id}...`);
    try {
        const result = await dbRunAsync(`DELETE FROM offers WHERE id = ?`, req.params.id);
        log(`Offer ${req.params.id} deleted successfully`);
        res.json({ message: "deleted", changes: result.changes });
    } catch (err) {
        logError(`Deleting offer ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

// --- Tracked Offers ---

app.get('/api/tracked-offers', async (req, res) => {
    log('Fetching all tracked offers...');
    try {
        const rows = await dbAllAsync("SELECT * FROM tracked_offers");
        log(`Fetched ${rows.length} tracked offers`);
        res.json({ data: rows });
    } catch (err) {
        logError('Fetching tracked offers failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/tracked-offers', async (req, res) => {
    log('Tracking new offer...', req.body);
    const { id, offerId, cardId, status, dateAdded } = req.body;

    if (!id || !offerId || !cardId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO tracked_offers (id, offerId, cardId, status, dateAdded) VALUES (?, ?, ?, ?, ?)`;
    const params = [id, offerId, cardId, status, dateAdded];

    try {
        await dbRunAsync(sql, params);
        log('Offer tracked successfully', { id });
        res.json({ message: "success", data: req.body });
    } catch (err) {
        logError('Tracking offer failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/tracked-offers/:id', async (req, res) => {
    log(`Updating tracked offer status ${req.params.id}...`, req.body);
    const { status } = req.body;
    const sql = `UPDATE tracked_offers SET status = ? WHERE id = ?`;
    const params = [status, req.params.id];

    try {
        const result = await dbRunAsync(sql, params);
        log(`Tracked offer ${req.params.id} updated successfully`);
        res.json({ message: "success", changes: result.changes });
    } catch (err) {
        logError(`Updating tracked offer ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/tracked-offers/:id', async (req, res) => {
    log(`Deleting tracked offer ${req.params.id}...`);
    try {
        const result = await dbRunAsync(`DELETE FROM tracked_offers WHERE id = ?`, req.params.id);
        log(`Tracked offer ${req.params.id} deleted successfully`);
        res.json({ message: "deleted", changes: result.changes });
    } catch (err) {
        logError(`Deleting tracked offer ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

// --- Import ---

const readImportArray = (body, key) => {
    if (body[key] === undefined) return [];
    if (!Array.isArray(body[key])) {
        throw new Error(`${key} must be an array`);
    }
    return body[key];
};

app.post('/api/import', async (req, res) => {
    let cards;
    let offers;
    let trackedOffers;
    let cardTypes;
    let rewards;

    try {
        cards = readImportArray(req.body, 'cards');
        offers = readImportArray(req.body, 'offers');
        trackedOffers = readImportArray(req.body, 'trackedOffers');
        cardTypes = readImportArray(req.body, 'cardTypes');
        rewards = readImportArray(req.body, 'rewards');
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    log('Starting data import...', {
        cards: cards.length,
        offers: offers.length,
        trackedOffers: trackedOffers.length,
        cardTypes: cardTypes.length,
        rewards: rewards.length
    });

    try {
        await withTransaction(async () => {
            // Clear dependent tables before parent tables so foreign keys stay valid.
            await dbRunAsync("DELETE FROM tracked_offers");
            await dbRunAsync("DELETE FROM rewards");
            await dbRunAsync("DELETE FROM cards");
            await dbRunAsync("DELETE FROM offers");
            await dbRunAsync("DELETE FROM card_types");

            for (const cardType of cardTypes) {
                await dbRunAsync(
                    "INSERT INTO card_types (id, name, issuer, color) VALUES (?, ?, ?, ?)",
                    [cardType.id, cardType.name, cardType.issuer, cardType.color]
                );
            }

            for (const card of cards) {
                const cardTypeId = card.card_type_id ?? card.cardTypeId ?? null;
                await dbRunAsync(
                    "INSERT INTO cards (id, name, issuer, last4, color, cardHolder, notes, card_type_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [card.id, card.name, card.issuer, card.last4, card.color, card.cardHolder || '', card.notes || '', cardTypeId]
                );
            }

            for (const offer of offers) {
                await dbRunAsync(
                    "INSERT INTO offers (id, merchantName, description, terms, category, expiryDate, url) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [offer.id, offer.merchantName, offer.description, offer.terms, offer.category, offer.expiryDate, offer.url]
                );
            }

            for (const trackedOffer of trackedOffers) {
                await dbRunAsync(
                    "INSERT INTO tracked_offers (id, offerId, cardId, status, dateAdded) VALUES (?, ?, ?, ?, ?)",
                    [trackedOffer.id, trackedOffer.offerId, trackedOffer.cardId, trackedOffer.status, trackedOffer.dateAdded]
                );
            }

            for (const reward of rewards) {
                const cardTypeId = reward.card_type_id ?? reward.cardTypeId;
                const rewardValue = reward.reward_value ?? reward.rewardValue;
                const rewardUnit = reward.reward_unit ?? reward.rewardUnit;
                await dbRunAsync(
                    "INSERT INTO rewards (id, cardTypeId, category, rewardValue, rewardUnit, description) VALUES (?, ?, ?, ?, ?, ?)",
                    [reward.id, cardTypeId, reward.category, rewardValue, rewardUnit, reward.description || '']
                );
            }
        }, 'Import rollback failed');

        log('Data import completed successfully.');
        res.json({ message: "Import successful" });
    } catch (err) {
        logError('Import failed, rolling back', err);
        const status = err.code === 'SQLITE_CONSTRAINT' ? 400 : 500;
        res.status(status).json({ error: err.message });
    }
});

// --- Card Types ---

app.get('/api/card-types', async (req, res) => {
    log('Fetching all card types...');
    try {
        const rows = await dbAllAsync("SELECT * FROM card_types");
        log(`Fetched ${rows.length} card types`);
        res.json({ data: rows });
    } catch (err) {
        logError('Fetching card types failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/card-types', async (req, res) => {
    log('Adding new card type...', req.body);
    const { id, name, issuer, color } = req.body;

    if (!id || !name || !color) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO card_types (id, name, issuer, color) VALUES (?, ?, ?, ?)`;
    const params = [id, name, issuer, color];

    try {
        await dbRunAsync(sql, params);
        log('Card type added successfully', { id });
        res.json({ message: "success", data: req.body });
    } catch (err) {
        logError('Adding card type failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/card-types/:id', async (req, res) => {
    log(`Updating card type ${req.params.id}...`, req.body);
    const { name, issuer, color } = req.body;
    const sql = `UPDATE card_types SET name = ?, issuer = ?, color = ? WHERE id = ?`;
    const params = [name, issuer, color, req.params.id];

    try {
        const result = await dbRunAsync(sql, params);
        log(`Card type ${req.params.id} updated successfully`);
        res.json({ message: "success", changes: result.changes });
    } catch (err) {
        logError(`Updating card type ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/card-types/:id', async (req, res) => {
    log(`Deleting card type ${req.params.id}...`);
    try {
        const result = await withTransaction(async () => {
            await dbRunAsync(`UPDATE cards SET card_type_id = NULL WHERE card_type_id = ?`, [req.params.id]);
            await dbRunAsync(`DELETE FROM rewards WHERE cardTypeId = ?`, [req.params.id]);
            return dbRunAsync(`DELETE FROM card_types WHERE id = ?`, [req.params.id]);
        }, `Deleting card type ${req.params.id} rollback failed`);

        log(`Card type ${req.params.id} deleted successfully`);
        res.json({ message: "deleted", changes: result.changes });
    } catch (err) {
        logError(`Deleting card type ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

// --- Rewards ---

app.get('/api/rewards', async (req, res) => {
    log('Fetching all rewards...');
    try {
        const rows = await dbAllAsync("SELECT * FROM rewards");
        log(`Fetched ${rows.length} rewards`);
        res.json({ data: rows });
    } catch (err) {
        logError('Fetching rewards failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/rewards', async (req, res) => {
    log('Adding/Updating reward...', req.body);
    const { id, card_type_id, category, reward_value, reward_unit, description } = req.body;

    if (!id || !card_type_id || !category) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO rewards (id, cardTypeId, category, rewardValue, rewardUnit, description)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                    cardTypeId=excluded.cardTypeId,
                    category=excluded.category,
                    rewardValue=excluded.rewardValue,
                    rewardUnit=excluded.rewardUnit,
                    description=excluded.description`;
    const params = [id, card_type_id, category, reward_value, reward_unit, description];

    try {
        await dbRunAsync(sql, params);
        log('Reward saved successfully', { id });
        res.json({ message: "success", data: req.body });
    } catch (err) {
        logError('Saving reward failed', err);
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/rewards/:id', async (req, res) => {
    log(`Deleting reward ${req.params.id}...`);
    try {
        const result = await dbRunAsync(`DELETE FROM rewards WHERE id = ?`, req.params.id);
        log(`Reward ${req.params.id} deleted successfully`);
        res.json({ message: "deleted", changes: result.changes });
    } catch (err) {
        logError(`Deleting reward ${req.params.id} failed`, err);
        res.status(400).json({ error: err.message });
    }
});

// --- Initial Data (Bulk Fetch) ---

app.get('/api/initial-data', async (req, res) => {
    log('Starting initial data load...');

    try {
        const [cards, offers, trackedOffers, cardTypes, rewards] = await Promise.all([
            dbAllAsync("SELECT * FROM cards"),
            dbAllAsync("SELECT * FROM offers"),
            dbAllAsync("SELECT * FROM tracked_offers"),
            dbAllAsync("SELECT * FROM card_types"),
            dbAllAsync("SELECT * FROM rewards")
        ]);

        log(`Initial data: Loaded ${cards.length} cards, ${offers.length} offers, ${trackedOffers.length} tracked offers, ${cardTypes.length} card types, ${rewards.length} rewards`);

        res.json({
            cards: cards || [],
            offers: offers || [],
            trackedOffers: trackedOffers || [],
            cardTypes: cardTypes || [],
            rewards: rewards || []
        });

    } catch (err) {
        logError('Initial data: fetching failed', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, HOST, () => {
    log(`Server is running on http://${HOST}:${PORT}`);
});
