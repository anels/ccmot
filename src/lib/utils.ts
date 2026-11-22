import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Offer, OfferStatus, TrackedOffer, CreditCard, Reward, CardType } from "../types"

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

export function parseOfferDate(dateStr: string): Date {
    if (!dateStr) return new Date(NaN);
    // Parse YYYY-MM-DD manually to avoid UTC conversion
    // Handle ISO strings by taking just the date part
    const cleanDateStr = dateStr.split('T')[0];
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    // Create date at local midnight
    return new Date(year, month - 1, day);
}

export function isOfferExpired(offer: Offer, status?: OfferStatus): boolean {
    if (status === 'Expired') return true;
    // A used offer stays visible while its reward is pending, even past the expiry date.
    if (status === 'Used' || status === 'Awarded') return false;

    // Check date
    const expiryDate = parseOfferDate(offer.expiryDate);
    // Set to start of day for accurate comparison vs "now"
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return expiryDate < now;
}

/**
 * Cards as they are displayed: a card with a card type shows that type's issuer
 * and color, so editing the type restyles every card of it. The values stored
 * on the card apply only when it has no type.
 */
export function resolveCards(cards: CreditCard[], cardTypes: CardType[]): CreditCard[] {
    const typesById = new Map(cardTypes.map(type => [type.id, type]));
    return cards.map(card => {
        const type = card.cardTypeId ? typesById.get(card.cardTypeId) : undefined;
        return type ? { ...card, issuer: type.issuer, color: type.color || card.color } : card;
    });
}

export type EnrichedTrackedOffer = TrackedOffer & { offer?: Offer; card?: CreditCard };

type SaveFilePickerOptions = {
    suggestedName?: string;
    types?: {
        description: string;
        accept: Record<string, string[]>;
    }[];
};

type WritableFileHandle = {
    write: (data: string) => Promise<void> | void;
    close: () => Promise<void> | void;
};

type FilePickerHandle = {
    createWritable: () => Promise<WritableFileHandle>;
};

type WindowWithFilePicker = Window & {
    showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<FilePickerHandle>;
};

export async function generateOffersExport(
    trackedOffers: EnrichedTrackedOffer[],
    rewards: Reward[] = [],
    cardTypes: CardType[] = []
) {
    const validOffers = trackedOffers.filter(item => {
        // Only export offers with 'Added' status
        if (item.status !== 'Added') return false;

        // Exclude expired offers even if they are marked as 'Added'
        if (item.offer && isOfferExpired(item.offer)) return false;

        return !!item.offer;
    });

    const active_offers = validOffers.map(item => ({
        merchant: item.offer?.merchantName,
        category: item.offer?.category,
        offer: item.offer?.description,
        terms: item.offer?.terms,
        card: `${item.card?.name} (${item.card?.issuer} ...${item.card?.last4})`,
        expires: item.offer?.expiryDate,
    }));

    // Process Rewards (Best Cards)
    const best_cards = rewards.map(r => {
        const cType = cardTypes.find(ct => ct.id === r.cardTypeId);
        return {
            category: r.category,
            reward: `${r.rewardValue}${r.rewardUnit}`,
            description: r.description,
            card_product: cType ? `${cType.name} (${cType.issuer})` : 'Unknown Card'
        };
    }).sort((a, b) => a.category.localeCompare(b.category));

    const exportData = {
        active_offers,
        best_cards
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    // Try File System Access API first
    try {
        const saveFilePicker = (window as WindowWithFilePicker).showSaveFilePicker;
        if (saveFilePicker) {
            const handle = await saveFilePicker({
                suggestedName: 'my_wallet_data.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            return;
        }
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return; // User cancelled
        console.warn('File System Access API failed, falling back to download', err);
    }

    // Fallback
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_wallet_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
