import { describe, expect, it } from 'vitest';
import type { CardType, CreditCard } from '../types';
import { formatReward, parseOfferDate, resolveCards } from './utils';

describe('formatReward', () => {
    it('writes each unit its own way', () => {
        expect([formatReward(5, '%'), formatReward(4, 'x'), formatReward(3, 'points')]).toEqual(['5%', '4x', '3 pts']);
    });

    it('shows an unknown unit as it is', () => {
        expect(formatReward(2, 'miles' as never)).toBe('2 miles');
    });
});

describe('parseOfferDate', () => {
    it('reads a date as local midnight', () => {
        const date = parseOfferDate('2030-01-31');

        expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2030, 0, 31, 0]);
    });

    it('ignores the time part of an ISO string', () => {
        const date = parseOfferDate('2030-01-31T23:59:59.000Z');

        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2030, 0, 31]);
    });

    it('returns an invalid date for an empty string', () => {
        expect(Number.isNaN(parseOfferDate('').getTime())).toBe(true);
    });
});

describe('resolveCards', () => {
    const type: CardType = { id: 't1', name: 'Gold', issuer: 'Amex', color: '#B8860B' };
    const card: CreditCard = { id: 'c1', name: 'My Gold', issuer: 'Chase', last4: '1234', color: '#000000', cardHolder: 'A', cardTypeId: 't1' };

    it('takes issuer and color from the card type and keeps the rest', () => {
        expect(resolveCards([card], [type])).toEqual([{ ...card, issuer: 'Amex', color: '#B8860B' }]);
    });

    it('keeps the values of a card that its type leaves empty', () => {
        const blank = { ...type, issuer: '' as never, color: '' };

        expect(resolveCards([card], [blank])).toEqual([card]);
    });

    it('keeps the values of a card without a type', () => {
        const untyped = { ...card, cardTypeId: undefined };

        expect(resolveCards([untyped], [type])).toEqual([untyped]);
    });

    it('keeps the values of a card whose type no longer exists', () => {
        expect(resolveCards([card], [])).toEqual([card]);
    });
});
