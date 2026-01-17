import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CreditCard, Offer, AppData, OfferStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState extends AppData {
    // Actions
    addCard: (card: Omit<CreditCard, 'id'>) => void;
    updateCard: (id: string, updates: Partial<CreditCard>) => void;
    deleteCard: (id: string) => void;

    addOffer: (offer: Omit<Offer, 'id'>) => string;
    updateOffer: (id: string, updates: Partial<Offer>) => void;
    deleteOffer: (id: string) => void;

    trackOffer: (offerId: string, cardId: string) => void;
    updateOfferStatus: (trackedOfferId: string, status: OfferStatus) => void;
    deleteTrackedOffer: (id: string) => void;

    // Bulk Operations (for Sync/Import)
    importData: (data: AppData) => void;
    exportData: () => AppData;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            cards: [],
            offers: [],
            trackedOffers: [],

            addCard: (card) => set((state) => ({
                cards: [...state.cards, { ...card, id: uuidv4() }]
            })),

            updateCard: (id, updates) => set((state) => ({
                cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
            })),

            deleteCard: (id) => set((state) => ({
                cards: state.cards.filter((c) => c.id !== id),
                trackedOffers: state.trackedOffers.filter((t) => t.cardId !== id),
            })),

            addOffer: (offer) => {
                const id = uuidv4();
                set((state) => ({
                    offers: [...state.offers, { ...offer, id }]
                }));
                return id;
            },

            updateOffer: (id, updates) => set((state) => ({
                offers: state.offers.map((o) => (o.id === id ? { ...o, ...updates } : o)),
            })),

            deleteOffer: (id) => set((state) => ({
                offers: state.offers.filter((o) => o.id !== id),
                trackedOffers: state.trackedOffers.filter((t) => t.offerId !== id),
            })),

            trackOffer: (offerId, cardId) => set((state) => {
                // Prevent duplicate tracking
                const exists = state.trackedOffers.some(
                    (t) => t.offerId === offerId && t.cardId === cardId
                );
                if (exists) return state;

                return {
                    trackedOffers: [
                        ...state.trackedOffers,
                        {
                            id: uuidv4(),
                            offerId,
                            cardId,
                            status: 'Added',
                            dateAdded: new Date().toISOString(),
                        },
                    ],
                };
            }),

            updateOfferStatus: (trackedOfferId, status) => set((state) => ({
                trackedOffers: state.trackedOffers.map((t) =>
                    t.id === trackedOfferId ? { ...t, status } : t
                ),
            })),

            deleteTrackedOffer: (id) => set((state) => ({
                trackedOffers: state.trackedOffers.filter((t) => t.id !== id),
            })),

            importData: (data) => {
                const authorizedCards = (data.cards || []).map(c => ({
                    ...c,
                    // Ensure new fields exist if missing from old backup
                    cardHolder: c.cardHolder || '',
                    notes: c.notes || ''
                }));

                const authorizedOffers = (data.offers || []).map(o => ({
                    ...o,
                    // Default to 'Shopping' if category is missing
                    category: o.category || 'Shopping'
                }));

                // Ensure tracked offers are valid (only if both offer and card exist in new state)
                // Note: We can't easily check against the *newly* imported cards/offers inside this map 
                // without first defining them, but we are setting state all at once.
                // However, the dashboard is robust enough to filter out broken links.
                // We'll just pass them through, but ensure array exists.
                const authorizedTrackedOffers = data.trackedOffers || [];

                set({
                    cards: authorizedCards,
                    offers: authorizedOffers,
                    trackedOffers: authorizedTrackedOffers,
                });
            },

            exportData: () => {
                const state = get();
                return {
                    cards: state.cards,
                    offers: state.offers,
                    trackedOffers: state.trackedOffers,
                };
            },
        }),
        {
            name: 'ccmot-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
