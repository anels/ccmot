import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'info';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onClose,
    title,
    message,
    variant = 'info'
}) => {
    if (!isOpen) return null;

    const Icon = variant === 'success' ? CheckCircle : AlertCircle;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl shadow-xl border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-3 rounded-full shrink-0",
                            variant === 'success' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                variant === 'error' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                            <Icon className="w-6 h-6" />
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
                <div className="px-6 py-4 bg-secondary/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className={cn(
                            "px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-colors",
                            variant === 'success' ? "bg-emerald-600 hover:bg-emerald-700" :
                                variant === 'error' ? "bg-red-600 hover:bg-red-700" :
                                    "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
