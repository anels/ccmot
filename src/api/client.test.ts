import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';

const answer = (body: unknown, status = 200) =>
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

const offerRow = { id: 'o1', merchantName: 'Best Buy', description: 'd', terms: null, category: 'Shopping', expiryDate: null, url: null };
const offer = { id: 'o1', merchantName: 'Best Buy', description: 'd', terms: '', category: 'Shopping', expiryDate: '' };

afterEach(() => vi.unstubAllGlobals());

describe('server rows', () => {
    it('reads null columns as the app types them', async () => {
        answer({
            cards: [{ id: 'c1', cardHolder: null, notes: null, cardTypeId: null }],
            offers: [offerRow],
            trackedOffers: [],
            cardTypes: [],
            rewards: [{ id: 'r1', rewardValue: 0, rewardUnit: 'x', description: null }],
        });

        const data = await api.getInitialData();

        expect(data.cards).toStrictEqual([{ id: 'c1', cardHolder: '', notes: '' }]);
        expect(data.offers).toStrictEqual([offer]);
        expect(data.rewards).toStrictEqual([{ id: 'r1', rewardValue: 0, rewardUnit: 'x', description: '' }]);
    });

    it('files an offer without a category and reads a reward without a unit as percent', async () => {
        answer({
            cards: [],
            offers: [{ ...offerRow, category: '' }],
            trackedOffers: [],
            cardTypes: [],
            rewards: [{ id: 'r1', rewardValue: 2, rewardUnit: '', description: '' }],
        });

        const data = await api.getInitialData();

        expect(data.offers[0].category).toBe('Shopping');
        expect(data.rewards[0].rewardUnit).toBe('%');
    });

    it('reads a saved offer the same way', async () => {
        answer({ data: { offer: offerRow, trackedOffers: [] } });

        const { data } = await api.saveOffer(offer, { isNew: true, cardIds: [], seenRowIds: [] });

        expect(data.offer).toStrictEqual(offer);
    });

    it('rejects with the reason the server gave', async () => {
        answer({ error: 'offers[o1]: merchantName is required' }, 400);

        await expect(api.getInitialData()).rejects.toThrow('offers[o1]: merchantName is required');
    });
});
