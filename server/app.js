const { randomUUID } = require('crypto');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Listed parents first: import inserts in this order and clears in reverse.
// `key` is the resource's name in /api/initial-data and /api/import payloads.
// `parents` maps a foreign key field to the resource it points at.
const RESOURCES = [
    {
        key: 'cardTypes', path: 'card-types', table: 'card_types',
        columns: ['name', 'issuer', 'color'],
        required: ['name', 'color'],
    },
    {
        key: 'cards', path: 'cards', table: 'cards',
        columns: ['name', 'issuer', 'last4', 'color', 'cardHolder', 'notes', 'cardTypeId'],
        required: ['name', 'issuer', 'last4', 'color'],
        parents: { cardTypeId: 'cardTypes' },
        nullable: ['cardTypeId'],
    },
    {
        key: 'offers', path: 'offers', table: 'offers',
        columns: ['merchantName', 'description', 'terms', 'category', 'expiryDate', 'url'],
        required: ['merchantName', 'description'],
    },
    {
        key: 'trackedOffers', path: 'tracked-offers', table: 'tracked_offers',
        columns: ['offerId', 'cardId', 'status', 'dateAdded'],
        required: ['offerId', 'cardId'],
        parents: { offerId: 'offers', cardId: 'cards' },
    },
    {
        key: 'rewards', path: 'rewards', table: 'rewards',
        columns: ['cardTypeId', 'category', 'rewardValue', 'rewardUnit', 'description'],
        required: ['cardTypeId', 'category'],
        parents: { cardTypeId: 'cardTypes' },
        upsert: true,
    },
];

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const isScalar = (value) => value === null || typeof value === 'string' || typeof value === 'number';

// Named parameters for `fields` of `resource`, taken from an untrusted object.
function toParams(resource, source, fields) {
    if (source === null || typeof source !== 'object' || Array.isArray(source)) {
        throw new HttpError(400, `${resource.key}: expected an object`);
    }
    if (typeof source.id !== 'string' || !source.id) {
        throw new HttpError(400, `${resource.key}: id is required`);
    }
    const params = { id: source.id };
    for (const field of fields) {
        const value = source[field] ?? null;
        if (!isScalar(value)) {
            throw new HttpError(400, `${resource.key}: ${field} must be a string, a number or null`);
        }
        params[field] = value;
    }
    return params;
}

