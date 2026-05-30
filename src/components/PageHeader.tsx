import React from 'react';
import { Search, X, Plus } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAddClick: () => void;
    addButtonLabel: string;
    isFormOpen: boolean;
    searchPlaceholder?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    searchTerm,
    onSearchChange,
    onAddClick,
    addButtonLabel,
    isFormOpen,
    searchPlaceholder = "Search..."
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Manage</p>
                <h2 className="text-3xl font-semibold tracking-tight mt-1">{title}</h2>
            </div>

            <div className="flex items-center gap-2">
                {!isFormOpen && (
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-8 pr-7 h-9 border border-border bg-card rounded-md text-sm w-full md:w-64 placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none transition-colors"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {!isFormOpen && (
                    <button
                        onClick={onAddClick}
                        className="h-9 px-3 inline-flex items-center gap-1.5 bg-foreground text-background rounded-md text-xs font-medium uppercase tracking-wider hover:bg-foreground/85 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                        {addButtonLabel}
                    </button>
                )}
            </div>
        </div>
    );
};
