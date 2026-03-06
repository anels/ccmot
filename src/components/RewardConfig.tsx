import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { CATEGORIES } from '../lib/constants';
import { Trash2, Plus, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import type { CardType, Reward } from '../types';
import { CardTypeModal } from './CardTypeModal';

export const RewardConfig: React.FC = () => {
    const { cardTypes, rewards, addCardType, updateCardType, deleteCardType, addReward, deleteReward } = useStore();
    const [expandedCardType, setExpandedCardType] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<CardType | undefined>(undefined);

    const handleCreate = () => {
        setEditingType(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (type: CardType) => {
        setEditingType(type);
        setIsModalOpen(true);
    };

    const handleSave = async (data: { name: string; issuer: any; color: string }) => {
        if (editingType) {
            await updateCardType(editingType.id, data);
        } else {
            await addCardType(data);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reward Configuration</h1>
                    <p className="text-gray-600 dark:text-gray-400">Define credit card types and their rewards here.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg hover:bg-primary/90"
                >
                    <Plus size={18} /> Add Card Type
                </button>
            </div>

            <CardTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingType}
                title={editingType ? 'Edit Card Type' : 'Add New Card Type'}
            />

            {/* List Card Types */}
            <div className="space-y-4">
                {cardTypes.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-muted-foreground">No card types defined yet.</p>
                        <button onClick={handleCreate} className="mt-4 text-primary font-medium hover:underline">Create your first card type</button>
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
                        onDelete={() => deleteCardType(cardType.id)}
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
    onAddReward: (r: any) => Promise<void>;
    onDeleteReward: (id: string) => Promise<void>;
}> = ({ cardType, rewards, isExpanded, toggleExpand, onEdit, onDelete, onAddReward, onDeleteReward }) => {
    // New Reward State
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value) return;

        const finalCategory = isCustomCategory ? customCategory : category;
        if (!finalCategory) {
            console.error('No category selected');
            return;
        }

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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                    <div className="w-10 h-6 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden relative shadow-sm border border-gray-300 dark:border-gray-600">
                        <div className="absolute inset-0" style={{ backgroundColor: cardType.color }} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{cardType.name}</h3>
                        <p className="text-sm text-gray-500">{cardType.issuer}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit Card Type"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Card Type"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                    {/* Add Reward Form */}
                    <form onSubmit={handleAddReward} className="flex flex-wrap gap-3 items-end mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                            <div className="flex gap-2">
                                {!isCustomCategory ? (
                                    <select
                                        value={category}
                                        onChange={(e) => {
                                            if (e.target.value === 'Custom') {
                                                setIsCustomCategory(true);
                                            } else {
                                                setCategory(e.target.value as any);
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-white"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="Custom">Custom...</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value)}
                                            placeholder="Enter category"
                                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-white w-32"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomCategory(false)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Select
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Value (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="5"
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Rotating category"
                                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <button type="submit" className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Add Rule
                        </button>
                    </form>

                    {/* Rewards List */}
                    <div className="space-y-2">
                        {rewards.length === 0 && <p className="text-sm text-gray-500 italic">No rewards configured.</p>}
                        {rewards.map(reward => (
                            <div key={reward.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-sm">
                                        {reward.rewardValue}%
                                    </span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {reward.category}
                                    </span>
                                    {reward.description && (
                                        <span className="text-sm text-gray-500 border-l border-gray-200 dark:border-gray-700 pl-3">
                                            {reward.description}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onDeleteReward(reward.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
