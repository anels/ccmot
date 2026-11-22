import React from 'react';
import { RotateCcw, ArrowRight, Trash2 } from 'lucide-react';
import { format, isValid, differenceInCalendarDays } from 'date-fns';
import type { Offer, CreditCard as CreditCardType, TrackedOffer, OfferStatus } from '../types';
import { cn, isOfferExpired, parseOfferDate } from '../lib/utils';
import { CATEGORY_ICONS, STATUS_COLORS, STATUS_DOT, NEXT_STATUS, getCategoryColor } from '../lib/constants';

interface TrackedOfferCardProps {
    item: TrackedOffer & { offer?: Offer; card?: CreditCardType };
    onUpdateStatus: (id: string, status: OfferStatus) => void;
    onDelete: (id: string) => void;
}

export const TrackedOfferCard: React.FC<TrackedOfferCardProps> = ({ item, onUpdateStatus, onDelete }) => {
    if (!item.offer || !item.card) return null;

    const CategoryIcon = CATEGORY_ICONS[item.offer.category] || CATEGORY_ICONS['Other'];
    const catColor = getCategoryColor(item.offer.category || 'Other');
    const isDateExpired = isOfferExpired(item.offer);
    const isExpired = isOfferExpired(item.offer, item.status);
    const displayStatus: OfferStatus = isExpired ? 'Expired' : item.status;
    const expiryDate = parseOfferDate(item.offer.expiryDate);
    const validDate = isValid(expiryDate);
    const daysLeft = validDate ? differenceInCalendarDays(expiryDate, new Date()) : null;
    const expirySoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

    return (
        <div className={cn(
            "group relative flex bg-card rounded-lg border border-border overflow-hidden transition-colors",
            !isExpired && "hover:border-foreground/30",
            isExpired && "opacity-60"
        )}>
            {/* Category color bar */}
            <div
                className={cn("w-1 shrink-0", isExpired ? "bg-zinc-300 dark:bg-zinc-700" : catColor.bar)}
                aria-hidden
            />

            <div className="flex-1 min-w-0 p-4">
                {/* Top row: icon tile + merchant + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                            isExpired ? "bg-muted text-muted-foreground" : catColor.tile
                        )}>
                            <CategoryIcon className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className={cn(
                                "text-sm font-semibold leading-tight truncate",
                                isExpired && "line-through decoration-muted-foreground/40"
                            )}>
                                {item.offer.merchantName}
                            </h3>
                            <div className={cn("text-[11px] font-medium mt-0.5 truncate", isExpired ? "text-muted-foreground" : catColor.text)}>
                                {item.offer.category}
                            </div>
                        </div>
                    </div>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset flex items-center gap-1 shrink-0",
                        STATUS_COLORS[displayStatus]
                    )}>
                        <span className={cn("dot", STATUS_DOT[displayStatus])} />
                        {displayStatus}
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm text-foreground/80 line-clamp-2 mb-3 min-h-[2.5rem] leading-snug">
                    {item.offer.description}
                </p>

                {/* Card meta row */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0 ring-1 ring-border"
                        style={{ backgroundColor: item.card.color }}
                        aria-hidden
                    />
                    <span className="font-medium text-foreground/90 truncate">{item.card.name}</span>
                    <span className="text-muted-foreground/50 font-mono">·</span>
                    <span className="font-mono">•••• {item.card.last4}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className={cn(
                        "text-[11px] font-mono tabular-nums",
                        isDateExpired ? "text-destructive" : expirySoon ? "text-warning" : "text-muted-foreground"
                    )}>
                        {validDate
                            ? <>
                                <span className="opacity-60 uppercase tracking-wider mr-1">{isDateExpired ? 'Expired' : 'Exp'}</span>
                                {format(expiryDate, 'MMM dd, yyyy')}
                                {daysLeft !== null && !isDateExpired && (
                                    <span className="ml-1.5 opacity-70">({daysLeft}d)</span>
                                )}
                              </>
                            : 'Invalid date'}
                    </div>

                    <div className="flex items-center gap-1">
                        {!isExpired && (
                            <>
                            {(displayStatus === 'Added' || displayStatus === 'Used') && (
                                <button
                                    onClick={() => onUpdateStatus(item.id, NEXT_STATUS[displayStatus])}
                                    className="h-7 px-2 inline-flex items-center gap-1 rounded-md bg-foreground text-background hover:bg-foreground/85 transition-colors text-[11px] font-medium uppercase tracking-wider"
                                    title={`Mark as ${NEXT_STATUS[displayStatus]}`}
                                >
                                    {NEXT_STATUS[displayStatus]}
                                    <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                                </button>
                            )}
                            {displayStatus !== 'Added' && (
                                <button
                                    onClick={() => onUpdateStatus(item.id, 'Added')}
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                    title="Reset"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                </button>
                            )}
                            </>
                        )}
                        <button
                            onClick={() => onDelete(item.id)}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Stop tracking"
                            aria-label="Stop tracking"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
