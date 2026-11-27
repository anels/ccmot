import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const request = require('supertest');
const { openDatabase } = require('../db');
const { createApp } = require('../app');

const cardType = { id: 't1', name: 'Gold', issuer: 'Amex', color: '#52525B' };
const card = { id: 'c1', name: 'Gold', issuer: 'Amex', last4: '1234', color: '#52525B', cardTypeId: 't1' };
const offer = { id: 'o1', merchantName: 'Best Buy', description: 'Spend $100, get $20', terms: '', category: 'Shopping', expiryDate: '2030-01-31', url: 'https://example.com/o1' };
const tracked = { id: 'x1', offerId: 'o1', cardId: 'c1', status: 'Added', dateAdded: '2029-12-01T00:00:00.000Z' };
const reward = { id: 'r1', cardTypeId: 't1', category: 'Dining', rewardValue: 4, rewardUnit: '%', description: '' };

const backup = () => ({ cardTypes: [cardType], cards: [card], offers: [offer], trackedOffers: [tracked], rewards: [reward] });

let api;

const seed = async () => {
    await api.post('/api/import').send(backup()).expect(200);
};
const initialData = async () => (await api.get('/api/initial-data').expect(200)).body;

beforeEach(() => {
    api = request(createApp(openDatabase(':memory:'), { logRequests: false }));
});

describe('resources', () => {
    it('creates and lists a row with camelCase fields', async () => {
        await api.post('/api/card-types').send(cardType).expect(200);
        await api.post('/api/cards').send(card).expect(200);

        const { body } = await api.get('/api/cards').expect(200);
        expect(body.data).toEqual([{ ...card, cardHolder: null, notes: null }]);
    });

    it('rejects a create with a missing required field', async () => {
        const { body } = await api.post('/api/cards').send({ ...card, cardTypeId: null, last4: '' }).expect(400);
        expect(body.error).toBe('Missing required fields');
    });

    it('rejects a row that breaks a foreign key', async () => {
        await api.post('/api/cards').send(card).expect(400);
    });

    it('rejects a second tracked offer for the same card and offer', async () => {
        await seed();
        await api.post('/api/tracked-offers').send({ ...tracked, id: 'x2' }).expect(400);
    });

    it('updates only the fields in the request', async () => {
        await seed();
        await api.put('/api/offers/o1').send({ description: 'Spend $50, get $10' }).expect(200);

        const { offers } = await initialData();
        expect(offers[0]).toEqual({ ...offer, description: 'Spend $50, get $10' });
    });

    it('clears a nullable field when the request sends null', async () => {
        await seed();
        await api.put('/api/cards/c1').send({ cardTypeId: null }).expect(200);

        const { cards } = await initialData();
        expect(cards[0].cardTypeId).toBeNull();
    });

    it('answers 404 for an update or delete of an unknown id', async () => {
        await api.put('/api/offers/nope').send({ description: 'x' }).expect(404);
        await api.delete('/api/offers/nope').expect(404);
    });

    it('answers 400 for an update with no known field', async () => {
        await seed();
        await api.put('/api/offers/o1').send({ unknown: 1 }).expect(400);
    });

    it('saves a reward again under the same id', async () => {
        await seed();
        await api.post('/api/rewards').send({ ...reward, rewardValue: 5 }).expect(200);

        const { rewards } = await initialData();
        expect(rewards).toEqual([{ ...reward, rewardValue: 5 }]);
    });
});

