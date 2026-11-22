import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { useSearch } from '../hooks/useSearch';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import type { CardIssuer, CreditCard } from '../types';
import { Trash2, CreditCard as CardIcon, Edit2, FileText, Settings, Wallet, Plus } from 'lucide-react';
import { cn, getReadableTextColor } from '../lib/utils';
import { ISSUER_COLORS } from '../lib/constants';
import { CardTypeModal } from './CardTypeModal';
import { RewardConfig } from './RewardConfig';

const CARD_SEARCH_FIELDS: (keyof CreditCard)[] = ['name', 'issuer', 'last4', 'cardHolder', 'notes'];

const CardManager: React.FC = () => {
    const { cards, cardTypes, addCard, updateCard, deleteCard, addCardType } = useStore();
    const [activeTab, setActiveTab] = useState<'wallet' | 'config'>('wallet');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false); // State for new type modal
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { searchTerm, setSearchTerm, filteredItems: filteredCards } = useSearch(cards, CARD_SEARCH_FIELDS);

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
            setFormData(prev => ({ ...prev, cardTypeId: undefined }));
        }
    };

    const handleCreateTypeSave = async (data: { name: string; issuer: CardIssuer; color: string }) => {
        const id = await addCardType(data);
        if (!id) {
            // addCardType failed; the store already refetched. Keep the
            // dialog open so the user's input is not lost.
            return;
        }
        setIsCreateTypeOpen(false);
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

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Wallet</p>
                    <h1 className="text-3xl font-semibold tracking-tight mt-1">Cards</h1>
                </div>

                <div className="inline-flex bg-muted rounded-md border border-border p-0.5">
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={cn(
                            "h-8 px-3 rounded-sm text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5",
                            activeTab === 'wallet'
                                ? "bg-card text-foreground border border-border"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Wallet size={13} />
                        Wallet
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "h-8 px-3 rounded-sm text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5",
                            activeTab === 'config'
                                ? "bg-card text-foreground border border-border"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Settings size={13} />
                        Catalog
                    </button>
                </div>
            </div>

            {activeTab === 'config' ? (
                <div className="animate-in fade-in duration-200">
                    <RewardConfig />
                </div>
            ) : (
                <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search cards…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-9 px-3 rounded-md border border-border bg-card text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="h-9 px-3 bg-foreground hover:bg-foreground/85 text-background rounded-md text-xs font-medium uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                        >
                            <Plus size={14} strokeWidth={2.5} />
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
                                            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Card Type (Template)</label>
                                            <select
                                                className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                                value={formData.cardTypeId || ''}
                                                onChange={(e) => handleCardTypeChange(e.target.value)}
                                            >
                                                <option value="">Select a card type…</option>
                                                {cardTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name} ({type.issuer})</option>
                                                ))}
                                                <option disabled>──────────</option>
                                                <option value="new" className="font-semibold">+ Create New Card Type</option>
                                            </select>
                                            <p className="text-xs text-muted-foreground mt-1.5">Selecting a type will auto-fill name, issuer, and color.</p>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Card Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Gold Card"
                                                className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Last 4 Digits</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                required
                                                pattern="[0-9]{4}"
                                                title="4 digits"
                                                maxLength={4}
                                                placeholder="1234"
                                                className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm font-mono focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                                value={formData.last4}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                                    setFormData({ ...formData, last4: value });
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 bg-muted/40 rounded-md border border-dashed border-border">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5 font-medium">
                                            <Settings size={11} />
                                            {formData.cardTypeId ? "Inherited from Card Type" : "Select a Card Type"}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Issuer</span>
                                                <span className="text-sm font-medium">{formData.issuer}</span>
                                            </div>
                                            <div className="h-8 w-px bg-border" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Color</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: formData.color }} />
                                                    <span className="text-xs font-mono uppercase">{formData.color}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Card Holder</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                            value={formData.cardHolder}
                                            onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Notes</label>
                                        <textarea
                                            rows={2}
                                            placeholder="e.g. Annual fee $95, renews in Jan"
                                            className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none resize-none"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Preview */}
                                <div className="flex flex-col">
                                    <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 opacity-0 md:opacity-100">Card Preview</label>
                                    <div className="p-6 border border-border/70 rounded-md bg-muted/30 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                                        <div className="relative overflow-hidden rounded-xl shadow-2xl transition-all w-80 h-52 flex flex-col justify-between p-6 transform hover:scale-105 duration-300"
                                            style={{ backgroundColor: formData.color, color: getReadableTextColor(formData.color) }}
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

                            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="h-9 px-3 border border-border rounded-md bg-card hover:bg-accent transition-colors text-xs font-medium uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editingId && !formData.cardTypeId}
                                    className="h-9 px-3 bg-foreground text-background rounded-md hover:bg-foreground/85 transition-colors text-xs font-medium uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={!editingId && !formData.cardTypeId ? 'Pick a card type to continue' : ''}
                                >
                                    {editingId ? 'Update' : 'Save Card'}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredCards.map((card) => (
                            <div key={card.id} className="relative group overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-colors hover:border-foreground/30">
                                <div
                                    className="h-32 p-4 flex flex-col justify-between relative overflow-hidden"
                                    style={{ backgroundColor: card.color, color: getReadableTextColor(card.color) }}
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

                                <div className="p-3 bg-card border-t border-border">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-sm font-medium truncate" title={card.name}>{card.name}</span>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button
                                                onClick={() => handleEdit(card)}
                                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                                                aria-label="Edit card"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(card.id)}
                                                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                aria-label="Delete card"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {card.notes && (
                                        <div className="text-[11px] text-muted-foreground flex items-start gap-1 mt-1 line-clamp-2" title={card.notes}>
                                            <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                                            <span>{card.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {cards.length > 0 && filteredCards.length === 0 && !isFormOpen && (
                            <div className="col-span-full py-10 text-center border border-dashed border-border rounded-lg bg-muted/20">
                                <p className="text-sm font-medium">No matches</p>
                                <p className="text-xs text-muted-foreground mt-1">No cards match "{searchTerm}".</p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-3 h-7 px-2.5 border border-border bg-card text-xs font-medium uppercase tracking-wider rounded-md hover:bg-accent transition-colors"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}

                        {cards.length === 0 && !isFormOpen && (
                            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-lg grid-pattern relative">
                                <div className="relative bg-background inline-flex flex-col items-center gap-3 px-8 py-6 rounded-lg border border-border">
                                    <CardIcon className="w-6 h-6 text-muted-foreground" />
                                    <p className="text-sm font-medium">No cards in wallet</p>
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setIsFormOpen(true);
                                        }}
                                        className="h-8 px-3 bg-foreground text-background text-xs font-medium uppercase tracking-wider rounded-md hover:bg-foreground/85 transition-colors"
                                    >
                                        Add First Card
                                    </button>
                                </div>
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
