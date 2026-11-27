import { useState, useMemo } from 'react';
import { matchesTerm } from '../lib/search';

export function useSearch<T>(items: T[], searchFields: (keyof T)[]) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => items.filter(item => matchesTerm(
        searchFields.map(field => {
            const value = item[field];
            return typeof value === 'string' ? value : undefined;
        }),
        searchTerm,
    )), [items, searchTerm, searchFields]);

    return {
        searchTerm,
        setSearchTerm,
        filteredItems
    };
}
