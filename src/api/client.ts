import type { CreditCard, Offer, OfferStatus, AppData, CardType, Reward } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}

const jsonRequest = (method: 'POST' | 'PUT', body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

const deleteRequest: RequestInit = { method: 'DELETE' };

export const api = {
    // Initial Data
    getInitialData: () => fetchJson<AppData>('/initial-data'),

    // Import
    importData: (data: AppData) => fetchJson('/import', jsonRequest('POST', data)),

    // Cards
    addCard: (card: CreditCard) => fetchJson('/cards', jsonRequest('POST', {
        ...card,
        card_type_id: card.cardTypeId
    })),
    updateCard: (id: string, updates: Partial<CreditCard>) => fetchJson(`/cards/${id}`, jsonRequest('PUT', {
        ...updates,
        card_type_id: updates.cardTypeId
    })),
    deleteCard: (id: string) => fetchJson(`/cards/${id}`, deleteRequest),

    // Offers
    addOffer: (offer: Offer) => fetchJson('/offers', jsonRequest('POST', offer)),
    updateOffer: (id: string, updates: Partial<Offer>) => fetchJson(`/offers/${id}`, jsonRequest('PUT', updates)),
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
    addReward: (reward: Reward) => fetchJson('/rewards', jsonRequest('POST', {
        id: reward.id,
        card_type_id: reward.cardTypeId,
        category: reward.category,
        reward_value: reward.rewardValue,
        reward_unit: reward.rewardUnit,
        description: reward.description
    })),
    deleteReward: (id: string) => fetchJson(`/rewards/${id}`, deleteRequest),
};
