import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useSearch } from '../hooks/useSearch';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import type { Offer } from '../types';
import { Trash2, Calendar, Info, CreditCard, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn, parseOfferDate } from '../lib/utils';
import { CATEGORIES, CATEGORY_ICONS } from '../lib/constants';

const OfferManager: React.FC = () => {
    const { offers, cards, trackedOffers, addOffer, updateOffer, deleteOffer, trackOffer } = useStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ cards?: string }>({});

    const { searchTerm, setSearchTerm, filteredItems: filteredOffers } = useSearch(offers, ['merchantName', 'description', 'terms', 'category']);

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
            // Sequential tracking or Promise.all
            await Promise.all(Array.from(selectedCards).map(cardId =>
                trackOffer(offerId!, cardId)
            ));
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
                            className="px-4 py-2 text-muted-foreground hover:bg-secondary rounded-md transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="offer-form"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium"
                        >
                            {editingId ? 'Update Offer' : 'Save Offer'}
                        </button>
                    </>
                }
            >
                <form id="offer-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Merchant Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Best Buy"
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.merchantName}
                                    onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    onClick={(e) => {
                                        try {
                                            // Explicitly show picker on click for better UX
                                            if ('showPicker' in e.currentTarget) {
                                                (e.currentTarget as any).showPicker();
                                            }
                                        } catch (error) {
                                            // Fallback or ignore if not supported
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map((cat) => {
                                    const Icon = CATEGORY_ICONS[cat];
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat })}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16",
                                                formData.category === cat
                                                    ? "bg-primary/10 border-primary text-primary ring-1 ring-primary"
                                                    : "hover:bg-secondary/50 border-transparent bg-secondary/30"
                                            )}
                                        >
                                            <Icon className="w-4 h-4 mb-1" />
                                            <span className="text-[10px] uppercase tracking-wide font-medium">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Offer Details</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Spend $100, get $20 back"
                                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Online only, expires soon..."
                                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Card Selection UI */}
                    <div className="pt-4 border-t">
                        <label className="block text-sm font-medium mb-2">
                            Add to Cards <span className="text-red-500">*</span>
                        </label>
                        {cards.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No cards available. Add cards in the Cards tab first.</p>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {cards.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => {
                                                toggleCardSelection(card.id);
                                                setErrors(prev => ({ ...prev, cards: undefined }));
                                            }}
                                            className={cn(
                                                "flex items-center p-3 border rounded-lg cursor-pointer transition-all",
                                                selectedCards.has(card.id)
                                                    ? "bg-secondary border-primary ring-1 ring-primary"
                                                    : "hover:bg-secondary/50 border-border",
                                                errors.cards ? "border-red-300 bg-red-50 dark:bg-red-900/10" : ""
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-sm transition-transform",
                                                    selectedCards.has(card.id) ? "scale-110" : "scale-100"
                                                )}
                                                style={{ backgroundColor: card.color || '#666' }}
                                            >
                                                <CreditCard className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{card.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <span>{card.issuer} •••• {card.last4}</span>
                                                    {card.cardHolder && (
                                                        <span className="opacity-70 truncate border-l pl-1 ml-1">
                                                            {card.cardHolder}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedCards.has(card.id) && (
                                                <div className="w-3 h-3 rounded-full bg-primary shrink-0 ml-2" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {errors.cards && (
                                    <p className="text-sm text-red-500 animate-in slide-in-from-left-1">{errors.cards}</p>
                                )}
                            </div>
                        )}
                    </div>


                </form>
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOffers.map((offer) => {
                    const CategoryIcon = CATEGORY_ICONS[offer.category] || CATEGORY_ICONS['Other'];
                    const expiryDate = parseOfferDate(offer.expiryDate);
                    const isValidDate = !isNaN(expiryDate.getTime());
                    const isExpired = isValidDate && expiryDate < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                        <div key={offer.id} className={cn(
                            "bg-card border rounded-lg p-4 shadow-sm transition-all relative group",
                            isExpired ? "opacity-60 hover:opacity-100" : "hover:shadow-md"
                        )}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                                        <CategoryIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={cn("font-bold text-lg leading-tight", isExpired && "line-through decoration-red-500/50 decoration-2")}>
                                            {offer.merchantName}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(offer)}
                                        className="p-1 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                                        aria-label="Edit offer"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(offer.id)}
                                        className={cn(
                                            "p-1 rounded transition-colors",
                                            isExpired
                                                ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                                : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        )}
                                        aria-label="Delete offer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-primary font-medium mb-2 mt-2">{offer.description}</p>

                            <div className="text-sm text-muted-foreground mb-4 line-clamp-2" title={offer.terms}>
                                <Info className="w-3 h-3 inline mr-1" />
                                {offer.terms}
                            </div>

                            <div className="flex items-center text-sm text-muted-foreground mt-2 border-t pt-2">
                                <Calendar className="w-3 h-3 mr-1" />
                                Expires: {offer.expiryDate && !isNaN(parseOfferDate(offer.expiryDate).getTime())
                                    ? format(parseOfferDate(offer.expiryDate), 'MMM d, yyyy')
                                    : 'No date'}
                            </div>
                        </div>
                    );
                })}

                {offers.length === 0 && !isFormOpen && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        <p>No offers tracked yet. Click "Add Offer" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfferManager;
