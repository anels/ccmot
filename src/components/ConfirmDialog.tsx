import React from 'react';
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl shadow-xl border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-3 rounded-full shrink-0",
                            variant === 'danger' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                variant === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 bg-secondary/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border bg-background hover:bg-secondary transition-colors font-medium text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-colors",
                            variant === 'danger' ? "bg-red-600 hover:bg-red-700" :
                                variant === 'warning' ? "bg-amber-600 hover:bg-amber-700" :
                                    "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
