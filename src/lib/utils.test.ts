import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CardType, CreditCard, Offer } from '../types';
import { isOfferExpired, parseOfferDate, resolveCards } from './utils';

const offerExpiring = (expiryDate: string): Offer => ({
    id: 'o1', merchantName: 'Best Buy', description: 'Spend $100, get $20', terms: '', category: 'Shopping', expiryDate,
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

describe('isOfferExpired', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2030, 0, 31, 15, 0, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps an offer active through its expiry date', () => {
        expect(isOfferExpired(offerExpiring('2030-01-31'))).toBe(false);
    });

    it('expires an offer the day after its expiry date', () => {
        expect(isOfferExpired(offerExpiring('2030-01-30'))).toBe(true);
    });

    it('keeps a used or awarded offer after its expiry date', () => {
        expect(isOfferExpired(offerExpiring('2030-01-30'), 'Used')).toBe(false);
        expect(isOfferExpired(offerExpiring('2030-01-30'), 'Awarded')).toBe(false);
    });

    it('treats the Expired status as expired whatever the date', () => {
        expect(isOfferExpired(offerExpiring('2031-01-01'), 'Expired')).toBe(true);
    });

    it('does not expire an offer without a date', () => {
        expect(isOfferExpired(offerExpiring(''))).toBe(false);
    });
});

describe('resolveCards', () => {
    const type: CardType = { id: 't1', name: 'Gold', issuer: 'Amex', color: '#B8860B' };
    const card: CreditCard = { id: 'c1', name: 'My Gold', issuer: 'Chase', last4: '1234', color: '#000000', cardHolder: 'A', cardTypeId: 't1' };

    it('takes issuer and color from the card type and keeps the rest', () => {
        expect(resolveCards([card], [type])).toEqual([{ ...card, issuer: 'Amex', color: '#B8860B' }]);
    });

    it('keeps the values of a card without a type', () => {
        const untyped = { ...card, cardTypeId: undefined };

        expect(resolveCards([untyped], [type])).toEqual([untyped]);
    });

    it('keeps the values of a card whose type no longer exists', () => {
        expect(resolveCards([card], [])).toEqual([card]);
    });
});
