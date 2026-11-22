import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { CATEGORIES } from '../lib/constants';
import { Trash2, Plus, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import type { CardIssuer, CardType, Reward } from '../types';
import { CardTypeModal } from './CardTypeModal';
import { ConfirmDialog } from './ConfirmDialog';

type RewardDraft = {
    cardTypeId: string;
    category: string;
    rewardValue: number;
    rewardUnit: Reward['rewardUnit'];
    description: string;
};

export const RewardConfig: React.FC = () => {
    const { cardTypes, rewards, addCardType, updateCardType, deleteCardType, addReward, deleteReward } = useStore();
    const [expandedCardType, setExpandedCardType] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<CardType | undefined>(undefined);
    const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);

    const handleCreate = () => {
        setEditingType(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (type: CardType) => {
        setEditingType(type);
        setIsModalOpen(true);
    };

    const handleSave = async (data: { name: string; issuer: CardIssuer; color: string }) => {
        if (editingType) {
            await updateCardType(editingType.id, data);
            return;
        }
        // Propagate addCardType's '' failure signal so the modal stays open.
        return addCardType(data);
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Catalog</p>
                    <h2 className="text-xl font-semibold tracking-tight mt-0.5">Card Types & Rewards</h2>
                </div>
                <button
                    onClick={handleCreate}
                    className="h-9 px-3 bg-foreground text-background rounded-md text-xs font-medium uppercase tracking-wider hover:bg-foreground/85 transition-colors inline-flex items-center gap-1.5"
                >
                    <Plus size={14} strokeWidth={2.5} /> Card Type
                </button>
            </div>

            <CardTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingType}
                title={editingType ? 'Edit Card Type' : 'New Card Type'}
            />

            <ConfirmDialog
                isOpen={!!deleteTypeId}
                onClose={() => setDeleteTypeId(null)}
                onConfirm={() => { if (deleteTypeId) deleteCardType(deleteTypeId); }}
                title="Delete Card Type"
                message="Delete this card type? Its reward rules will be deleted and cards using it will be unlinked."
            />

            <div className="space-y-2">
                {cardTypes.length === 0 && (
                    <div className="text-center py-12 bg-muted/20 rounded-md border border-dashed border-border">
                        <p className="text-sm text-muted-foreground">No card types defined.</p>
                        <button onClick={handleCreate} className="mt-3 text-xs font-medium text-foreground hover:underline uppercase tracking-wider">
                            Create your first card type
                        </button>
                    </div>
                )}
                {cardTypes.map(cardType => (
                    <CardTypeRow
                        key={cardType.id}
                        cardType={cardType}
                        rewards={rewards.filter(r => r.cardTypeId === cardType.id)}
                        isExpanded={expandedCardType === cardType.id}
                        toggleExpand={() => setExpandedCardType(expandedCardType === cardType.id ? null : cardType.id)}
                        onEdit={() => handleEdit(cardType)}
                        onDelete={() => setDeleteTypeId(cardType.id)}
                        onAddReward={addReward}
                        onDeleteReward={deleteReward}
                    />
                ))}
            </div>
        </div>
    );
};

const CardTypeRow: React.FC<{
    cardType: CardType;
    rewards: Reward[];
    isExpanded: boolean;
    toggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddReward: (r: RewardDraft) => Promise<void>;
    onDeleteReward: (id: string) => Promise<void>;
}> = ({ cardType, rewards, isExpanded, toggleExpand, onEdit, onDelete, onAddReward, onDeleteReward }) => {
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value) return;

        const finalCategory = isCustomCategory ? customCategory : category;
        if (!finalCategory) return;

        await onAddReward({
            cardTypeId: cardType.id,
            category: finalCategory,
            rewardValue: parseFloat(value),
            rewardUnit: '%',
            description
        });
        setValue('');
        setDescription('');
        if (isCustomCategory) setCustomCategory('');
    };

    return (
        <div className="bg-card rounded-md border border-border overflow-hidden">
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/40 transition-colors"
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? <ChevronDown size={16} className="text-muted-foreground shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
                    <div className="w-1 h-9 rounded-sm shrink-0" style={{ backgroundColor: cardType.color }} />
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{cardType.name}</h3>
                        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{cardType.issuer}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {rewards.length} {rewards.length === 1 ? 'rule' : 'rules'}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        title="Edit Card Type"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Card Type"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 bg-muted/30 border-t border-border">
                    <form onSubmit={handleAddReward} className="flex flex-wrap gap-2 items-end mb-3 pb-3 border-b border-border">
                        <div>
                            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Category</label>
                            <div className="flex gap-1.5">
                                {!isCustomCategory ? (
                                    <select
                                        value={category}
                                        onChange={(e) => {
                                            if (e.target.value === 'Custom') setIsCustomCategory(true);
                                            else setCategory(e.target.value as typeof CATEGORIES[number]);
                                        }}
                                        className="h-8 px-2 rounded-md border border-border text-xs bg-card focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="Custom">Custom…</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            placeholder="Enter category"
                                            className="h-8 px-2 rounded-md border border-border text-xs bg-card w-32 focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomCategory(false)}
                                            className="text-[11px] text-muted-foreground hover:text-foreground"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-20">
                            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Value %</label>
                            <input
                                type="number"
                                step="0.1"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="5"
                                className="w-full h-8 px-2 rounded-md border border-border text-xs bg-card font-mono tabular-nums focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                            />
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Note</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Rotating category"
                                className="w-full h-8 px-2 rounded-md border border-border text-xs bg-card focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                            />
                        </div>
                        <button type="submit" className="h-8 px-3 bg-foreground hover:bg-foreground/85 text-background rounded-md text-[11px] font-medium uppercase tracking-wider transition-colors">
                            Add Rule
                        </button>
                    </form>

                    <div className="space-y-1">
                        {rewards.length === 0 && <p className="text-xs text-muted-foreground italic">No rewards configured.</p>}
                        {rewards.map(reward => (
                            <div key={reward.id} className="flex items-center justify-between bg-card px-3 py-1.5 rounded-md border border-border">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-mono tabular-nums font-semibold text-gain bg-gain-soft px-1.5 py-0.5 rounded-sm text-xs min-w-[44px] text-center">
                                        {reward.rewardValue}%
                                    </span>
                                    <span className="text-xs font-medium truncate">
                                        {reward.category}
                                    </span>
                                    {reward.description && (
                                        <span className="text-[11px] text-muted-foreground truncate border-l border-border pl-3">
                                            {reward.description}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onDeleteReward(reward.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10 shrink-0"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
