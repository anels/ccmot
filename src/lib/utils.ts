import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CreditCard, CardType, Reward } from "../types"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Pick readable text color for an arbitrary hex background.
 * Uses YIQ luminance — threshold tuned so e.g. yellow (#FFEB3B) returns black.
 */
export function getReadableTextColor(hexColor: string | undefined): '#FFFFFF' | '#0A0A0A' {
    if (!hexColor) return '#FFFFFF';
    const hex = hexColor.replace('#', '').trim();
    if (hex.length !== 6) return '#FFFFFF';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(n => Number.isNaN(n))) return '#FFFFFF';
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? '#0A0A0A' : '#FFFFFF';
}

/** A reward's rate as shown everywhere: 5%, 4x, 3 pts. */
export function formatReward(value: number, unit: Reward['rewardUnit']): string {
    if (unit === '%' || unit === 'x') return `${value}${unit}`;
    return `${value} ${unit === 'points' ? 'pts' : unit}`;
}

export function parseOfferDate(dateStr: string): Date {
    if (!dateStr) return new Date(NaN);
    // Parse YYYY-MM-DD manually to avoid UTC conversion
    // Handle ISO strings by taking just the date part
    const cleanDateStr = dateStr.split('T')[0];
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    // Create date at local midnight
    return new Date(year, month - 1, day);
}

/**
 * Cards as they are displayed: a card with a card type shows that type's issuer
 * and color, so editing the type restyles every card of it. The values stored
 * on the card apply only when it has no type, or its type leaves one empty.
 */
export function resolveCards(cards: CreditCard[], cardTypes: CardType[]): CreditCard[] {
    const typesById = new Map(cardTypes.map(type => [type.id, type]));
    return cards.map(card => {
        const type = card.cardTypeId ? typesById.get(card.cardTypeId) : undefined;
        return type ? { ...card, issuer: type.issuer || card.issuer, color: type.color || card.color } : card;
    });
}
