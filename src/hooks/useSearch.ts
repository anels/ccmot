import { useState, useMemo } from 'react';

export function useSearch<T>(items: T[], searchFields: (keyof T | ((item: T) => string))[]) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;

        const lowerTerm = searchTerm.toLowerCase();

        return items.filter(item => {
            return searchFields.some(field => {
                let value: string | undefined;

                if (typeof field === 'function') {
                    value = field(item);
                } else {
                    const fieldValue = item[field];
                    if (typeof fieldValue === 'string') {
                        value = fieldValue;
                    }
                }

                return value ? value.toLowerCase().includes(lowerTerm) : false;
            });
        });
    }, [items, searchTerm, searchFields]);

    return {
        searchTerm,
        setSearchTerm,
        filteredItems
    };
}
