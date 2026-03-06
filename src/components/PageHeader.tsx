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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">{title}</h2>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                    {!isFormOpen && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 pr-8 py-2 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none w-full md:w-64"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => onSearchChange('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    {!isFormOpen && (
                        <button
                            onClick={onAddClick}
                            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {addButtonLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
