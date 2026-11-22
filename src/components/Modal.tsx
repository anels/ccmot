import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDialogLayer } from '../hooks/useDialogLayer';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    headerActions?: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    headerActions,
    footer
}) => {
    useDialogLayer(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 animate-in fade-in duration-100">
            <div className="absolute inset-0" onClick={onClose} />

            <div className={cn(
                "bg-card rounded-lg border border-border shadow-2xl shadow-foreground/10",
                "w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10",
                "animate-in zoom-in-95 duration-100",
                className
            )}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                    <div className="flex items-center gap-1">
                        {headerActions}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto flex-1 min-h-0">
                    {children}
                </div>

                {footer && (
                    <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2 shrink-0 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
