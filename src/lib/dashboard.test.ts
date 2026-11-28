import { describe, expect, it } from 'vitest';
import type { AppData, Offer, OfferStatus, TrackedOffer } from '../types';
import { buildDashboardView, buildOffersExport, type DashboardFilter } from './dashboard';

const today = new Date(2030, 0, 31, 15, 0, 0);

const offer = (id: string, overrides: Partial<Offer> = {}): Offer => ({
    id, merchantName: id, description: 'Spend $100, get $20', terms: '', category: 'Shopping', expiryDate: '2030-02-28', ...overrides,
});
const tracked = (id: string, offerId: string, status: OfferStatus = 'Added'): TrackedOffer => ({
    id, offerId, cardId: 'c1', status, dateAdded: '2030-01-01T00:00:00.000Z',
});

const data = (overrides: Partial<AppData> = {}): AppData => ({
    cards: [{ id: 'c1', name: 'Everyday', issuer: 'Amex', last4: '1234', color: '#000000' }],
    cardTypes: [{ id: 't1', name: 'Gold', issuer: 'Amex', color: '#B8860B' }],
    rewards: [],
    offers: [],
    trackedOffers: [],
    ...overrides,
});

const view = (input: AppData, filter: Partial<DashboardFilter> = {}) =>
    buildDashboardView(input, { searchTerm: '', category: null, ...filter }, today);

const ids = (items: { id: string }[]) => items.map(item => item.id);

describe('buildDashboardView', () => {
    const everyStatus = data({
        offers: [offer('live'), offer('past', { expiryDate: '2030-01-30' }), offer('used', { expiryDate: '2030-01-30' }), offer('won')],
        trackedOffers: [tracked('a', 'live'), tracked('b', 'past'), tracked('c', 'used', 'Used'), tracked('d', 'won', 'Awarded')],
    });

    it('lists every tracked offer in exactly one place', () => {
        const result = view(everyStatus);

        expect(result.sections.map(section => ids(section.active))).toEqual([['a']]);
        expect(ids(result.expired)).toEqual(['b']);
        expect(ids(result.used)).toEqual(['c']);
        expect(ids(result.awarded)).toEqual(['d']);
        expect(result.counts).toEqual({ active: 1, used: 1, awarded: 1, cards: 1 });
    });

    it('leaves out a tracked offer whose card is gone', () => {
        const result = view({ ...everyStatus, cards: [] });

        expect([result.sections, result.expired, result.used, result.awarded]).toEqual([[], [], [], []]);
    });

    it('keeps the totals when a search narrows the lists', () => {
        const result = view(everyStatus, { searchTerm: 'live' });

        expect(result.expired).toEqual([]);
        expect(result.counts).toMatchObject({ active: 1, used: 1, awarded: 1 });
    });

    it('searches an offer by its terms and its card', () => {
        const input = data({ offers: [offer('o', { terms: 'online only' })], trackedOffers: [tracked('a', 'o')] });

        expect(view(input, { searchTerm: 'ONLINE' }).sections).toHaveLength(1);
        expect(view(input, { searchTerm: 'everyday' }).sections).toHaveLength(1);
    });

    it('counts a matching reward as a match', () => {
        const result = view(data({
            rewards: [{ id: 'r1', cardTypeId: 't1', category: 'Dining', rewardValue: 4, rewardUnit: 'x', description: '' }],
        }), { searchTerm: 'gold' });

        expect(result.sections.map(section => section.category)).toEqual(['Dining']);
        expect(result.hasMatches).toBe(true);
    });

    it('counts a catalog offer as a match', () => {
        const result = view(data({ offers: [offer('Bookshop')] }), { searchTerm: 'book' });

        expect(ids(result.catalog)).toEqual(['Bookshop']);
        expect(result.hasMatches).toBe(true);
    });

    it('has no matches when nothing matches', () => {
        expect(view(everyStatus, { searchTerm: 'zzz' }).hasMatches).toBe(false);
    });

    it('shows the catalog only for a search or a chosen category', () => {
        expect(view(everyStatus).catalog).toEqual([]);
        expect(view(everyStatus, { category: 'Shopping' }).catalog).toHaveLength(4);
    });

    it('shows a chosen category even when it is empty', () => {
        expect(view(data(), { category: 'Travel' }).sections).toEqual([{ category: 'Travel', rewards: [], active: [] }]);
    });

    it('offers the custom categories of untracked offers', () => {
        expect(view(data({ offers: [offer('o', { category: 'Hotels' })] })).categories).toContain('Hotels');
    });

    it('filters by a custom category named All', () => {
        const input = data({ offers: [offer('mine', { category: 'All' }), offer('other')] });

        expect(ids(view(input, { category: 'All' }).catalog)).toEqual(['mine']);
    });

    it('ranks the rewards of a category by value', () => {
        const reward = (id: string, rewardValue: number) => (
            { id, cardTypeId: 't1', category: 'Dining', rewardValue, rewardUnit: '%' as const, description: '' }
        );
        const result = view(data({ rewards: [reward('low', 1), reward('high', 5)] }));

        expect(ids(result.sections[0].rewards)).toEqual(['high', 'low']);
    });
});

describe('buildOffersExport', () => {
    it('writes each reward as it is shown', () => {
        const result = buildOffersExport(data({
            rewards: [{ id: 'r1', cardTypeId: 't1', category: 'Travel', rewardValue: 3, rewardUnit: 'points', description: '' }],
        }), today);

        expect(result.best_cards[0].reward).toBe('3 pts');
    });

    it('exports only the offers still waiting to be used', () => {
        const result = buildOffersExport(data({
            offers: [offer('live'), offer('past', { expiryDate: '2030-01-30' }), offer('used')],
            trackedOffers: [tracked('a', 'live'), tracked('b', 'past'), tracked('c', 'used', 'Used')],
        }), today);

        expect(result.active_offers).toEqual([{
            merchant: 'live', category: 'Shopping', offer: 'Spend $100, get $20', terms: '',
            card: 'Everyday (Amex ...1234)', expires: '2030-02-28',
        }]);
    });
});
