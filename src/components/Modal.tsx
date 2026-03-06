import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

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
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className={cn(
                "bg-background rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200",
                className
            )}>
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                    <div className="flex items-center gap-2">
                        {headerActions}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {children}
                </div>

                {footer && (
                    <div className="p-4 border-t bg-muted/10 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
