import type { Offer, Reward } from '../types';
import { CATEGORIES } from './constants';

/** The built-in categories, then the person's own in use by an offer or a reward. */
export function listCategories(offers: Pick<Offer, 'category'>[], rewards: Pick<Reward, 'category'>[]): string[] {
    const builtIn = new Set<string>(CATEGORIES);
    const custom = new Set(
        [...offers, ...rewards]
            .map(item => item.category)
            .filter(category => category && !builtIn.has(category)),
    );
    return [...CATEGORIES, ...[...custom].sort()];
}
