import type { Offer } from '../types';

/** The fields an offer is searched by, wherever it is listed. */
export const OFFER_SEARCH_FIELDS: (keyof Offer)[] = ['merchantName', 'description', 'terms', 'category'];

/** Case-insensitive substring match against any of the values. An empty term matches everything. */
export function matchesTerm(values: (string | null | undefined)[], term: string): boolean {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return values.some(value => value?.toLowerCase().includes(lowerTerm));
}
