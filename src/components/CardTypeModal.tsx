import React, { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { ISSUERS, ISSUER_COLORS } from '../lib/constants';
import type { CardIssuer, CardType } from '../types';
import { cn } from '../lib/utils';
import { RotateCcw } from 'lucide-react';
import { useSubmit } from '../hooks/useSubmit';
import type { WriteResult } from '../lib/store';

interface CardTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    // The dialog closes only when the save succeeds.
    onSave: (data: { name: string; issuer: CardIssuer; color: string }) => Promise<WriteResult>;
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
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-w-xl"
        >
            <CardTypeForm
                key={initialData?.id ?? 'new'}
                initialData={initialData}
                onClose={onClose}
                onSave={onSave}
            />
        </Modal>
    );
};

const CardTypeForm: React.FC<{
    initialData?: CardType;
    onClose: () => void;
    onSave: (data: { name: string; issuer: CardIssuer; color: string }) => Promise<WriteResult>;
}> = ({ initialData, onClose, onSave }) => {
    const [isSaving, submit] = useSubmit();
    // A save that finishes after this form was closed must not close one opened since
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);
    const [name, setName] = useState(initialData?.name ?? '');
    const [issuer, setIssuer] = useState<CardIssuer>(initialData?.issuer ?? 'Amex');
    const [color, setColor] = useState(initialData?.color || ISSUER_COLORS[initialData?.issuer ?? 'Amex']);

    const handleIssuerChange = (newIssuer: CardIssuer) => {
        setIssuer(newIssuer);
        setColor(ISSUER_COLORS[newIssuer] || '#000000');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        submit(async () => {
            const result = await onSave({ name, issuer, color });
            if (result.ok && isMounted.current) onClose();
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Card Type Name</label>
                    <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Sapphire Reserve"
                        className="w-full h-9 px-3 border border-border rounded-md bg-card text-sm focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Issuer</label>
                    <div className="grid grid-cols-3 gap-1.5">
                        {ISSUERS.map((iss) => (
                            <button
                                key={iss}
                                type="button"
                                onClick={() => handleIssuerChange(iss)}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-md border transition-colors text-left",
                                    issuer === iss
                                        ? "border-foreground bg-foreground/5"
                                        : "border-border bg-card hover:bg-accent"
                                )}
                            >
                                <div
                                    className="w-5 h-5 rounded-sm shrink-0"
                                    style={{ backgroundColor: ISSUER_COLORS[iss] || '#666' }}
                                />
                                <span className="text-xs font-medium truncate">
                                    {iss}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Color</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            className="h-9 w-12 p-0 border border-border rounded-md cursor-pointer overflow-hidden"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                        <span className="font-mono text-xs uppercase text-foreground">{color}</span>
                        <button
                            type="button"
                            onClick={() => setColor(ISSUER_COLORS[issuer] || '#000000')}
                            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 ml-auto"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-3 border border-border bg-card rounded-md hover:bg-accent transition-colors text-xs font-medium uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="h-9 px-3 bg-foreground text-background rounded-md hover:bg-foreground/85 transition-colors text-xs font-medium uppercase tracking-wider disabled:opacity-30"
                    >
                        {initialData ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
    );
};
