import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppData, CreditCard, TrackedOffer } from '../types';
import { api } from '../api/client';
import { useStore } from './store';

vi.mock('../api/client', () => ({
    api: Object.fromEntries([
        'getInitialData', 'importData', 'addCard', 'updateCard', 'deleteCard', 'saveOffer', 'deleteOffer',
        'addTrackedOffer', 'updateTrackedOfferStatus', 'deleteTrackedOffer',
        'addCardType', 'updateCardType', 'deleteCardType', 'addReward', 'deleteReward',
    ].map(name => [name, vi.fn()])),
}));

const empty = (): AppData => ({ cards: [], offers: [], trackedOffers: [], cardTypes: [], rewards: [] });
const card: CreditCard = { id: 'c1', name: 'Gold', issuer: 'Amex', last4: '1234', color: '#000000', cardTypeId: 't1' };
const offer = { id: 'o1', merchantName: 'Best Buy', description: 'd', terms: '', category: 'Shopping', expiryDate: '2030-01-31' };
const tracked: TrackedOffer = { id: 'x1', offerId: 'o1', cardId: 'c1', status: 'Added', dateAdded: '2030-01-01T00:00:00.000Z' };
const filled = (): AppData => ({
    cards: [card],
    offers: [offer],
    trackedOffers: [tracked],
    cardTypes: [{ id: 't1', name: 'Gold', issuer: 'Amex', color: '#B8860B' }],
    rewards: [{ id: 'r1', cardTypeId: 't1', category: 'Dining', rewardValue: 4, rewardUnit: '%', description: '' }],
});

const store = () => useStore.getState();
const data = () => store().exportData();
const down = () => Promise.reject(new Error('Failed to fetch'));

beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useStore.setState({ ...filled(), error: null });
});

describe('a write the server rejects', () => {
    const writes: [string, keyof typeof api, () => Promise<{ ok: boolean }>][] = [
        ['addCard', 'addCard', () => store().addCard({ ...card, id: undefined } as never)],
        ['updateCard', 'updateCard', () => store().updateCard('c1', { name: 'x' })],
        ['deleteCard', 'deleteCard', () => store().deleteCard('c1')],
        ['saveOffer', 'saveOffer', () => store().saveOffer(offer, [])],
        ['deleteOffer', 'deleteOffer', () => store().deleteOffer('o1')],
        ['trackOffer', 'addTrackedOffer', () => store().trackOffer('o1', 'c2')],
        ['updateOfferStatus', 'updateTrackedOfferStatus', () => store().updateOfferStatus('x1', 'Used')],
        ['deleteTrackedOffer', 'deleteTrackedOffer', () => store().deleteTrackedOffer('x1')],
        ['addCardType', 'addCardType', () => store().addCardType({ name: 'x', issuer: 'Amex', color: '' })],
        ['updateCardType', 'updateCardType', () => store().updateCardType('t1', { name: 'x' })],
        ['deleteCardType', 'deleteCardType', () => store().deleteCardType('t1')],
        ['addReward', 'addReward', () => store().addReward({ cardTypeId: 't1', category: 'Travel', rewardValue: 2, rewardUnit: '%' })],
        ['deleteReward', 'deleteReward', () => store().deleteReward('r1')],
    ];

    it.each(writes)('%s leaves the data alone with the backend down', async (_name, request, write) => {
        vi.mocked(api[request]).mockImplementation(down);
        vi.mocked(api.getInitialData).mockImplementation(down);

        const result = await write();

        expect(result).toEqual({ ok: false, error: 'Failed to fetch' });
        expect(data()).toEqual(filled());
        expect(store().error).toMatch(/\(Failed to fetch\)\. The change was not saved\.$/);
    });

    it('reloads, in case the data was stale', async () => {
        vi.mocked(api.deleteCard).mockRejectedValue(new Error('cards c1 not found'));
        vi.mocked(api.getInitialData).mockResolvedValue(empty());

        await store().deleteCard('c1');

        expect(data()).toEqual(empty());
    });

    it('keeps the saved result of a write running beside it', async () => {
        const server = filled();
        let release = () => {};
        vi.mocked(api.addTrackedOffer).mockImplementation(row => row.cardId === 'bad'
            ? Promise.reject(new Error('rejected'))
            : new Promise<unknown>(resolve => { release = () => resolve({}); }));
        vi.mocked(api.getInitialData).mockResolvedValue(server);

        const slow = store().trackOffer('o1', 'good');
        await store().trackOffer('o1', 'bad');
        release();
        await slow;

        expect(data().trackedOffers.map(row => row.cardId)).toEqual(['c1', 'good']);
    });
});

