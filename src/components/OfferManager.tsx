import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useCards } from '../hooks/useCards';
import { useSearch } from '../hooks/useSearch';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import type { Offer } from '../types';
import { Trash2, Calendar, Info, CreditCard, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn, isOfferExpired, parseOfferDate } from '../lib/utils';
import { CATEGORIES, CATEGORY_ICONS, getCategoryColor } from '../lib/constants';

type DateInputWithPicker = HTMLInputElement & {
    showPicker?: () => void;
};

const OFFER_SEARCH_FIELDS: (keyof Offer)[] = ['merchantName', 'description', 'terms', 'category'];

const OfferManager: React.FC = () => {
    const cards = useCards();
    const { offers, trackedOffers, addOffer, updateOffer, deleteOffer, trackOffer, deleteTrackedOffer } = useStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ cards?: string }>({});

    const { searchTerm, setSearchTerm, filteredItems: filteredOffers } = useSearch(offers, OFFER_SEARCH_FIELDS);

    const [formData, setFormData] = useState<Omit<Offer, 'id'>>({
        merchantName: '',
        description: '',
        terms: '',
        expiryDate: format(new Date(), 'yyyy-MM-dd'),
        category: 'Shopping', // Default
    });

    const resetForm = () => {
        setFormData({
            merchantName: '',
            description: '',
            terms: '',
            expiryDate: format(new Date(), 'yyyy-MM-dd'),
            category: 'Shopping',
        });
        setSelectedCards(new Set());
        setErrors({});
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (offer: Offer) => {
        setFormData({
            merchantName: offer.merchantName,
            description: offer.description,
            terms: offer.terms,
            expiryDate: offer.expiryDate,
            category: offer.category || 'Shopping', // Fallback for existing
        });
        setEditingId(offer.id);
        setIsFormOpen(true);
        // Pre-select cards that are already tracking this offer
        const existingCardIds = trackedOffers
            .filter(t => t.offerId === offer.id)
            .map(t => t.cardId);
        setSelectedCards(new Set(existingCardIds));
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate card selection
        if (selectedCards.size === 0) {
            setErrors({ cards: 'Please select at least one card to track this offer.' });
            return;
        }

        let offerId = editingId;

        if (editingId) {
            await updateOffer(editingId, formData);
        } else {
            offerId = await addOffer(formData);
        }

        if (offerId) {
            const selectedCardIds = Array.from(selectedCards);
            const existingTrackedOffers = trackedOffers.filter(t => t.offerId === offerId);

            await Promise.all([
                ...existingTrackedOffers
                    .filter(t => !selectedCards.has(t.cardId))
                    .map(t => deleteTrackedOffer(t.id)),
                ...selectedCardIds.map(cardId => trackOffer(offerId, cardId)),
            ]);
        }

        resetForm();
    };

    const toggleCardSelection = (cardId: string) => {
        const newSelected = new Set(selectedCards);
        if (newSelected.has(cardId)) {
            newSelected.delete(cardId);
        } else {
            newSelected.add(cardId);
        }
        setSelectedCards(newSelected);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteOffer(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Offer"
                message="Are you sure you want to delete this offer? This will also remove it from any cards where it is being tracked."
            />
            <PageHeader
                title="Available Offers"
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddClick={() => {
                    resetForm();
                    setIsFormOpen(true);
                }}
                addButtonLabel="Add Offer"
                isFormOpen={isFormOpen}
                searchPlaceholder="Search offers..."
            />

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? 'Edit Offer' : 'Add New Offer'}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="h-9 px-3 border border-border bg-card hover:bg-accent rounded-md transition-colors text-xs font-medium uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="offer-form"
                            className="h-9 px-3 bg-foreground hover:bg-foreground/85 text-background rounded-md transition-colors text-xs font-medium uppercase tracking-wider"
                        >
                            {editingId ? 'Update' : 'Save Offer'}
                        </button>
                    </>
                }
            >
                <form id="offer-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Merchant Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Best Buy"
                                    className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                    value={formData.merchantName}
                                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm font-mono tabular-nums focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none cursor-pointer"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    onClick={(e) => {
                                        try {
                                            // Explicitly show picker on click for better UX
                                            const input = e.currentTarget as DateInputWithPicker;
                                            input.showPicker?.();
                                        } catch {
                                            // Fallback or ignore if not supported
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Category</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {CATEGORIES.map((cat) => {
                                    const Icon = CATEGORY_ICONS[cat];
                                    const cc = getCategoryColor(cat);
                                    const active = formData.category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat })}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-md border transition-colors text-left",
                                                active
                                                    ? cn(cc.tile, cc.text, "ring-1 ring-inset border-transparent", cc.ring)
                                                    : "border-border bg-card hover:bg-accent text-muted-foreground"
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                            <span className="text-[11px] font-medium truncate">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Offer Details</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Spend $100, get $20 back"
                                className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Terms & Conditions</label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Online only, expires soon..."
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none resize-none"
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Card Selection */}
                    <div className="pt-4 border-t border-border">
                        <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                            Track on Cards <span className="text-destructive">*</span>
                        </label>
                        {cards.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No cards available. Add cards in the Cards tab first.</p>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {cards.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => {
                                                toggleCardSelection(card.id);
                                                setErrors(prev => ({ ...prev, cards: undefined }));
                                            }}
                                            className={cn(
                                                "flex items-center p-2.5 border rounded-md cursor-pointer transition-colors",
                                                selectedCards.has(card.id)
                                                    ? "bg-foreground/5 border-foreground"
                                                    : "border-border bg-card hover:bg-accent",
                                                errors.cards ? "border-destructive bg-destructive/5" : ""
                                            )}
                                        >
                                            <div
                                                className="w-1 h-8 rounded-sm mr-2.5 shrink-0"
                                                style={{ backgroundColor: card.color || '#666' }}
                                            />
                                            <CreditCard className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium truncate">{card.name}</div>
                                                <div className="text-[11px] text-muted-foreground font-mono">
                                                    {card.issuer} · •••• {card.last4}
                                                </div>
                                            </div>
                                            {selectedCards.has(card.id) && (
                                                <div className="dot bg-foreground shrink-0 ml-2" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {errors.cards && (
                                    <p className="text-xs text-destructive">{errors.cards}</p>
                                )}
                            </div>
                        )}
                    </div>


                </form>
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredOffers.map((offer) => {
                    const CategoryIcon = CATEGORY_ICONS[offer.category] || CATEGORY_ICONS['Other'];
                    const expiryDate = parseOfferDate(offer.expiryDate);
                    const isValidDate = !isNaN(expiryDate.getTime());
                    const isExpired = isOfferExpired(offer);
                    const expiryLabel = offer.expiryDate && isValidDate
                        ? format(expiryDate, 'MMM dd, yyyy')
                        : 'No date';

                    const cc = getCategoryColor(offer.category);
                    return (
                        <div key={offer.id} className={cn(
                            "bg-card border border-border rounded-lg overflow-hidden transition-colors relative group",
                            isExpired ? "opacity-60 hover:opacity-100" : "hover:border-foreground/30"
                        )}>
                            <div className={cn("h-0.5 w-full", cc.bar)} aria-hidden />
                            <div className="p-4">
                            <div className="flex justify-between items-start mb-2 gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <div className={cn("p-1.5 rounded-md shrink-0", cc.tile)}>
                                        <CategoryIcon className="w-3.5 h-3.5" strokeWidth={2} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={cn("text-sm font-semibold leading-tight tracking-tight truncate", isExpired && "line-through decoration-destructive/50")}>
                                            {offer.merchantName}
                                        </h3>
                                        <span className={cn("text-[10px] uppercase tracking-widest font-medium", cc.text)}>{offer.category}</span>
                                    </div>
                                </div>
                                <div className="flex gap-0.5 shrink-0">
                                    <button
                                        onClick={() => handleEdit(offer)}
                                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                                        aria-label="Edit offer"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(offer.id)}
                                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                        aria-label="Delete offer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-foreground/90 font-medium mb-2 leading-snug">{offer.description}</p>

                            <div className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed" title={offer.terms}>
                                <Info className="w-3 h-3 inline mr-1 mb-0.5" />
                                {offer.terms}
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-muted-foreground border-t border-border pt-2">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    <span className="uppercase tracking-wider opacity-70">EXP</span>
                                    {expiryLabel}
                                </div>
                                {isExpired && <span className="text-destructive uppercase tracking-wider">Expired</span>}
                            </div>
                            </div>
                        </div>
                    );
                })}

                {offers.length === 0 && !isFormOpen && (
                    <div className="col-span-full py-16 text-center border border-dashed border-border rounded-lg grid-pattern relative">
                        <div className="relative inline-flex flex-col items-center gap-2 px-8 py-6 bg-background rounded-lg border border-border">
                            <p className="text-sm font-medium">No offers yet</p>
                            <p className="text-xs text-muted-foreground">Click "Add Offer" to start tracking.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfferManager;
