import React, { useState } from 'react';
import { Calendar, CheckCircle, Plus, ChevronDown } from 'lucide-react';
import type { Offer, CreditCard as CreditCardType, TrackedOffer } from '../types';
import { format, isValid } from 'date-fns';
import { CATEGORY_ICONS } from '../lib/constants';

interface CatalogOfferCardProps {
    offer: Offer;
    cards: CreditCardType[];
    trackedOffers: TrackedOffer[];
    onTrackOffer: (offerId: string, cardId: string) => void;
}

export const CatalogOfferCard: React.FC<CatalogOfferCardProps> = ({ offer, cards, trackedOffers, onTrackOffer }) => {
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const CategoryIcon = CATEGORY_ICONS[offer.category || 'Other'];

    const alreadyTrackedCards = trackedOffers
        .filter(t => t.offerId === offer.id)
        .map(t => t.cardId);

    const availableCards = cards.filter(c => !alreadyTrackedCards.includes(c.id));

    const handleTrack = () => {
        if (selectedCardId) {
            onTrackOffer(offer.id, selectedCardId);
            setSelectedCardId(''); // Reset selection
        }
    };

    return (
        <div className="group flex flex-col glass-card rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-900/30 backdrop-blur-md">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-foreground/80 group-hover:scale-110 transition-transform duration-300">
                        <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                            {offer.merchantName}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-md mt-1 inline-block">
                            {offer.category || 'Other'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground font-medium mb-6 line-clamp-3 min-h-[3rem] leading-relaxed">
                {offer.description}
            </p>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-dashed border-gray-200 dark:border-gray-800/50 space-y-4">
                <div className="flex items-center text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Expires {isValid(new Date(offer.expiryDate)) ? format(new Date(offer.expiryDate), 'MMM d') : 'N/A'}
                </div>

                {availableCards.length > 0 ? (
                    <div className="flex gap-2">
                        <div className="relative flex-1 group/select">
                            <select
                                className="w-full appearance-none text-sm font-medium border border-gray-200 dark:border-gray-700/50 rounded-xl px-3 py-2.5 bg-gray-50/50 dark:bg-black/20 hover:bg-white dark:hover:bg-gray-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none cursor-pointer transition-all pr-8 text-foreground"
                                value={selectedCardId}
                                onChange={(e) => setSelectedCardId(e.target.value)}
                            >
                                <option value="">Select Card to track...</option>
                                {availableCards.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} (•••• {c.last4})</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-primary transition-colors">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                        <button
                            disabled={!selectedCardId}
                            onClick={handleTrack}
                            className="group/btn relative overflow-hidden p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg shadow-primary/20"
                            title="Add Offer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                            <Plus className="w-5 h-5 relative z-10" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">All cards added</span>
                    </div>
                )}
            </div>
        </div>
    );
};
