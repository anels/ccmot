import { useMemo } from 'react';
import { useStore } from '../lib/store';
import { resolveCards } from '../lib/utils';

/** The store's cards as they should be displayed. Use this instead of `useStore().cards` for rendering. */
export function useCards() {
    const cards = useStore((state) => state.cards);
    const cardTypes = useStore((state) => state.cardTypes);
    return useMemo(() => resolveCards(cards, cardTypes), [cards, cardTypes]);
}
