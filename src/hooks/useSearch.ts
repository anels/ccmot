import { useState, useMemo, useCallback } from 'react';

export function useSearch<T>(items: T[], searchFields: (keyof T | ((item: T) => string))[]) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Memoize the field accessor function to avoid recreating on every render
    const getFieldValue = useCallback((item: T, field: keyof T | ((item: T) => string)): string | undefined => {
        if (typeof field === 'function') {
            return field(item);
        }
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
            return fieldValue;
        }
        return undefined;
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;

        const lowerTerm = searchTerm.toLowerCase();

        return items.filter(item => {
            return searchFields.some(field => {
                const value = getFieldValue(item, field);
                return value ? value.toLowerCase().includes(lowerTerm) : false;
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, searchTerm, getFieldValue]);
    // Note: searchFields is intentionally excluded from deps to avoid re-computation
    // when the same fields are passed as new array references (common pattern in React)

    return {
        searchTerm,
        setSearchTerm,
        filteredItems
    };
}
