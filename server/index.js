const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
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

const dbAllAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRunAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

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
    const sql = `UPDATE offers SET merchantName = ?, description = ?, terms = ?, category = ?, expiryDate = ?, url = ? WHERE id = ?`;
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

app.post('/api/import', (req, res) => {
    log('Starting data import...', {
        cards: req.body.cards?.length || 0,
        offers: req.body.offers?.length || 0,
        trackedOffers: req.body.trackedOffers?.length || 0
    });

    const { cards, offers, trackedOffers } = req.body;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        try {
            // Clear existing data
            db.run("DELETE FROM tracked_offers");
            db.run("DELETE FROM offers");
            db.run("DELETE FROM cards");

            // Insert Cards
            if (cards && Array.isArray(cards)) {
                const stmt = db.prepare("INSERT INTO cards (id, name, issuer, last4, color, cardHolder, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
                cards.forEach(card => {
                    stmt.run(card.id, card.name, card.issuer, card.last4, card.color, card.cardHolder || '', card.notes || '');
                });
                stmt.finalize();
            }

            // Insert Offers
            if (offers && Array.isArray(offers)) {
                const stmt = db.prepare("INSERT INTO offers (id, merchantName, description, terms, category, expiryDate, url) VALUES (?, ?, ?, ?, ?, ?, ?)");
                offers.forEach(offer => {
                    stmt.run(offer.id, offer.merchantName, offer.description, offer.terms, offer.category, offer.expiryDate, offer.url);
                });
                stmt.finalize();
            }

            // Insert Tracked Offers
            if (trackedOffers && Array.isArray(trackedOffers)) {
                const stmt = db.prepare("INSERT INTO tracked_offers (id, offerId, cardId, status, dateAdded) VALUES (?, ?, ?, ?, ?)");
                trackedOffers.forEach(to => {
                    stmt.run(to.id, to.offerId, to.cardId, to.status, to.dateAdded);
                });
                stmt.finalize();
            }

            db.run("COMMIT", (err) => {
                if (err) {
                    logError('Import commit failed', err);
                    res.status(500).json({ error: err.message });
                } else {
                    log('Data import completed successfully.');
                    res.json({ message: "Import successful" });
                }
            });

        } catch (err) {
            db.run("ROLLBACK");
            logError('Import failed, rolling back', err);
            res.status(500).json({ error: err.message });
        }
    });
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
        const result = await dbRunAsync(`DELETE FROM card_types WHERE id = ?`, req.params.id);
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

app.listen(PORT, () => {
    log(`Server is running on http://localhost:${PORT}`);
});
