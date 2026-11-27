import { describe, expect, it } from 'vitest';
import type { Offer, OfferStatus } from '../types';
import { formatExpiry, getOfferExpiry, getTrackedOfferState } from './lifecycle';

const offerExpiring = (expiryDate: string): Offer => ({
    id: 'o1', merchantName: 'Best Buy', description: 'Spend $100, get $20', terms: '', category: 'Shopping', expiryDate,
});

const today = new Date(2030, 0, 31, 15, 0, 0);
const lastDay = offerExpiring('2030-01-31');
const past = offerExpiring('2030-01-30');

describe('getOfferExpiry', () => {
    it('keeps an offer valid through its expiry date', () => {
        expect(getOfferExpiry(lastDay, today)).toMatchObject({ daysLeft: 0, isPast: false });
    });

    it('is past the day after the expiry date', () => {
        expect(getOfferExpiry(past, today)).toMatchObject({ daysLeft: -1, isPast: true });
    });

    it('counts calendar days', () => {
        expect(getOfferExpiry(offerExpiring('2030-02-01'), today).daysLeft).toBe(1);
    });

    it('never passes for an offer without a date', () => {
        expect(getOfferExpiry(offerExpiring(''), today)).toEqual({ date: null, daysLeft: null, isPast: false, isSoon: false });
    });

    it('is soon from a week before through the expiry date', () => {
        const isSoon = (date: string) => getOfferExpiry(offerExpiring(date), today).isSoon;

        expect(['2030-01-30', '2030-01-31', '2030-02-07', '2030-02-08'].map(isSoon)).toEqual([false, true, true, false]);
    });
});

describe('formatExpiry', () => {
    it('shows the date with its year', () => {
        expect(formatExpiry(lastDay)).toBe('Jan 31, 2030');
    });

    it('says so when there is no usable date', () => {
        expect(formatExpiry(offerExpiring(''))).toBe('No date');
        expect(formatExpiry(offerExpiring('soon'))).toBe('No date');
    });
});

describe('getTrackedOfferState', () => {
    const state = (offer: Offer, status: OfferStatus) => getTrackedOfferState(offer, status, today);

    it('moves an added offer on to used', () => {
        expect(state(lastDay, 'Added')).toEqual({ status: 'Added', next: 'Used', canReset: false });
    });

    it('expires an added offer after its date and still lets it be marked used', () => {
        expect(state(past, 'Added')).toEqual({ status: 'Expired', next: 'Used', canReset: false });
    });

    it('never expires a used or awarded offer', () => {
        expect(state(past, 'Used')).toEqual({ status: 'Used', next: 'Awarded', canReset: true });
        expect(state(past, 'Awarded')).toEqual({ status: 'Awarded', next: null, canReset: true });
    });

    it('treats a stored Expired status as expired whatever the date', () => {
        expect(state(offerExpiring('2031-01-01'), 'Expired')).toEqual({ status: 'Expired', next: 'Used', canReset: false });
    });

    it('keeps a row with an unknown status visible as added', () => {
        expect(state(lastDay, 'used' as OfferStatus).status).toBe('Added');
    });
});