describe('a write the server accepts', () => {
    it('changes nothing until then', async () => {
        let accept = () => {};
        vi.mocked(api.addCard).mockReturnValue(new Promise<unknown>(resolve => { accept = () => resolve({}); }));

        const write = store().addCard({ name: 'New', issuer: 'Citi', last4: '9999', color: '#111111' });
        expect(data().cards).toHaveLength(1);
        accept();

        expect(await write).toEqual({ ok: true });
        expect(data().cards.map(row => row.name)).toEqual(['Gold', 'New']);
    });

    it('clears the message of an earlier failure', async () => {
        useStore.setState({ error: 'Failed to add card (Failed to fetch). The change was not saved.' });

        await store().deleteReward('r1');

        expect(store().error).toBeNull();
    });

    it('answers the id of a new card type', async () => {
        const result = await store().addCardType({ name: 'New', issuer: 'Citi', color: '' });

        const added = data().cardTypes[1];
        expect(result).toEqual({ ok: true, id: added.id });
        expect(added.color).toBe('#374151');
    });

    it('replaces an offer and its rows with what the server saved', async () => {
        const saved = { offer: { ...offer, description: 'new' }, trackedOffers: [{ ...tracked, id: 'x2', cardId: 'c2' }] };
        vi.mocked(api.saveOffer).mockResolvedValue({ data: saved });

        await store().saveOffer({ ...offer, description: 'new' }, ['c2'], 'o1');

        expect(api.saveOffer).toHaveBeenCalledWith(
            { ...offer, description: 'new' },
            { isNew: false, cardIds: ['c2'], seenRowIds: ['x1'] },
        );
        expect(data().offers).toEqual([saved.offer]);
        expect(data().trackedOffers).toEqual(saved.trackedOffers);
    });

    it('gives a new offer an id', async () => {
        vi.mocked(api.saveOffer).mockImplementation(async saved => ({ data: { offer: saved, trackedOffers: [] } }));
        const draft = { merchantName: 'New', description: 'd', terms: '', category: 'Shopping', expiryDate: '2030-01-31' };

        await store().saveOffer(draft, []);

        expect(data().offers).toHaveLength(2);
        expect(data().offers[1].id).toEqual(expect.any(String));
        expect(data().offers[1].id).not.toBe('o1');
    });

    it('removes with a card type what the database removes', async () => {
        await store().deleteCardType('t1');

        expect(data().cardTypes).toEqual([]);
        expect(data().rewards).toEqual([]);
        expect(data().cards[0].cardTypeId).toBeUndefined();
    });
});

describe('importData', () => {
    it('answers the server error without raising the banner', async () => {
        vi.mocked(api.importData).mockRejectedValue(new Error('cards[c1]: name is required'));
        vi.mocked(api.getInitialData).mockResolvedValue(filled());

        expect(await store().importData(empty())).toEqual({ ok: false, error: 'cards[c1]: name is required' });
        expect(store().error).toBeNull();
    });

    it('shows what the server holds afterwards', async () => {
        vi.mocked(api.getInitialData).mockResolvedValue(empty());

        expect(await store().importData(empty())).toEqual({ ok: true });
        expect(data()).toEqual(empty());
    });

    it('answers an unreadable backup as a failure', async () => {
        vi.mocked(api.getInitialData).mockResolvedValue(filled());

        const result = await store().importData({ cards: [null] } as never);

        expect(result.ok).toBe(false);
        expect(api.importData).not.toHaveBeenCalled();
    });
});
