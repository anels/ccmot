import { describe, expect, it } from 'vitest';
import type { AppData } from '../types';
import { upgradeBackup } from './backup';

const upgrade = (data: unknown) => upgradeBackup(data as Partial<AppData>);

describe('upgradeBackup', () => {
    it('returns empty collections for an empty backup', () => {
        expect(upgrade({})).toEqual({ cards: [], offers: [], trackedOffers: [], cardTypes: [], rewards: [] });
    });

    it('fills the optional fields of a card', () => {
        const { cards } = upgrade({ cards: [{ id: 'c1', name: 'Gold', issuer: 'Amex', last4: '1234', color: '#000000' }] });

        expect(cards[0]).toMatchObject({ cardHolder: '', notes: '' });
        expect(cards[0].cardTypeId).toBeUndefined();
    });

    it('reads the card type from the old card_type_id field', () => {
        const { cards } = upgrade({ cards: [{ id: 'c1', card_type_id: 't1' }] });

        expect(cards[0].cardTypeId).toBe('t1');
    });

    it('prefers cardTypeId over card_type_id', () => {
        const { cards } = upgrade({ cards: [{ id: 'c1', cardTypeId: 't2', card_type_id: 't1' }] });

        expect(cards[0].cardTypeId).toBe('t2');
    });

    it('reads the old retailer and expirationDate fields of an offer', () => {
        const { offers } = upgrade({ offers: [{ id: 'o1', retailer: 'Best Buy', expirationDate: '2030-01-31' }] });

        expect(offers[0]).toMatchObject({
            merchantName: 'Best Buy', expiryDate: '2030-01-31', description: '', terms: '', category: 'Shopping', url: '',
        });
    });

    it('names an offer without a merchant', () => {
        const { offers } = upgrade({ offers: [{ id: 'o1' }] });

        expect(offers[0].merchantName).toBe('Unknown Merchant');
    });

    it('reads the old snake_case fields of a reward', () => {
        const { rewards } = upgrade({
            rewards: [{ id: 'r1', card_type_id: 't1', category: 'Dining', reward_value: 4, reward_unit: 'x' }],
        });

        expect(rewards[0]).toMatchObject({ cardTypeId: 't1', rewardValue: 4, rewardUnit: 'x', description: '' });
    });

    it('gives a card type without a color the default', () => {
        const { cardTypes } = upgrade({ cardTypes: [{ id: 't1', color: null }, { id: 't2', color: '#123456' }] });

        expect(cardTypes.map(type => type.color)).toEqual(['#374151', '#123456']);
    });

    it('trims category names', () => {
        const { offers, rewards } = upgrade({
            offers: [{ id: 'o1', category: ' Hotels ' }, { id: 'o2', category: '  ' }],
            rewards: [{ id: 'r1', category: 'Hotels ' }],
        });

        expect(offers.map(offer => offer.category)).toEqual(['Hotels', 'Shopping']);
        expect(rewards[0].category).toBe('Hotels');
    });

    it('keeps a reward value of zero', () => {
        const { rewards } = upgrade({ rewards: [{ id: 'r1', cardTypeId: 't1', rewardValue: 0, reward_value: 5 }] });

        expect(rewards[0].rewardValue).toBe(0);
    });

    it('defaults a reward without a unit to percent', () => {
        const { rewards } = upgrade({ rewards: [{ id: 'r1', cardTypeId: 't1', rewardValue: 2 }] });

        expect(rewards[0].rewardUnit).toBe('%');
    });
});