function createApp(db, { allowedOrigins, logRequests = true } = {}) {
    const app = express();
    app.use(cors({ origin: allowedOrigins }));
    app.use(express.json({ limit: '10mb' })); // backups exceed the 100kb default
    if (logRequests) app.use(morgan('dev'));

    const selectAll = {};
    const insert = {};
    for (const { table, columns, upsert } of RESOURCES) {
        selectAll[table] = db.prepare(`SELECT * FROM ${table}`);
        const conflict = upsert
            ? ` ON CONFLICT(id) DO UPDATE SET ${columns.map(column => `${column} = excluded.${column}`).join(', ')}`
            : '';
        insert[table] = db.prepare(
            `INSERT INTO ${table} (id, ${columns.join(', ')}) VALUES (@id, ${columns.map(column => `@${column}`).join(', ')})${conflict}`
        );
    }

    // Inserts a new row from an untrusted object and returns what was stored.
    function create(resource, source) {
        const params = toParams(resource, source, resource.columns);
        if (resource.required.some(field => !params[field])) {
            throw new HttpError(400, 'Missing required fields');
        }
        insert[resource.table].run(params);
        return params;
    }

    // Writes `fields` of an existing row and returns how many rows changed.
    function update({ table }, params, fields) {
        return db
            .prepare(`UPDATE ${table} SET ${fields.map(field => `${field} = @${field}`).join(', ')} WHERE id = @id`)
            .run(params)
            .changes;
    }

    for (const resource of RESOURCES) {
        const { path, table, columns } = resource;

        app.get(`/api/${path}`, (req, res) => {
            res.json({ data: selectAll[table].all() });
        });

        app.post(`/api/${path}`, (req, res) => {
            res.json({ data: create(resource, req.body ?? {}) });
        });

        // Updates only the fields present in the body.
        app.put(`/api/${path}/:id`, (req, res) => {
            const body = req.body ?? {};
            const fields = columns.filter(column => body[column] !== undefined);
            if (fields.length === 0) {
                throw new HttpError(400, 'No updatable fields in request');
            }
            const changes = update(resource, toParams(resource, { ...body, id: req.params.id }, fields), fields);
            if (changes === 0) {
                throw new HttpError(404, `${path} ${req.params.id} not found`);
            }
            res.json({ changes });
        });

        app.delete(`/api/${path}/:id`, (req, res) => {
            const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
            if (result.changes === 0) {
                throw new HttpError(404, `${path} ${req.params.id} not found`);
            }
            res.json({ changes: result.changes });
        });
    }

    const offers = RESOURCES.find(resource => resource.key === 'offers');
    const offerById = db.prepare('SELECT * FROM offers WHERE id = ?');
    const trackedByOffer = db.prepare('SELECT * FROM tracked_offers WHERE offerId = ?');
    const untrack = db.prepare('DELETE FROM tracked_offers WHERE id = ?');

    // Saves an offer and the cards that track it: rows on kept cards keep their
    // status, cards without a row get one as Added, and the rows in `seenRowIds`
    // whose card is not in `cardIds` are removed. A row the caller never saw is
    // kept, so an out-of-date caller cannot delete it. Everything happens or
    // nothing does.
    const saveOfferWithCards = db.transaction((id, { offer, cardIds, isNew, seenRowIds }) => {
        if (isNew) {
            create(offers, { ...offer, id });
        } else {
            if (!offerById.get(id)) {
                throw new HttpError(404, `offers ${id} not found`);
            }
            const fields = offers.columns.filter(column => offer[column] !== undefined);
            if (fields.length > 0) update(offers, toParams(offers, { ...offer, id }, fields), fields);
        }

        const wanted = new Set(cardIds);
        const seen = new Set(seenRowIds);
        for (const row of trackedByOffer.all(id)) {
            if (!wanted.delete(row.cardId) && seen.has(row.id)) untrack.run(row.id);
        }
        for (const cardId of wanted) {
            insert.tracked_offers.run({
                id: randomUUID(), offerId: id, cardId, status: 'Added', dateAdded: new Date().toISOString(),
            });
        }

        return { offer: offerById.get(id), trackedOffers: trackedByOffer.all(id) };
    });

    const isIdList = (value) => Array.isArray(value) && value.every(id => typeof id === 'string' && id);

    app.put('/api/offers/:id/with-cards', (req, res) => {
        const body = req.body ?? {};
        for (const field of ['cardIds', 'seenRowIds']) {
            if (!isIdList(body[field])) {
                throw new HttpError(400, `${field} must be an array of ids`);
            }
        }
        if (body.offer === null || typeof body.offer !== 'object' || Array.isArray(body.offer)) {
            throw new HttpError(400, 'offer must be an object');
        }
        if (typeof body.isNew !== 'boolean') {
            throw new HttpError(400, 'isNew must be true or false');
        }
        res.json({ data: saveOfferWithCards(req.params.id, body) });
    });

    app.get('/api/initial-data', (req, res) => {
        res.json(Object.fromEntries(RESOURCES.map(({ key, table }) => [key, selectAll[table].all()])));
    });

    const replaceAll = db.transaction((data) => {
        for (const { table } of [...RESOURCES].reverse()) {
            db.prepare(`DELETE FROM ${table}`).run();
        }
        // Backups written before the constraints existed can point at deleted rows
        // or repeat a card and offer pair. Those rows get the treatment the schema
        // migration gives them: the link is cleared where it is optional, otherwise
        // the row is skipped.
        const ids = {};
        const trackedPairs = new Set();
        for (const resource of RESOURCES) {
            const { key, parents = {}, nullable = [] } = resource;
            ids[key] = new Set();
            for (const row of data[key]) {
                const params = toParams(resource, row, resource.columns);
                const dangling = Object.keys(parents).filter(field => !ids[parents[field]].has(params[field]));
                if (dangling.some(field => !nullable.includes(field))) continue;
                for (const field of dangling) params[field] = null;
                if (key === 'trackedOffers') {
                    const pair = JSON.stringify([params.offerId, params.cardId]);
                    if (trackedPairs.has(pair)) continue;
                    trackedPairs.add(pair);
                }
                insert[resource.table].run(params);
                ids[key].add(params.id);
            }
        }
    });

    // Replaces every table with the payload, or changes nothing if any row is rejected.
    app.post('/api/import', (req, res) => {
        const body = req.body ?? {};
        const data = {};
        for (const { key } of RESOURCES) {
            data[key] = body[key] ?? [];
            if (!Array.isArray(data[key])) {
                throw new HttpError(400, `${key} must be an array`);
            }
        }
        replaceAll(data);
        res.json({ message: 'Import successful' });
    });

    // Express identifies an error handler by its four parameters.
    app.use((err, req, res, _next) => {
        const isConstraint = typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT');
        const status = err.status || (isConstraint ? 400 : 500);
        if (status >= 500) console.error(err);
        res.status(status).json({ error: err.message });
    });

    return app;
}

module.exports = { createApp };
