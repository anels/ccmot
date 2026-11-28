import { create } from 'zustand';
import type { CreditCard, Offer, AppData, OfferStatus, CardType, Reward } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../api/client';
import { upgradeBackup } from './backup';
import { DEFAULT_CARD_TYPE_COLOR } from './constants';
import { resolveCards } from './utils';

type RewardInput = Partial<Reward> & Pick<Reward, 'cardTypeId' | 'category' | 'rewardValue' | 'rewardUnit'>;

/** What every write resolves with. Writes never reject. */
export type WriteResult = { ok: true } | { ok: false; error: string };
/** A create also answers the id of what it made. */
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

interface AppState extends AppData {
    // Initialization
    isLoading: boolean;
    error: string | null;
    initialize: () => Promise<void>;
    clearError: () => void;

    // Reloads everything from the server; keeps what it has if that fails
    refetchData: () => Promise<void>;

    // Writes change local state only once the server has accepted them. A failure
    // is reported in `error` until the next write starts, except by importData,
    // whose caller shows it.
    addCard: (card: Omit<CreditCard, 'id'>) => Promise<WriteResult>;
    updateCard: (id: string, updates: Partial<CreditCard>) => Promise<WriteResult>;
    deleteCard: (id: string) => Promise<WriteResult>;

    /** Creates the offer, or updates it when `id` is given, tracked on exactly `cardIds`. */
    saveOffer: (offer: Omit<Offer, 'id'>, cardIds: string[], id?: string) => Promise<WriteResult>;
    deleteOffer: (id: string) => Promise<WriteResult>;

    trackOffer: (offerId: string, cardId: string) => Promise<WriteResult>;
    updateOfferStatus: (trackedOfferId: string, status: OfferStatus) => Promise<WriteResult>;
    deleteTrackedOffer: (id: string) => Promise<WriteResult>;

    // Bulk Operations (for Sync/Import)
    importData: (data: Partial<AppData>) => Promise<WriteResult>;
    exportData: () => AppData;

    // Card Types
    addCardType: (cardType: Omit<CardType, 'id'>) => Promise<CreateResult>;
    updateCardType: (id: string, updates: Partial<CardType>) => Promise<WriteResult>;
    deleteCardType: (id: string) => Promise<WriteResult>;

    // Rewards
    addReward: (reward: RewardInput) => Promise<WriteResult>;
    deleteReward: (id: string) => Promise<WriteResult>;
}

const errorDetail = (error: unknown) => error instanceof Error && error.message ? error.message : 'Unknown error';

