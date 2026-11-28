import type { AppData, CardType, CreditCard, Offer, Reward, TrackedOffer } from '../types';
import { listCategories } from './categories';
import { getTrackedOfferState, type TrackedOfferState } from './lifecycle';
import { matchesTerm, OFFER_SEARCH_FIELDS } from './search';
import { formatReward } from './utils';

export type TrackedItem = TrackedOffer & { offer: Offer; card: CreditCard; state: TrackedOfferState };

export type CategorySection = {
    category: string;
    /** Best rate first. */
    rewards: (Reward & { cardType: CardType })[];
    active: TrackedItem[];
};

export type DashboardFilter = {
    searchTerm: string;
    /** A category name, or null for every category. */
    category: string | null;
};

export type DashboardView = {
    categories: string[];
    /** Totals over everything, whatever the filter. */
    counts: { active: number; used: number; awarded: number; cards: number };
    sections: CategorySection[];
    used: TrackedItem[];
    awarded: TrackedItem[];
    expired: TrackedItem[];
    /** Offers matching a search or a chosen category; empty without either. */
    catalog: Offer[];
    /** False when a search or category leaves nothing to show anywhere. */
    hasMatches: boolean;
};

/** Pass cards as displayed (`useCards()`). */
function joinTracked({ offers, cards, trackedOffers }: AppData, today: Date): TrackedItem[] {
    const offersById = new Map(offers.map(offer => [offer.id, offer]));
    const cardsById = new Map(cards.map(card => [card.id, card]));

    return trackedOffers.flatMap(tracked => {
        const offer = offersById.get(tracked.offerId);
        const card = cardsById.get(tracked.cardId);
        if (!offer || !card) return [];
        return [{ ...tracked, offer, card, state: getTrackedOfferState(offer, tracked.status, today) }];
    });
}

/** Everything the dashboard shows for a filter. */
export function buildDashboardView(data: AppData, filter: DashboardFilter, today = new Date()): DashboardView {
    const { searchTerm, category: chosen } = filter;
    const inCategory = (category: string) => chosen === null || category === chosen;
    const matchesOffer = (offer: Offer, ...extra: string[]) =>
        matchesTerm([...OFFER_SEARCH_FIELDS.map(field => offer[field]), ...extra], searchTerm);

    const items = joinTracked(data, today);
    const matching = items.filter(item =>
        inCategory(item.offer.category) && matchesOffer(item.offer, item.card.name, item.card.issuer));
    const withStatus = (list: TrackedItem[], status: TrackedItem['status']) =>
        list.filter(item => item.state.status === status);

    const typesById = new Map(data.cardTypes.map(type => [type.id, type]));
    const categories = listCategories(data.offers, data.rewards);

    const sections = categories.filter(inCategory).flatMap(category => {
        const rewards = data.rewards
            .filter(reward => reward.category === category)
            .flatMap(reward => {
                const cardType = typesById.get(reward.cardTypeId);
                return cardType ? [{ ...reward, cardType }] : [];
            })
            .sort((a, b) => b.rewardValue - a.rewardValue);
        const active = withStatus(matching, 'Added').filter(item => item.offer.category === category);

        if (searchTerm) {
            const rewardMatches = rewards.some(reward =>
                matchesTerm([reward.cardType.name, reward.description], searchTerm));
            if (!rewardMatches && active.length === 0) return [];
        } else if (chosen === null && rewards.length === 0 && active.length === 0) {
            return [];
        }
        return [{ category, rewards, active }];
    });

    const used = withStatus(matching, 'Used');
    const awarded = withStatus(matching, 'Awarded');
    const expired = withStatus(matching, 'Expired');
    const catalog = !searchTerm && chosen === null
        ? []
        : data.offers.filter(offer => inCategory(offer.category) && matchesOffer(offer));

    return {
        categories,
        counts: {
            active: withStatus(items, 'Added').length,
            used: withStatus(items, 'Used').length,
            awarded: withStatus(items, 'Awarded').length,
            cards: data.cards.length,
        },
        sections,
        used,
        awarded,
        expired,
        catalog,
        hasMatches: [sections, used, awarded, expired, catalog].some(list => list.length > 0),
    };
}

/** The wallet export: offers still waiting to be used, and every reward by category. */
export function buildOffersExport(data: AppData, today = new Date()) {
    const typesById = new Map(data.cardTypes.map(type => [type.id, type]));

    const active_offers = joinTracked(data, today)
        .filter(item => item.state.status === 'Added')
        .map(({ offer, card }) => ({
            merchant: offer.merchantName,
            category: offer.category,
            offer: offer.description,
            terms: offer.terms,
            card: `${card.name} (${card.issuer} ...${card.last4})`,
            expires: offer.expiryDate,
        }));

    const best_cards = data.rewards
        .map(reward => {
            const type = typesById.get(reward.cardTypeId);
            return {
                category: reward.category,
                reward: formatReward(reward.rewardValue, reward.rewardUnit),
                description: reward.description,
                card_product: type ? `${type.name} (${type.issuer})` : 'Unknown Card',
            };
        })
        .sort((a, b) => a.category.localeCompare(b.category));

    return { active_offers, best_cards };
}
