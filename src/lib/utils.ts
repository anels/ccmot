import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Offer, OfferStatus, TrackedOffer, CreditCard, Reward, CardType } from "../types"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
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
    // If explicit status is expired, it's expired
    if (status === 'Expired') return true;

    // Check date
    const expiryDate = parseOfferDate(offer.expiryDate);
    // Set to start of day for accurate comparison vs "now"
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return expiryDate < now;
}

export type EnrichedTrackedOffer = TrackedOffer & { offer?: Offer; card?: CreditCard };

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
        if ('showSaveFilePicker' in window) {
            const handle = await (window as any).showSaveFilePicker({
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
    } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
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