export const useStore = create<AppState>((set, get) => {
    // The one path every single change takes: send it, apply it once the server
    // has accepted it, and otherwise report why and reload in case the data was stale.
    async function write<T>(
        failure: string,
        send: () => Promise<T>,
        apply: (state: AppState, response: T) => Partial<AppState>,
    ): Promise<WriteResult> {
        // An earlier failure's message would read as being about this attempt
        set({ error: null });
        try {
            const response = await send();
            set(state => apply(state, response));
            return { ok: true };
        } catch (error) {
            console.error(`${failure}:`, error);
            const detail = errorDetail(error);
            set({ error: `${failure} (${detail}). The change was not saved.` });
            await get().refetchData();
            return { ok: false, error: detail };
        }
    }

    return {
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

                set({
                    ...data,
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
                set(await api.getInitialData());
            } catch (error) {
                console.error('Failed to refetch data:', error);
            }
        },

        addCard: async (card) => {
            const newCard = { ...card, id: uuidv4() };
            return write('Failed to add card',
                () => api.addCard(newCard),
                state => ({ cards: [...state.cards, newCard] }));
        },

        updateCard: async (id, updates) => write('Failed to update card',
            () => api.updateCard(id, updates),
            state => ({ cards: state.cards.map(c => (c.id === id ? { ...c, ...updates } : c)) })),

        deleteCard: async (id) => write('Failed to delete card',
            () => api.deleteCard(id),
            state => ({
                cards: state.cards.filter(c => c.id !== id),
                trackedOffers: state.trackedOffers.filter(t => t.cardId !== id),
            })),

        saveOffer: async (offer, cardIds, id) => {
            const offerId = id ?? uuidv4();
            const seenRowIds = get().trackedOffers.filter(t => t.offerId === offerId).map(t => t.id);
            return write(id ? 'Failed to update offer' : 'Failed to add offer',
                () => api.saveOffer({ ...offer, id: offerId }, { isNew: !id, cardIds, seenRowIds }),
                (state, { data }) => ({
                    offers: state.offers.some(o => o.id === offerId)
                        ? state.offers.map(o => (o.id === offerId ? data.offer : o))
                        : [...state.offers, data.offer],
                    trackedOffers: [
                        ...state.trackedOffers.filter(t => t.offerId !== offerId),
                        ...data.trackedOffers,
                    ],
                }));
        },

        deleteOffer: async (id) => write('Failed to delete offer',
            () => api.deleteOffer(id),
            state => ({
                offers: state.offers.filter(o => o.id !== id),
                trackedOffers: state.trackedOffers.filter(t => t.offerId !== id),
            })),

        trackOffer: async (offerId, cardId) => {
            const exists = get().trackedOffers.some(
                (t) => t.offerId === offerId && t.cardId === cardId
            );
            if (exists) return { ok: true };

            const newTrackedOffer = {
                id: uuidv4(),
                offerId,
                cardId,
                status: 'Added' as OfferStatus,
                dateAdded: new Date().toISOString(),
            };

            return write('Failed to track offer',
                () => api.addTrackedOffer(newTrackedOffer),
                state => ({ trackedOffers: [...state.trackedOffers, newTrackedOffer] }));
        },

        updateOfferStatus: async (trackedOfferId, status) => write('Failed to update tracked offer status',
            () => api.updateTrackedOfferStatus(trackedOfferId, status),
            state => ({
                trackedOffers: state.trackedOffers.map(t => (t.id === trackedOfferId ? { ...t, status } : t)),
            })),

        deleteTrackedOffer: async (id) => write('Failed to delete tracked offer',
            () => api.deleteTrackedOffer(id),
            state => ({ trackedOffers: state.trackedOffers.filter(t => t.id !== id) })),

        // The server replaces everything at once, so the new data is loaded rather than applied.
        importData: async (data) => {
            let result: WriteResult = { ok: true };
            set({ error: null });
            try {
                await api.importData(upgradeBackup(data));
            } catch (error) {
                console.error('Failed to import data to backend:', error);
                result = { ok: false, error: errorDetail(error) };
            }
            await get().refetchData();
            return result;
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
            if (!newCardType.color) newCardType.color = DEFAULT_CARD_TYPE_COLOR;

            const result = await write('Failed to add card type',
                () => api.addCardType(newCardType),
                state => ({ cardTypes: [...state.cardTypes, newCardType] }));
            return result.ok ? { ok: true, id } : result;
        },

        updateCardType: async (id, updates) => write('Failed to update card type',
            () => api.updateCardType(id, updates),
            state => ({ cardTypes: state.cardTypes.map(t => (t.id === id ? { ...t, ...updates } : t)) })),

        deleteCardType: async (id) => write('Failed to delete card type',
            () => api.deleteCardType(id),
            state => ({
                cardTypes: state.cardTypes.filter(c => c.id !== id),
                // As the server does, each card keeps the look its type gave it
                cards: state.cards.map(card => card.cardTypeId === id
                    ? { ...resolveCards([card], state.cardTypes)[0], cardTypeId: undefined }
                    : card
                ),
                rewards: state.rewards.filter(r => r.cardTypeId !== id),
            })),

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
            return write('Failed to add/update reward',
                () => api.addReward(newReward),
                state => ({ rewards: [...state.rewards.filter(r => r.id !== id), newReward] }));
        },

        deleteReward: async (id) => write('Failed to delete reward',
            () => api.deleteReward(id),
            state => ({ rewards: state.rewards.filter(r => r.id !== id) })),
    };
});
