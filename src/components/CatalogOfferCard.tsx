import React, { useState } from 'react';
import { CheckCircle2, Plus, ChevronDown } from 'lucide-react';
import type { Offer, CreditCard as CreditCardType, TrackedOffer } from '../types';
import { format, isValid } from 'date-fns';
import { CATEGORY_ICONS, getCategoryColor } from '../lib/constants';
import { cn, parseOfferDate } from '../lib/utils';

interface CatalogOfferCardProps {
    offer: Offer;
    cards: CreditCardType[];
    trackedOffers: TrackedOffer[];
    onTrackOffer: (offerId: string, cardId: string) => void;
}

export const CatalogOfferCard: React.FC<CatalogOfferCardProps> = ({ offer, cards, trackedOffers, onTrackOffer }) => {
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const CategoryIcon = CATEGORY_ICONS[offer.category] || CATEGORY_ICONS['Other'];
    const catColor = getCategoryColor(offer.category || 'Other');

    const alreadyTrackedCards = trackedOffers
        .filter(t => t.offerId === offer.id)
        .map(t => t.cardId);

    const availableCards = cards.filter(c => !alreadyTrackedCards.includes(c.id));

    const handleTrack = () => {
        if (selectedCardId) {
            onTrackOffer(offer.id, selectedCardId);
            setSelectedCardId('');
        }
    };

    const expiryDate = parseOfferDate(offer.expiryDate);
    const expiryValid = isValid(expiryDate);

    return (
        <div className="flex flex-col bg-card rounded-lg border border-border overflow-hidden transition-colors hover:border-foreground/30">
            {/* Top accent bar */}
            <div className={cn("h-1 w-full", catColor.bar)} aria-hidden />

            <div className="p-4 flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", catColor.tile)}>
                        <CategoryIcon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold leading-tight truncate">{offer.merchantName}</h3>
                        <div className={cn("text-[11px] font-medium mt-0.5 truncate", catColor.text)}>
                            {offer.category || 'Other'}
                        </div>
                    </div>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground shrink-0" title="Expires">
                    <span className="opacity-60 uppercase tracking-wider mr-1">Exp</span>
                    {expiryValid ? format(expiryDate, 'MMM dd') : '—'}
                </span>
            </div>

            {/* Description */}
            <p className="text-sm text-foreground/80 mb-4 line-clamp-3 min-h-[3rem] leading-snug">
                {offer.description}
            </p>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-border">
                {availableCards.length > 0 ? (
                    <div className="flex gap-1.5">
                        <div className="relative flex-1">
                            <select
                                className="w-full appearance-none text-xs font-medium border border-border bg-card rounded-md px-2.5 py-2 pr-7 focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none cursor-pointer transition-colors"
                                value={selectedCardId}
                                onChange={(e) => setSelectedCardId(e.target.value)}
                            >
                                <option value="">Add to card…</option>
                                {availableCards.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} • •••• {c.last4}</option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <ChevronDown className="w-3 h-3" />
                            </div>
                        </div>
                        <button
                            disabled={!selectedCardId}
                            onClick={handleTrack}
                            className="px-2.5 bg-foreground text-background rounded-md hover:bg-foreground/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Track offer"
                        >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-gain-soft text-gain rounded-md text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>All cards added</span>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};
