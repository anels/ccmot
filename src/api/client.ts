import type { CreditCard, Offer, OfferStatus, AppData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}

export const api = {
    // Initial Data
    getInitialData: () => fetchJson<AppData>('/initial-data'),

    // Import
    importData: (data: AppData) => fetchJson('/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),

    // Cards
    addCard: (card: CreditCard) => fetchJson('/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...card,
            card_type_id: card.cardTypeId
        }),
    }),
    updateCard: (id: string, updates: Partial<CreditCard>) => fetchJson(`/cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...updates,
            card_type_id: updates.cardTypeId
        }),
    }),
    deleteCard: (id: string) => fetchJson(`/cards/${id}`, {
        method: 'DELETE',
    }),

    // Offers
    addOffer: (offer: Offer) => fetchJson('/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer),
    }),
    updateOffer: (id: string, updates: Partial<Offer>) => fetchJson(`/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    }),
    deleteOffer: (id: string) => fetchJson(`/offers/${id}`, {
        method: 'DELETE',
    }),

    // Tracked Offers
    addTrackedOffer: (trackedOffer: { id: string, offerId: string, cardId: string, status: string, dateAdded: string }) => fetchJson('/tracked-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackedOffer),
    }),
    updateTrackedOfferStatus: (id: string, status: OfferStatus) => fetchJson(`/tracked-offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    }),
    deleteTrackedOffer: (id: string) => fetchJson(`/tracked-offers/${id}`, {
        method: 'DELETE',
    }),

    // Card Types
    addCardType: (cardType: { id: string, name: string, issuer: string, color: string }) => fetchJson('/card-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardType),
    }),
    updateCardType: (id: string, updates: Partial<{ name: string, issuer: string, color: string }>) => fetchJson(`/card-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    }),
    deleteCardType: (id: string) => fetchJson(`/card-types/${id}`, {
        method: 'DELETE',
    }),

    // Rewards
    addReward: (reward: any) => fetchJson('/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: reward.id,
            card_type_id: reward.cardTypeId,
            category: reward.category,
            reward_value: reward.rewardValue,
            reward_unit: reward.rewardUnit,
            description: reward.description
        }),
    }),
    deleteReward: (id: string) => fetchJson(`/rewards/${id}`, {
        method: 'DELETE',
    }),
};
