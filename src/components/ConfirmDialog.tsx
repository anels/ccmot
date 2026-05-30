import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger'
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const iconTint =
        variant === 'danger' ? "bg-destructive/10 text-destructive" :
        variant === 'warning' ? "bg-warning-soft text-warning" :
        "bg-info-soft text-info";
    const buttonTone =
        variant === 'danger' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" :
        variant === 'warning' ? "bg-warning hover:bg-warning/90 text-warning-foreground" :
        "bg-foreground hover:bg-foreground/85 text-background";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 animate-in fade-in duration-100">
            <div className="absolute inset-0" onClick={onClose} aria-hidden />
            <div className="relative bg-card rounded-lg border border-border shadow-2xl shadow-foreground/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-100">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-md shrink-0", iconTint)}>
                            <AlertTriangle className="w-4 h-4" strokeWidth={2.25} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold mb-1">{title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="px-5 py-3 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-8 px-3 rounded-md border border-border bg-card hover:bg-accent transition-colors text-xs font-medium uppercase tracking-wider"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        autoFocus
                        className={cn("h-8 px-3 rounded-md text-xs font-medium uppercase tracking-wider transition-colors", buttonTone)}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
