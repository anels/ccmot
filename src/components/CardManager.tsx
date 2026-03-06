import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useSearch } from '../hooks/useSearch';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import type { CardIssuer, CreditCard } from '../types';
import { Trash2, CreditCard as CardIcon, Edit2, FileText, Settings, Wallet, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { ISSUER_COLORS } from '../lib/constants';
import { CardTypeModal } from './CardTypeModal';
import { RewardConfig } from './RewardConfig';

const CardManager: React.FC = () => {
    const { cards, cardTypes, addCard, updateCard, deleteCard, addCardType } = useStore();
    const [activeTab, setActiveTab] = useState<'wallet' | 'config'>('wallet');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false); // State for new type modal
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { searchTerm, setSearchTerm, filteredItems: filteredCards } = useSearch(cards, ['name', 'issuer', 'last4', 'cardHolder', 'notes']);

    const [formData, setFormData] = useState<{
        name: string;
        issuer: CardIssuer;
        last4: string;
        color: string;
        cardHolder: string;
        notes: string;
        cardTypeId?: string;
    }>({
        name: '',
        issuer: 'Amex',
        last4: '',
        color: ISSUER_COLORS['Amex'],
        cardHolder: '',
        notes: '',
        cardTypeId: undefined,
    });

    const resetForm = () => {
        setFormData({
            name: '',
            issuer: 'Amex',
            last4: '',
            color: ISSUER_COLORS['Amex'],
            cardHolder: '',
            notes: '',
            cardTypeId: undefined,
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
            cardTypeId: card.cardTypeId,
        });
        setEditingId(card.id);
        setIsFormOpen(true);
    };

    const handleCardTypeChange = (typeId: string) => {
        if (typeId === 'new') {
            setIsCreateTypeOpen(true);
            return;
        }

        const selectedType = cardTypes.find(t => t.id === typeId);
        if (selectedType) {
            setFormData(prev => ({
                ...prev,
                cardTypeId: typeId,
                name: selectedType.name,
                issuer: selectedType.issuer,
                color: selectedType.color || ISSUER_COLORS[selectedType.issuer] || '#000000',
            }));
        } else {
            // Reset to default if cleared, or keep as is? 
            // Better to keep as is so they don't lose data, but maybe reset issuer/color to default?
            setFormData(prev => ({ ...prev, cardTypeId: undefined }));
        }
    };

    const handleCreateTypeSave = async (data: { name: string; issuer: CardIssuer; color: string }) => {
        const id = await addCardType(data);
        setIsCreateTypeOpen(false);
        // Auto select the new type
        setFormData(prev => ({
            ...prev,
            cardTypeId: id,
            name: data.name,
            issuer: data.issuer,
            color: data.color || ISSUER_COLORS[data.issuer] || '#000000',
        }));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            await updateCard(editingId, formData);
        } else {
            await addCard(formData);
        }

        resetForm();
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await deleteCard(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Card"
                message="Are you sure you want to delete this card? This action cannot be undone and will remove all associated tracked offers."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                        Cards
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your wallet and card configurations.</p>
                </div>

                <div className="flex p-1 bg-secondary/50 rounded-xl">
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'wallet'
                                ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50"
                        )}
                    >
                        <Wallet size={16} />
                        My Wallet
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'config'
                                ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50"
                        )}
                    >
                        <Settings size={16} />
                        Configuration
                    </button>
                </div>
            </div>

            {activeTab === 'config' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RewardConfig />
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder={"Search cards..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 rounded-xl border bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-primary/25 flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={18} />
                            Add Card
                        </button>
                    </div>

                    <Modal
                        isOpen={isFormOpen}
                        onClose={() => setIsFormOpen(false)}
                        title={editingId ? 'Edit Card' : 'Add New Card'}
                        className="max-w-4xl" // Wider modal for grid layout
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Card Details */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1">Card Type (Template)</label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                                value={formData.cardTypeId || ''}
                                                onChange={(e) => handleCardTypeChange(e.target.value)}
                                            >
                                                <option value="">Select a card type...</option>
                                                {cardTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name} ({type.issuer})</option>
                                                ))}
                                                <option disabled>──────────</option>
                                                <option value="new" className="text-primary font-medium">+ Create New Card Type</option>
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1">Selecting a type will auto-fill name, issuer, and color.</p>
                                        </div>
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
                                            <label className="block text-sm font-medium mb-1">Last 4 Digits</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={4}
                                                placeholder="1234"
                                                className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                                                value={formData.last4}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    setFormData({ ...formData, last4: value });
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                                            <Settings size={14} />
                                            {formData.cardTypeId ? "Configured by Card Type" : "Select a Card Type"}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-muted-foreground">Issuer</span>
                                                <span className="font-semibold">{formData.issuer}</span>
                                            </div>
                                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-muted-foreground">Color</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm" style={{ backgroundColor: formData.color }} />
                                                    <span className="text-sm font-mono">{formData.color}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Card Holder</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                                            value={formData.cardHolder}
                                            onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Notes</label>
                                        <textarea
                                            rows={2}
                                            placeholder="e.g. Annual fee $95, renews in Jan"
                                            className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Preview */}
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium mb-2 opacity-0 md:opacity-100">Card Preview</label>
                                    <div className="p-6 border rounded-xl bg-secondary/10 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                                        <div className="relative overflow-hidden rounded-xl shadow-2xl transition-all w-80 h-52 text-white flex flex-col justify-between p-6 transform hover:scale-105 duration-300"
                                            style={{ backgroundColor: formData.color }}
                                        >
                                            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                            <div className="absolute bottom-0 left-0 p-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                                            <div className="relative z-10 flex justify-between items-start">
                                                <span className="font-bold tracking-widest text-sm shadow-black/20 text-shadow-sm uppercase">{formData.issuer}</span>
                                                <CardIcon className="w-8 h-8 opacity-80 drop-shadow-md" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-10 h-6 bg-yellow-400/80 rounded-md shadow-sm"></div>
                                                    <div className="text-[10px] opacity-60 font-mono">Contactless</div>
                                                </div>
                                                <div className="font-mono text-xl tracking-widest drop-shadow-md mb-4 shadow-black/20 text-shadow-sm">
                                                    •••• •••• •••• {formData.last4 || '1234'}
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-[8px] opacity-70 uppercase tracking-widest mb-0.5">Card Holder</div>
                                                        <div className="text-xs font-medium uppercase tracking-widest shadow-black/20 text-shadow-sm">
                                                            {formData.cardHolder || 'YOUR NAME'}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-mono opacity-80">
                                                        {formData.name || 'CARD NAME'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
                                            Visualize how your card will appear in the dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 border rounded-lg hover:bg-muted transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.cardTypeId}
                                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editingId ? 'Update Card' : 'Save Card'}
                                </button>
                            </div>
                        </form>
                    </Modal>

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
                                        <div className="flex flex-col">
                                            <span className="font-semibold tracking-wider text-xs drop-shadow-sm">{card.issuer}</span>
                                            {(() => {
                                                const type = cardTypes.find(t => t.id === card.cardTypeId);
                                                return type ? (
                                                    <span className="text-[10px] font-medium opacity-90 tracking-wide drop-shadow-sm">{type.name}</span>
                                                ) : null;
                                            })()}
                                        </div>
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
                                                onClick={() => setDeleteId(card.id)}
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
            )}

            <CardTypeModal
                isOpen={isCreateTypeOpen}
                onClose={() => setIsCreateTypeOpen(false)}
                onSave={handleCreateTypeSave}
                title="Create New Card Type"
            />
        </div>
    );
};

export default CardManager;
