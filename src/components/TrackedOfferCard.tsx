import React from 'react';
import { CreditCard, RotateCcw, Clock } from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { Offer, CreditCard as CreditCardType, TrackedOffer, OfferStatus } from '../types';
import { cn, isOfferExpired, parseOfferDate } from '../lib/utils';
import { CATEGORY_ICONS, STATUS_COLORS, NEXT_STATUS } from '../lib/constants';

interface TrackedOfferCardProps {
    item: TrackedOffer & { offer?: Offer; card?: CreditCardType };
    onUpdateStatus: (id: string, status: OfferStatus) => void;
}

export const TrackedOfferCard: React.FC<TrackedOfferCardProps> = ({ item, onUpdateStatus }) => {
    if (!item.offer || !item.card) return null;

    const CategoryIcon = CATEGORY_ICONS[item.offer.category || 'Other'];

    const isExpired = isOfferExpired(item.offer, item.status);
    const displayStatus: OfferStatus = isExpired ? 'Expired' : item.status;

    return (
        <div className={cn(
            "group relative flex flex-col glass-card rounded-2xl p-6 transition-all duration-500",
            !isExpired && "hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40",
            isExpired && "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 bg-gray-100/50 dark:bg-gray-900/20"
        )}>
            {/* Header: Icon & Merchant */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isExpired ? "bg-gray-100 text-gray-400 dark:bg-gray-800" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    )}>
                        <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={cn("font-bold text-lg leading-tight text-foreground", isExpired && "line-through decoration-destructive/30")}>
                            {item.offer.merchantName}
                        </h3>
                        <div className={cn("text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1",
                            isExpired ? "bg-gray-100 text-gray-500" : "bg-secondary text-secondary-foreground"
                        )}>
                            {item.offer.category}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground font-medium line-clamp-2 mb-5 min-h-[2.5rem]">
                {item.offer.description}
            </p>

            {/* Card Info */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group-hover:border-primary/10 transition-colors">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-white shrink-0"
                    style={{ backgroundColor: item.card.color }}
                >
                    <CreditCard className="w-4 h-4 opacity-90" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate text-foreground/90">{item.card.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {item.card.issuer} &bull; {item.card.last4}
                    </p>
                </div>
            </div>

            {/* Footer: Expiry & Actions */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                <div className={cn("flex items-center text-xs font-medium",
                    isOfferExpired(item.offer) ? "text-destructive" : "text-muted-foreground"
                )}>
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {isValid(parseOfferDate(item.offer.expiryDate))
                        ? (isOfferExpired(item.offer) ? 'Expired ' : 'Expires ') + format(parseOfferDate(item.offer.expiryDate), 'MMM d')
                        : 'Invalid Date'}
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ring-1 ring-inset shadow-sm flex items-center gap-1.5",
                        STATUS_COLORS[displayStatus]
                    )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {displayStatus}
                    </div>

                    {!isExpired && (displayStatus === 'Added' || displayStatus === 'Used') && (
                        <button
                            onClick={() => onUpdateStatus(item.id, NEXT_STATUS[displayStatus])}
                            className="group/btn relative w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all overflow-hidden"
                            title={`Mark as ${NEXT_STATUS[displayStatus]}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                            <span className="text-lg leading-none mb-0.5 group-hover/btn:translate-x-0.5 transition-transform">&rarr;</span>
                        </button>
                    )}
                    {!isExpired && displayStatus !== 'Added' && (
                        <button
                            onClick={() => onUpdateStatus(item.id, 'Added')}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all"
                            title="Reset to Added"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