describe('saving an offer with its cards', () => {
    const second = { ...card, id: 'c2', last4: '5678' };
    const put = (id, body) => api.put(`/api/offers/${id}/with-cards`).send(body);
    const create = (cardIds, fields = {}) =>
        put('o2', { offer: { ...offer, id: 'o2', ...fields }, cardIds, isNew: true, seenRowIds: [] });
    const change = (fields, cardIds, seenRowIds = ['x1']) =>
        put('o1', { offer: fields, cardIds, isNew: false, seenRowIds });

    beforeEach(async () => {
        await api.post('/api/import').send({ ...backup(), cards: [card, second], trackedOffers: [{ ...tracked, status: 'Used' }] }).expect(200);
    });

    it('creates an offer on the chosen cards as added', async () => {
        const { body } = await create(['c1', 'c2', 'c2']).expect(200);

        expect(body.data.offer).toEqual({ ...offer, id: 'o2' });
        expect(body.data.trackedOffers.map(row => [row.cardId, row.status])).toEqual([['c1', 'Added'], ['c2', 'Added']]);
        expect((await initialData()).trackedOffers).toHaveLength(3);
    });

    it('keeps the status of a kept card and removes the others', async () => {
        const kept = await change({ description: 'new' }, ['c1', 'c2']).expect(200);
        expect(kept.body.data.offer).toEqual({ ...offer, description: 'new' });
        expect(kept.body.data.trackedOffers.find(row => row.cardId === 'c1')).toEqual({ ...tracked, status: 'Used' });

        const moved = await change({}, ['c2']).expect(200);
        expect(moved.body.data.trackedOffers.map(row => row.cardId)).toEqual(['c2']);
    });

    it('keeps a row the caller has not seen', async () => {
        const { body } = await change({}, ['c2'], []).expect(200);

        expect(body.data.trackedOffers.map(row => row.cardId).sort()).toEqual(['c1', 'c2']);
    });

    it('saves an offer on no card', async () => {
        await change({}, []).expect(200);

        const data = await initialData();
        expect(data.trackedOffers).toEqual([]);
        expect(data.offers).toHaveLength(1);
    });

    it('changes nothing when a card does not exist', async () => {
        const before = await initialData();
        await change({ description: 'new' }, ['gone']).expect(400);
        await create(['gone']).expect(400);

        expect(await initialData()).toEqual(before);
    });

    it('does not bring back a deleted offer', async () => {
        await api.delete('/api/offers/o1').expect(200);
        await change({ ...offer }, ['c1']).expect(404);

        expect((await initialData()).offers).toEqual([]);
    });

    it('rejects a new offer with a missing required field or a taken id', async () => {
        await create([], { merchantName: '' }).expect(400);
        await put('o1', { offer, cardIds: [], isNew: true, seenRowIds: [] }).expect(400);
    });

    it('rejects an incomplete body', async () => {
        const body = { offer: {}, cardIds: [], isNew: false, seenRowIds: [] };
        for (const field of Object.keys(body)) {
            await put('o1', { ...body, [field]: undefined }).expect(400);
        }
        await put('o1', { ...body, cardIds: [7] }).expect(400);
    });
});

describe('cascades', () => {
    it('removes tracked offers with their card', async () => {
        await seed();
        await api.delete('/api/cards/c1').expect(200);

        const { trackedOffers, offers } = await initialData();
        expect(trackedOffers).toEqual([]);
        expect(offers).toHaveLength(1);
    });

    it('removes rewards and unlinks cards with their card type', async () => {
        await seed();
        await api.delete('/api/card-types/t1').expect(200);

        const { rewards, cards } = await initialData();
        expect(rewards).toEqual([]);
        expect(cards[0].cardTypeId).toBeNull();
    });
});

describe('import', () => {
    it('replaces all data', async () => {
        await seed();
        await api.post('/api/import').send({ ...backup(), offers: [], trackedOffers: [] }).expect(200);

        const data = await initialData();
        expect(data.offers).toEqual([]);
        expect(data.cards).toHaveLength(1);
    });

    it('keeps the existing data when a row is rejected', async () => {
        await seed();
        const broken = { ...backup(), offers: [offer, { ...offer, id: 'o2', merchantName: null }] };
        await api.post('/api/import').send(broken).expect(400);

        expect(await initialData()).toEqual({
            ...backup(),
            cards: [{ ...card, cardHolder: null, notes: null }],
        });
    });

    it('rejects a payload whose collection is not an array', async () => {
        const { body } = await api.post('/api/import').send({ cards: 'x' }).expect(400);
        expect(body.error).toBe('cards must be an array');
    });

    it('skips rows that point at a deleted row and unlinks a card from a deleted type', async () => {
        await api.post('/api/import').send({
            ...backup(),
            cards: [card, { ...card, id: 'c2', cardTypeId: 'gone' }],
            trackedOffers: [tracked, { ...tracked, id: 'x2', offerId: 'gone' }],
            rewards: [reward, { ...reward, id: 'r2', cardTypeId: 'gone' }],
        }).expect(200);

        const data = await initialData();
        expect(data.cards.map(row => row.cardTypeId)).toEqual(['t1', null]);
        expect(data.trackedOffers.map(row => row.id)).toEqual(['x1']);
        expect(data.rewards.map(row => row.id)).toEqual(['r1']);
    });

    it('keeps the first of two tracked offers for the same card and offer', async () => {
        await api.post('/api/import').send({ ...backup(), trackedOffers: [tracked, { ...tracked, id: 'x2' }] }).expect(200);

        const { trackedOffers } = await initialData();
        expect(trackedOffers.map(row => row.id)).toEqual(['x1']);
    });

    it('accepts a backup larger than 100kb', async () => {
        const offers = Array.from({ length: 400 }, (_, i) => ({ ...offer, id: `o${i}`, terms: 'x'.repeat(300) }));
        await api.post('/api/import').send({ ...backup(), offers, trackedOffers: [] }).expect(200);

        expect((await initialData()).offers).toHaveLength(400);
    });
});
