import type { CreditCard, Offer, OfferStatus, AppData, CardType, Reward, TrackedOffer } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || response.statusText || `HTTP ${response.status}`);
    }
    return response.json();
}

// SQLite answers null for what a row leaves out; the app's types use an absent
// field, or an empty string for the text fields every row has.
function decode<T>(row: T, empty: Partial<T>): T {
    const present = Object.entries(row as object).filter(([, value]) => value !== null);
    return { ...empty, ...Object.fromEntries(present) } as T;
}

const decodeCard = (row: CreditCard) => decode(row, { cardHolder: '', notes: '' });
// The database allows an empty category and unit. An offer without a category
// would be in no dashboard section, and a reward without a unit reads as percent.
const decodeOffer = (row: Offer): Offer => {
    const offer = decode(row, { terms: '', expiryDate: '' });
    return { ...offer, category: offer.category || 'Shopping' };
};
const decodeReward = (row: Reward): Reward => {
    const reward = decode(row, { description: '' });
    return { ...reward, rewardUnit: reward.rewardUnit || '%' };
};

const decodeAppData = (data: AppData): AppData => ({
    ...data,
    cards: data.cards.map(decodeCard),
    offers: data.offers.map(decodeOffer),
    rewards: data.rewards.map(decodeReward),
});

const jsonRequest = (method: 'POST' | 'PUT', body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

const deleteRequest: RequestInit = { method: 'DELETE' };

export type SaveOfferCards = {
    isNew: boolean;
    cardIds: string[];
    /** The tracked offers the caller knows of; only these can be removed. */
    seenRowIds: string[];
};

export const api = {
    // Initial Data
    getInitialData: () => fetchJson<AppData>('/initial-data').then(decodeAppData),

    // Import
    importData: (data: AppData) => fetchJson('/import', jsonRequest('POST', data)),

    // Cards
    addCard: (card: CreditCard) => fetchJson('/cards', jsonRequest('POST', card)),
    // JSON drops undefined, so send null to clear the card type.
    updateCard: (id: string, updates: Partial<CreditCard>) => fetchJson(`/cards/${id}`, jsonRequest('PUT',
        'cardTypeId' in updates ? { ...updates, cardTypeId: updates.cardTypeId ?? null } : updates
    )),
    deleteCard: (id: string) => fetchJson(`/cards/${id}`, deleteRequest),

    // Offers
    // The offer and the cards that track it, saved together.
    saveOffer: (offer: Offer, cards: SaveOfferCards) => fetchJson<{ data: { offer: Offer; trackedOffers: TrackedOffer[] } }>(
        `/offers/${offer.id}/with-cards`, jsonRequest('PUT', { offer, ...cards })
    ).then(({ data }) => ({ data: { ...data, offer: decodeOffer(data.offer) } })),
    deleteOffer: (id: string) => fetchJson(`/offers/${id}`, deleteRequest),

    // Tracked Offers
    addTrackedOffer: (trackedOffer: { id: string, offerId: string, cardId: string, status: string, dateAdded: string }) =>
        fetchJson('/tracked-offers', jsonRequest('POST', trackedOffer)),
    updateTrackedOfferStatus: (id: string, status: OfferStatus) =>
        fetchJson(`/tracked-offers/${id}`, jsonRequest('PUT', { status })),
    deleteTrackedOffer: (id: string) => fetchJson(`/tracked-offers/${id}`, deleteRequest),

    // Card Types
    addCardType: (cardType: CardType) => fetchJson('/card-types', jsonRequest('POST', cardType)),
    updateCardType: (id: string, updates: Partial<CardType>) =>
        fetchJson(`/card-types/${id}`, jsonRequest('PUT', updates)),
    deleteCardType: (id: string) => fetchJson(`/card-types/${id}`, deleteRequest),

    // Rewards
    addReward: (reward: Reward) => fetchJson('/rewards', jsonRequest('POST', reward)),
    deleteReward: (id: string) => fetchJson(`/rewards/${id}`, deleteRequest),
};
