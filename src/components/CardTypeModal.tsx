import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ISSUERS, ISSUER_COLORS } from '../lib/constants';
import type { CardIssuer, CardType } from '../types';
import { cn } from '../lib/utils';
import { RotateCcw } from 'lucide-react';

interface CardTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; issuer: CardIssuer; color: string }) => Promise<void>;
    initialData?: CardType;
    title?: string;
}

export const CardTypeModal: React.FC<CardTypeModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    title = "Card Type"
}) => {
    const [name, setName] = useState('');
    const [issuer, setIssuer] = useState<CardIssuer>('Amex');
    const [color, setColor] = useState(ISSUER_COLORS['Amex']);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setIssuer(initialData.issuer);
                setColor(initialData.color || ISSUER_COLORS[initialData.issuer]);
            } else {
                setName('');
                setIssuer('Amex');
                setColor(ISSUER_COLORS['Amex']);
            }
        }
    }, [isOpen, initialData]);

    const handleIssuerChange = (newIssuer: CardIssuer) => {
        setIssuer(newIssuer);
        // Only auto-update color if it was the default for the previous issuer
        // Or just simplify and always auto-update unless user specifically changed it manually?
        // Let's just auto-update for convenience, user can change back.
        setColor(ISSUER_COLORS[newIssuer] || '#000000');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        await onSave({ name, issuer, color });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Card Type Name</label>
                    <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Sapphire Reserve"
                        className="w-full px-3 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Issuer</label>
                    <div className="grid grid-cols-3 gap-2">
                        {ISSUERS.map((iss) => (
                            <button
                                key={iss}
                                type="button"
                                onClick={() => handleIssuerChange(iss)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-20",
                                    issuer === iss
                                        ? "border-primary ring-1 ring-primary bg-primary/5"
                                        : "hover:bg-secondary/50 border-input bg-background"
                                )}
                            >
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center mb-1.5"
                                    style={{ backgroundColor: ISSUER_COLORS[iss] || '#666' }}
                                >
                                    <span className="text-[10px] font-bold text-white leading-none">
                                        {iss.substring(0, 1)}
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-[10px] text-center font-medium leading-tight",
                                    issuer === iss ? "text-primary font-bold" : "text-muted-foreground"
                                )}>
                                    {iss}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Default Color</label>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="color"
                                className="h-10 w-16 p-0 border-none rounded cursor-pointer overflow-hidden shadow-sm"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-mono text-muted-foreground">{color}</span>
                            <button
                                type="button"
                                onClick={() => setColor(ISSUER_COLORS[issuer] || '#000000')}
                                className="text-[10px] text-primary hover:underline flex items-center mt-0.5"
                            >
                                <RotateCcw className="w-2.5 h-2.5 mr-1" />
                                Reset to Issuer Default
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        {initialData ? 'Update Card Type' : 'Create Card Type'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
