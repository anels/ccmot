import { create } from 'zustand';
import type { CreditCard, Offer, AppData, OfferStatus, CardType, Reward } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../api/client';
import { normalizeImportData } from './data-utils';

type RewardInput = Partial<Reward> & Pick<Reward, 'cardTypeId' | 'category' | 'rewardValue' | 'rewardUnit'>;

interface AppState extends AppData {
    // Initialization
    isLoading: boolean;
    error: string | null;
    initialize: () => Promise<void>;
    clearError: () => void;

    // Helper to refetch all data on error (prevents stale state issues)
    refetchData: () => Promise<void>;

    // Actions
    addCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
    updateCard: (id: string, updates: Partial<CreditCard>) => Promise<void>;
    deleteCard: (id: string) => Promise<void>;

    // Resolves with the new id, or '' on failure (state is refetched); treat '' as failure.
    addOffer: (offer: Omit<Offer, 'id'>) => Promise<string>;
    updateOffer: (id: string, updates: Partial<Offer>) => Promise<void>;
    deleteOffer: (id: string) => Promise<void>;

    trackOffer: (offerId: string, cardId: string) => Promise<void>;
    updateOfferStatus: (trackedOfferId: string, status: OfferStatus) => Promise<void>;
    deleteTrackedOffer: (id: string) => Promise<void>;

    // Bulk Operations (for Sync/Import)
    importData: (data: Partial<AppData>) => Promise<void>;
    exportData: () => AppData;

    // Card Types
    // Same contract as addOffer: '' means the create failed.
    addCardType: (cardType: Omit<CardType, 'id'>) => Promise<string>;
    updateCardType: (id: string, updates: Partial<CardType>) => Promise<void>;
    deleteCardType: (id: string) => Promise<void>;

    // Rewards
    addReward: (reward: RewardInput) => Promise<void>;
    deleteReward: (id: string) => Promise<void>;
}

// Optimistic updates are discarded by the refetch, so tell the user the change was lost.
const reportFailure = async (message: string, error: unknown) => {
    console.error(`${message}:`, error);
    const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
    useStore.setState({ error: `${message}${detail}. The change was not saved.` });
    await useStore.getState().refetchData();
};

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
            const mappedData = normalizeImportData(data);

            set({
                ...mappedData,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to initialize store:', error);
            set({ isLoading: false, error: 'Failed to load data. Is the backend running?' });
        }
    },

    clearError: () => set({ error: null }),

    refetchData: async () => {
        try {
            const data = await api.getInitialData();
            const mappedData = normalizeImportData(data);

            set(mappedData);
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
            await reportFailure('Failed to add card', error);
        }
    },

    updateCard: async (id, updates) => {
        set((state) => ({
            cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        try {
            await api.updateCard(id, updates);
        } catch (error) {
            await reportFailure('Failed to update card', error);
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
            await reportFailure('Failed to delete card', error);
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
            await reportFailure('Failed to add offer', error);
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
            await reportFailure('Failed to update offer', error);
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
            await reportFailure('Failed to delete offer', error);
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
            await reportFailure('Failed to track offer', error);
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
            await reportFailure('Failed to update tracked offer status', error);
        }
    },

    deleteTrackedOffer: async (id) => {
        set((state) => ({
            trackedOffers: state.trackedOffers.filter((t) => t.id !== id),
        }));
        try {
            await api.deleteTrackedOffer(id);
        } catch (error) {
            await reportFailure('Failed to delete tracked offer', error);
        }
    },

    importData: async (data) => {
        const cleanedData = normalizeImportData(data);

        try {
            await api.importData(cleanedData);
            await get().refetchData();
        } catch (error) {
            console.error('Failed to import data to backend:', error);
            await get().refetchData();
            throw error;
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
            await api.addCardType(newCardType);
            return id;
        } catch (error) {
            await reportFailure('Failed to add card type', error);
            return ''; // signal failure like addOffer does
        }
    },

    updateCardType: async (id, updates) => {
        set((state) => ({
            cardTypes: state.cardTypes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
        try {
            await api.updateCardType(id, updates);
        } catch (error) {
            await reportFailure('Failed to update card type', error);
        }
    },

    deleteCardType: async (id: string) => {
        set((state) => ({
            cardTypes: state.cardTypes.filter((c) => c.id !== id),
            cards: state.cards.map((card) =>
                card.cardTypeId === id ? { ...card, cardTypeId: undefined } : card
            ),
            rewards: state.rewards.filter((r) => r.cardTypeId !== id),
        }));
        try {
            await api.deleteCardType(id);
        } catch (error) {
            await reportFailure('Failed to delete card type', error);
        }
    },

    // Rewards
    addReward: async (reward) => {
        const id = reward.id || uuidv4();
        const newReward: Reward = {
            id,
            cardTypeId: reward.cardTypeId,
            category: reward.category,
            rewardValue: reward.rewardValue,
            rewardUnit: reward.rewardUnit,
            description: reward.description || '',
        };
        set((state) => ({
            rewards: [...state.rewards.filter(r => r.id !== id), newReward]
        }));
        try {
            await api.addReward(newReward);
        } catch (error) {
            await reportFailure('Failed to add/update reward', error);
        }
    },

    deleteReward: async (id: string) => {
        set((state) => ({
            rewards: state.rewards.filter((r) => r.id !== id),
        }));
        try {
            await api.deleteReward(id);
        } catch (error) {
            await reportFailure('Failed to delete reward', error);
        }
    },
}));
