import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useSearch } from '../hooks/useSearch';
import type { CardIssuer, CreditCard } from '../types';
import { Trash2, Plus, CreditCard as CardIcon, Edit2, FileText, Search, X } from 'lucide-react';

const ISSUERS: CardIssuer[] = ['Amex', 'Chase', 'Citi', 'Capital One', 'Discover', 'Bank of America', 'Wells Fargo', 'US Bank', 'Other'];

const ISSUER_COLORS: Record<CardIssuer, string> = {
    'Amex': '#006FCF',
    'Chase': '#117ACA',
    'Citi': '#003B70',
    'Capital One': '#004977',
    'Discover': '#FF6000',
    'Bank of America': '#E31837',
    'Wells Fargo': '#D71E28',
    'US Bank': '#00355F',
    'Other': '#374151',
};

const CardManager: React.FC = () => {
    const { cards, addCard, updateCard, deleteCard } = useStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { searchTerm, setSearchTerm, filteredItems: filteredCards } = useSearch(cards, ['name', 'issuer', 'last4', 'cardHolder', 'notes']);

    const [formData, setFormData] = useState<{
        name: string;
        issuer: CardIssuer;
        last4: string;
        color: string;
        cardHolder: string;
        notes: string;
    }>({
        name: '',
        issuer: 'Amex',
        last4: '',
        color: ISSUER_COLORS['Amex'],
        cardHolder: '',
        notes: '',
    });

    const resetForm = () => {
        setFormData({
            name: '',
            issuer: 'Amex',
            last4: '',
            color: ISSUER_COLORS['Amex'],
            cardHolder: '',
            notes: '',
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (card: CreditCard) => {
        setFormData({
            name: card.name,
            issuer: card.issuer,
            last4: card.last4,
            color: card.color,
            cardHolder: card.cardHolder || '',
            notes: card.notes || '',
        });
        setEditingId(card.id);
        setIsFormOpen(true);
    };

    const handleIssuerChange = (issuer: CardIssuer) => {
        setFormData(prev => ({
            ...prev,
            issuer,
            color: ISSUER_COLORS[issuer] || '#000000',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            updateCard(editingId, formData);
        } else {
            addCard(formData);
        }

        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">My Cards</h2>

                <div className="flex items-center gap-3">
                    {!isFormOpen && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search cards..."
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
                            Add Card
                        </button>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <div className="bg-card border rounded-lg p-6 shadow-md animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Card' : 'Add New Card'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Card Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Gold Card"
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Issuer</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.issuer}
                                    onChange={(e) => handleIssuerChange(e.target.value as CardIssuer)}
                                >
                                    {ISSUERS.map((issuer) => (
                                        <option key={issuer} value={issuer}>{issuer}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Last 4 Digits</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="1234"
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                                    value={formData.last4}
                                    onChange={(e) => setFormData({ ...formData, last4: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Card Color</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            className="h-10 w-16 p-0 border-none rounded cursor-pointer overflow-hidden shadow-sm"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase font-mono text-muted-foreground">{formData.color}</span>
                                        <span className="text-xs text-muted-foreground">Auto-set by issuer</span>
                                    </div>
                                </div>
                            </div>

                            {/* New Fields */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Card Holder (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.cardHolder}
                                    onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Annual fee $95, renews in Jan"
                                    className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Live Preview - Compact Version */}
                        <div className="mt-6 p-4 border rounded-xl bg-secondary/10">
                            <label className="block text-sm font-medium mb-3 text-muted-foreground">Preview (Compact)</label>
                            <div className="relative overflow-hidden rounded-xl shadow-lg transition-all mx-auto md:mx-0 w-full md:w-72 h-40 text-white flex flex-col justify-between p-5"
                                style={{ backgroundColor: formData.color }}
                            >
                                <div className="absolute top-0 right-0 p-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 p-24 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                                <div className="relative z-10 flex justify-between items-start">
                                    <span className="font-bold tracking-wider text-sm shadow-black/20 text-shadow-sm">{formData.issuer}</span>
                                    <CardIcon className="w-6 h-6 opacity-90 drop-shadow-md" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-[10px] opacity-80 mb-0.5 font-medium uppercase tracking-wider">{formData.name || 'CARD NAME'}</div>
                                    <div className="font-mono text-lg tracking-widest drop-shadow-md mb-2">
                                        •••• {formData.last4 || '1234'}
                                    </div>
                                    {formData.cardHolder && (
                                        <div className="text-[10px] font-mono opacity-90 uppercase tracking-widest truncate">
                                            {formData.cardHolder}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
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
                                {editingId ? 'Update Card' : 'Save Card'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCards.map((card) => (
                    <div key={card.id} className="relative group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        <div
                            className="h-32 p-4 flex flex-col justify-between text-white relative overflow-hidden"
                            style={{ backgroundColor: card.color }}
                        >
                            <div className="absolute top-0 right-0 p-20 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 p-20 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                            <div className="relative z-10 flex justify-between items-start">
                                <span className="font-semibold tracking-wider text-xs drop-shadow-sm">{card.issuer}</span>
                                <CardIcon className="w-5 h-5 opacity-90 drop-shadow-sm" />
                            </div>
                            <div className="relative z-10">
                                <div className="font-mono text-lg tracking-widest drop-shadow-sm stroke-black">•••• {card.last4}</div>
                                {card.cardHolder && (
                                    <div className="text-[10px] font-mono opacity-80 uppercase tracking-wider truncate mt-1">
                                        {card.cardHolder}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-foreground/90 truncate mr-2" title={card.name}>{card.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleEdit(card)}
                                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-full transition-all"
                                        aria-label="Edit card"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => deleteCard(card.id)}
                                        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                        aria-label="Delete card"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            {card.notes && (
                                <div className="text-xs text-muted-foreground flex items-start gap-1 mt-1 line-clamp-2" title={card.notes}>
                                    <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>{card.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {cards.length === 0 && !isFormOpen && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-secondary/5">
                        <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CardIcon className="w-6 h-6 opacity-50" />
                        </div>
                        <p className="text-base font-medium text-foreground">No cards added</p>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-all shadow-sm"
                        >
                            Add Card
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardManager;
