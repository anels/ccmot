import React from 'react';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDialogLayer } from '../hooks/useDialogLayer';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'info' | 'warning';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onClose,
    title,
    message,
    variant = 'info'
}) => {
    useDialogLayer(isOpen, onClose);

    if (!isOpen) return null;

    const Icon =
        variant === 'success' ? CheckCircle2 :
        variant === 'error' ? AlertCircle :
        variant === 'warning' ? AlertTriangle :
        Info;
    const iconTint =
        variant === 'success' ? "bg-gain-soft text-gain" :
        variant === 'error' ? "bg-destructive/10 text-destructive" :
        variant === 'warning' ? "bg-warning-soft text-warning" :
        "bg-info-soft text-info";
    const buttonTone =
        variant === 'success' ? "bg-gain hover:bg-gain/90 text-gain-foreground" :
        variant === 'error' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" :
        variant === 'warning' ? "bg-warning hover:bg-warning/90 text-warning-foreground" :
        "bg-foreground hover:bg-foreground/85 text-background";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 animate-in fade-in duration-100">
            <div className="absolute inset-0" onClick={onClose} aria-hidden />
            <div className="relative bg-card rounded-lg border border-border shadow-2xl shadow-foreground/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-100">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-md shrink-0", iconTint)}>
                            <Icon className="w-4 h-4" strokeWidth={2.25} />
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
                <div className="px-5 py-3 bg-muted/30 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        autoFocus
                        className={cn(
                            "h-8 px-3 rounded-md text-xs font-medium uppercase tracking-wider transition-colors",
                            buttonTone
                        )}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
