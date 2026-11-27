import { differenceInCalendarDays, format, isValid } from 'date-fns';
import type { Offer, OfferStatus, TrackedOffer } from '../types';
import { parseOfferDate } from './utils';

export type OfferExpiry = {
    date: Date | null;
    /** Calendar days until the expiry date; 0 on the date itself, negative after it. */
    daysLeft: number | null;
    /** The date has passed, so the offer cannot be put on another card. */
    isPast: boolean;
    /** Not past yet, with a week or less to go. */
    isSoon: boolean;
};

export function getOfferExpiry(offer: Pick<Offer, 'expiryDate'>, today = new Date()): OfferExpiry {
    const date = parseOfferDate(offer.expiryDate);
    if (!isValid(date)) return { date: null, daysLeft: null, isPast: false, isSoon: false };

    const daysLeft = differenceInCalendarDays(date, today);
    return { date, daysLeft, isPast: daysLeft < 0, isSoon: daysLeft >= 0 && daysLeft <= 7 };
}

export function formatExpiry(offer: Pick<Offer, 'expiryDate'>): string {
    const { date } = getOfferExpiry(offer);
    return date ? format(date, 'MMM dd, yyyy') : 'No date';
}

export type TrackedOfferState = {
    /** The status to show. An added offer past its date is Expired. */
    status: OfferStatus;
    /** The status it can move forward to. */
    next: OfferStatus | null;
    /** Whether it can be put back to Added. */
    canReset: boolean;
};

/**
 * What a tracked offer is now and what may be done with it. This is the only
 * place that combines the stored status with the expiry date.
 */
export function getTrackedOfferState(
    offer: Pick<Offer, 'expiryDate'>,
    storedStatus: OfferStatus,
    today = new Date(),
): TrackedOfferState {
    if (storedStatus === 'Used') return { status: 'Used', next: 'Awarded', canReset: true };
    if (storedStatus === 'Awarded') return { status: 'Awarded', next: null, canReset: true };

    // Added, a stored Expired from an old backup, or a value the app does not
    // know, which is shown as Added so the row never disappears.
    const expired = storedStatus === 'Expired' || getOfferExpiry(offer, today).isPast;
    // An expired offer can still be marked used: the purchase may have been in time.
    return { status: expired ? 'Expired' : 'Added', next: 'Used', canReset: false };
}

/** The tracked offers recording a use or a reward that would be lost by keeping only `keptCardIds`. */
export function historyLostBy(rows: TrackedOffer[], keptCardIds: string[]): TrackedOffer[] {
    const kept = new Set(keptCardIds);
    return rows.filter(row => !kept.has(row.cardId) && (row.status === 'Used' || row.status === 'Awarded'));
}
