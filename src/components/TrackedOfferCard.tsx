import React from 'react';
import { CreditCard, Trash2, HelpCircle } from 'lucide-react';
import type { Offer, CreditCard as CreditCardType, TrackedOffer, OfferStatus, OfferCategory } from '../types';
import { cn } from '../lib/utils';
import { Plane, Utensils, ShoppingBag, Clapperboard, Briefcase } from 'lucide-react';

// Reuse category icons mapping (could be moved to a shared utils/constants file)
const CATEGORY_ICONS: Record<OfferCategory, React.ElementType> = {
    'Travel': Plane,
    'Dining': Utensils,
    'Shopping': ShoppingBag,
    'Entertainment': Clapperboard,
    'Service': Briefcase,
    'Other': HelpCircle,
};

const statusColors: Record<OfferStatus, string> = {
    'Added': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
    'Used': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
    'Awarded': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
    'Expired': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
};

const nextStatus: Record<OfferStatus, OfferStatus> = {
    'Added': 'Used',
    'Used': 'Awarded',
    'Awarded': 'Added', // Cycle back or stop?
    'Expired': 'Added'
};

interface TrackedOfferCardProps {
    item: TrackedOffer & { offer?: Offer; card?: CreditCardType };
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: OfferStatus) => void;
}

export const TrackedOfferCard: React.FC<TrackedOfferCardProps> = ({ item, onDelete, onUpdateStatus }) => {
    if (!item.offer || !item.card) return null; // Should be filtered out by parent, but safety check

    const CategoryIcon = CATEGORY_ICONS[item.offer.category || 'Other'] || HelpCircle;

    // Auto-detect expiry for active items
    const isPastExpiry = new Date(item.offer.expiryDate) < new Date(new Date().setHours(0, 0, 0, 0));
    const displayStatus: OfferStatus = (item.status === 'Added' && isPastExpiry) ? 'Expired' : item.status;

    const isExpired = displayStatus === 'Expired';

    return (
        <div className={cn(
            "group bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm transition-all duration-300 relative border border-gray-100 dark:border-gray-800/60",
            isExpired ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0" : "hover:shadow-xl hover:-translate-y-1"
        )}>
            <div className={cn(
                "absolute top-4 right-4 transition-all scale-90",
                isExpired ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 group-hover:scale-100"
            )}>
                <button
                    onClick={() => onDelete(item.id)}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isExpired
                            ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                            : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    )}
                    title={isExpired ? "Delete Expired Offer" : "Remove Tracked Offer"}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-5 pr-8">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-secondary/50 rounded-md text-secondary-foreground/80">
                        <CategoryIcon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className={cn("font-bold text-xl text-foreground tracking-tight line-clamp-1", isExpired && "line-through decoration-red-500/50 decoration-2")}>
                        {item.offer.merchantName}
                    </h3>
                </div>
                <p className={cn("text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed", isExpired && "line-through opacity-70")}>
                    {item.offer.description}
                </p>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-secondary/30 p-3 rounded-xl border border-secondary/50">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm ring-1 ring-black/5 text-white"
                    style={{ backgroundColor: item.card.color }}
                >
                    <CreditCard className="w-5 h-5 opacity-90" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate text-foreground/80">{item.card.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium truncate">
                        <span className="font-semibold text-foreground/70">{item.card.issuer}</span>
                        {item.card.last4 && (
                            <>
                                <span>•</span>
                                <span className="font-mono">{item.card.last4}</span>
                            </>
                        )}
                        {item.card.cardHolder && (
                            <>
                                <span>•</span>
                                <span className="truncate">{item.card.cardHolder}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm", statusColors[displayStatus])}>
                    {displayStatus}
                </span>

                {item.status !== 'Awarded' && !isExpired && (
                    <button
                        onClick={() => onUpdateStatus(item.id, nextStatus[item.status])}
                        className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors flex items-center group/btn"
                    >
                        Mark {nextStatus[item.status]}
                        <span className="ml-1 transition-transform group-hover/btn:translate-x-0.5">→</span>
                    </button>
                )}
            </div>
        </div>
    );
};
