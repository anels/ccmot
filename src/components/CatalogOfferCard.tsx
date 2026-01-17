import React, { useState } from 'react';
import { CreditCard, Calendar, CheckCircle, Plus, HelpCircle } from 'lucide-react';
import type { Offer, CreditCard as CreditCardType, OfferCategory, TrackedOffer } from '../types';
import { format } from 'date-fns';
import { Plane, Utensils, ShoppingBag, Clapperboard, Briefcase } from 'lucide-react';

const CATEGORY_ICONS: Record<OfferCategory, React.ElementType> = {
    'Travel': Plane,
    'Dining': Utensils,
    'Shopping': ShoppingBag,
    'Entertainment': Clapperboard,
    'Service': Briefcase,
    'Other': HelpCircle,
};

interface CatalogOfferCardProps {
    offer: Offer;
    cards: CreditCardType[];
    trackedOffers: TrackedOffer[];
    onTrackOffer: (offerId: string, cardId: string) => void;
}

export const CatalogOfferCard: React.FC<CatalogOfferCardProps> = ({ offer, cards, trackedOffers, onTrackOffer }) => {
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const CategoryIcon = CATEGORY_ICONS[offer.category || 'Other'] || HelpCircle;

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
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:bg-white dark:hover:bg-gray-900 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-secondary/50 rounded-md text-secondary-foreground/80">
                        <CategoryIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-lg leading-tight">{offer.merchantName}</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-1 rounded-md">{offer.category || 'Other'}</span>
            </div>
            <p className="text-sm text-foreground/70 mb-4">{offer.description}</p>
            <div className="flex items-center text-xs text-muted-foreground font-medium mb-4 bg-secondary/50 inline-block px-2 py-1 rounded-md">
                <Calendar className="w-3 h-3 mr-1.5 inline" />
                Expires {format(new Date(offer.expiryDate), 'MMM d')}
            </div>

            {availableCards.length > 0 ? (
                <div className="flex gap-2 mt-auto">
                    <div className="relative flex-1">
                        <select
                            className="w-full appearance-none text-sm border border-input rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                            value={selectedCardId}
                            onChange={(e) => setSelectedCardId(e.target.value)}
                        >
                            <option value="">Select Card...</option>
                            {availableCards.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (•••• {c.last4})</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <CreditCard className="w-3 h-3" />
                        </div>
                    </div>
                    <button
                        disabled={!selectedCardId}
                        onClick={handleTrack}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-primary/25"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                    <CheckCircle className="w-3 h-3 mr-1.5" />
                    Added to all eligible cards
                </div>
            )}
        </div>
    );
};
