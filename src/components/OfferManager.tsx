import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useSearch } from '../hooks/useSearch';
import type { Offer, OfferCategory } from '../types';
import { Plus, Trash2, Calendar, Info, CreditCard, Edit2, Plane, Utensils, ShoppingBag, Clapperboard, Briefcase, HelpCircle, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const CATEGORIES: OfferCategory[] = ['Travel', 'Dining', 'Shopping', 'Entertainment', 'Service', 'Other'];

const CATEGORY_ICONS: Record<OfferCategory, React.ElementType> = {
    'Travel': Plane,
    'Dining': Utensils,
    'Shopping': ShoppingBag,
    'Entertainment': Clapperboard,
    'Service': Briefcase,
    'Other': HelpCircle,
};

const OfferManager: React.FC = () => {
    const { offers, cards, addOffer, updateOffer, deleteOffer, trackOffer } = useStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

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
        setSelectedCards(new Set());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let offerId = editingId;

        if (editingId) {
            updateOffer(editingId, formData);
        } else {
            offerId = addOffer(formData);
        }

        if (offerId) {
            selectedCards.forEach(cardId => {
                trackOffer(offerId, cardId);
            });
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Available Offers</h2>

                <div className="flex items-center gap-3">
                    {!isFormOpen && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search offers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-8 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none w-full md:w-64"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    {!isFormOpen && (
                        <button
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Offer
                        </button>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <div className="bg-card border rounded-lg p-6 shadow-md animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Offer' : 'Add New Offer'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as OfferCategory })}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
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
                                Add to Cards (Optional)
                            </label>
                            {cards.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No cards available. Add cards in the Cards tab first.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {cards.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => toggleCardSelection(card.id)}
                                            className={cn(
                                                "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                                                selectedCards.has(card.id)
                                                    ? "bg-primary/10 border-primary"
                                                    : "hover:bg-secondary/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center mr-3",
                                                selectedCards.has(card.id) ? "bg-primary border-primary" : "border-gray-400"
                                            )}>
                                                {selectedCards.has(card.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{card.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {card.issuer} •••• {card.last4}
                                                    {card.cardHolder && <span className="block opacity-80">{card.cardHolder}</span>}
                                                </div>
                                            </div>
                                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                {editingId ? 'Update Offer' : 'Save Offer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOffers.map((offer) => {
                    const CategoryIcon = CATEGORY_ICONS[offer.category] || HelpCircle;
                    const isExpired = new Date(offer.expiryDate) < new Date(new Date().setHours(0, 0, 0, 0));

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
                                        onClick={() => deleteOffer(offer.id)}
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
                                Expires: {format(new Date(offer.expiryDate), 'MMM d, yyyy')}
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
