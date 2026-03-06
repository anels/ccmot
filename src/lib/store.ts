import { create } from 'zustand';
import type { CreditCard, Offer, AppData, OfferStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../api/client';
import { normalizeImportData } from './data-utils';

interface AppState extends AppData {
    // Initialization
    isLoading: boolean;
    error: string | null;
    initialize: () => Promise<void>;

    // Helper to refetch all data on error (prevents stale state issues)
    refetchData: () => Promise<void>;

    // Actions
    addCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
    updateCard: (id: string, updates: Partial<CreditCard>) => Promise<void>;
    deleteCard: (id: string) => Promise<void>;

    addOffer: (offer: Omit<Offer, 'id'>) => Promise<string>;
    updateOffer: (id: string, updates: Partial<Offer>) => Promise<void>;
    deleteOffer: (id: string) => Promise<void>;

    trackOffer: (offerId: string, cardId: string) => Promise<void>;
    updateOfferStatus: (trackedOfferId: string, status: OfferStatus) => Promise<void>;
    deleteTrackedOffer: (id: string) => Promise<void>;

    // Bulk Operations (for Sync/Import)
    importData: (data: AppData) => Promise<void>;
    exportData: () => AppData;

    // Card Types
    addCardType: (cardType: Omit<import('../types').CardType, 'id'>) => Promise<string>;
    updateCardType: (id: string, updates: Partial<import('../types').CardType>) => Promise<void>;
    deleteCardType: (id: string) => Promise<void>;

    // Rewards
    addReward: (reward: Partial<import('../types').Reward> & { cardTypeId: string, category: string, rewardValue: number, rewardUnit: string }) => Promise<void>;
    deleteReward: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    cards: [],
    offers: [],
    trackedOffers: [],
    cardTypes: [],
    rewards: [],
    isLoading: false,
    error: null,

    initialize: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await api.getInitialData();

            // Map backend snake_case to frontend camelCase
            const mappedCards = (data.cards || []).map((c: any) => ({
                ...c,
                cardTypeId: c.card_type_id
            }));

            const mappedRewards = (data.rewards || []).map((r: any) => ({
                id: r.id,
                cardTypeId: r.card_type_id,
                category: r.category,
                rewardValue: r.reward_value,
                rewardUnit: r.reward_unit,
                description: r.description
            }));

            set({
                cards: mappedCards,
                offers: data.offers || [],
                trackedOffers: data.trackedOffers || [],
                cardTypes: data.cardTypes || [],
                rewards: mappedRewards,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to initialize store:', error);
            set({ isLoading: false, error: 'Failed to load data' });
        }
    },

    refetchData: async () => {
        try {
            const data = await api.getInitialData();

            // Map backend snake_case to frontend camelCase
            const mappedCards = (data.cards || []).map((c: any) => ({
                ...c,
                cardTypeId: c.card_type_id
            }));

            const mappedRewards = (data.rewards || []).map((r: any) => ({
                id: r.id,
                cardTypeId: r.card_type_id,
                category: r.category,
                rewardValue: r.reward_value,
                rewardUnit: r.reward_unit,
                description: r.description
            }));

            set({
                cards: mappedCards,
                offers: data.offers || [],
                trackedOffers: data.trackedOffers || [],
                cardTypes: data.cardTypes || [],
                rewards: mappedRewards,
                error: null,
            });
        } catch (error) {
            console.error('Failed to refetch data:', error);
        }
    },

    addCard: async (card) => {
        const newCard = { ...card, id: uuidv4() };
        // Optimistic update
        set((state) => ({ cards: [...state.cards, newCard] }));
        try {
            await api.addCard(newCard);
        } catch (error) {
            console.error('Failed to add card:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    updateCard: async (id, updates) => {
        set((state) => ({
            cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        try {
            await api.updateCard(id, updates);
        } catch (error) {
            console.error('Failed to update card:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    deleteCard: async (id) => {
        set((state) => ({
            cards: state.cards.filter((c) => c.id !== id),
            trackedOffers: state.trackedOffers.filter((t) => t.cardId !== id),
        }));
        try {
            await api.deleteCard(id);
        } catch (error) {
            console.error('Failed to delete card:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    addOffer: async (offer) => {
        const id = uuidv4();
        const newOffer = { ...offer, id };
        set((state) => ({
            offers: [...state.offers, newOffer]
        }));
        try {
            await api.addOffer(newOffer);
            return id;
        } catch (error) {
            console.error('Failed to add offer:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
            return ''; // Return empty string on failure
        }
    },

    updateOffer: async (id, updates) => {
        set((state) => ({
            offers: state.offers.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
        try {
            await api.updateOffer(id, updates);
        } catch (error) {
            console.error('Failed to update offer:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    deleteOffer: async (id) => {
        set((state) => ({
            offers: state.offers.filter((o) => o.id !== id),
            trackedOffers: state.trackedOffers.filter((t) => t.offerId !== id),
        }));
        try {
            await api.deleteOffer(id);
        } catch (error) {
            console.error('Failed to delete offer:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    trackOffer: async (offerId, cardId) => {
        const state = get();
        const exists = state.trackedOffers.some(
            (t) => t.offerId === offerId && t.cardId === cardId
        );
        if (exists) return;

        const newTrackedOffer = {
            id: uuidv4(),
            offerId,
            cardId,
            status: 'Added' as OfferStatus,
            dateAdded: new Date().toISOString(),
        };

        set((state) => ({
            trackedOffers: [...state.trackedOffers, newTrackedOffer],
        }));

        try {
            await api.addTrackedOffer(newTrackedOffer);
        } catch (error) {
            console.error('Failed to track offer:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    updateOfferStatus: async (trackedOfferId, status) => {
        set((state) => ({
            trackedOffers: state.trackedOffers.map((t) =>
                t.id === trackedOfferId ? { ...t, status } : t
            ),
        }));
        try {
            await api.updateTrackedOfferStatus(trackedOfferId, status);
        } catch (error) {
            console.error('Failed to update tracked offer status:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    deleteTrackedOffer: async (id) => {
        set((state) => ({
            trackedOffers: state.trackedOffers.filter((t) => t.id !== id),
        }));
        try {
            await api.deleteTrackedOffer(id);
        } catch (error) {
            console.error('Failed to delete tracked offer:', error);
            // Refetch to get consistent state instead of reverting to stale data
            await get().refetchData();
        }
    },

    importData: async (data) => {
        const cleanedData = normalizeImportData(data);

        set(cleanedData);

        try {
            await api.importData(cleanedData);
        } catch (error) {
            console.error('Failed to import data to backend:', error);
            // Ideally notify user, but console error for now
        }
    },

    exportData: () => {
        const state = get();
        return {
            cards: state.cards,
            offers: state.offers,
            trackedOffers: state.trackedOffers,
            cardTypes: state.cardTypes,
            rewards: state.rewards,
        };
    },

    // Card Types
    addCardType: async (cardType) => {
        const id = uuidv4();
        const newCardType = { ...cardType, id };
        // Ensure color is present, default if not
        if (!newCardType.color) newCardType.color = '#374151';

        set((state) => ({ cardTypes: [...state.cardTypes, newCardType] }));
        try {
            await api.addCardType(newCardType as any);
            return id;
        } catch (error) {
            console.error('Failed to add card type:', error);
            await get().refetchData();
            return id;
        }
    },

    updateCardType: async (id, updates) => {
        set((state) => ({
            cardTypes: state.cardTypes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            // Also update any cards that use this type? The cards store issuer/color mostly for legacy reasons or caching.
            // If we want the cards to visually update immediately if they rely on the type's color, we might need to update them too
            // or just rely on the UI using the type's color.
            // For now, let's just update the type. The UI should use the type's color if cardTypeId is present.
        }));
        try {
            await api.updateCardType(id, updates);
        } catch (error) {
            console.error('Failed to update card type:', error);
            await get().refetchData();
        }
    },

    deleteCardType: async (id: string) => {
        set((state) => ({
            cardTypes: state.cardTypes.filter((c) => c.id !== id),
            rewards: state.rewards.filter((r) => r.cardTypeId !== id), // Cascading delete in UI
        }));
        try {
            await api.deleteCardType(id);
        } catch (error) {
            console.error('Failed to delete card type:', error);
            await get().refetchData();
        }
    },

    // Rewards
    addReward: async (reward) => {
        const id = reward.id || uuidv4();
        const newReward: import('../types').Reward = {
            id,
            cardTypeId: reward.cardTypeId,
            category: reward.category,
            rewardValue: reward.rewardValue,
            rewardUnit: reward.rewardUnit as '%' | 'x' | 'points',
            description: reward.description || '',
        };
        console.log('Store addReward:', newReward);
        set((state) => ({
            rewards: [...state.rewards.filter(r => r.id !== id), newReward]
        }));
        try {
            await api.addReward(newReward);
        } catch (error) {
            console.error('Failed to add/update reward:', error);
            await get().refetchData();
        }
    },

    deleteReward: async (id: string) => {
        set((state) => ({
            rewards: state.rewards.filter((r) => r.id !== id),
        }));
        try {
            await api.deleteReward(id);
        } catch (error) {
            console.error('Failed to delete reward:', error);
            await get().refetchData();
        }
    },
}));
