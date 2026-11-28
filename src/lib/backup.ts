import type { AppData, Reward } from '../types';
import { DEFAULT_CARD_TYPE_COLOR } from './constants';

type LooseRecord = Record<string, unknown>;

const readString = (value: unknown) => typeof value === 'string' ? value : undefined;
const readNumber = (value: unknown) => typeof value === 'number' ? value : undefined;
// Leaves anything but a string for the server to reject
const trimmed = <T>(value: T) => (typeof value === 'string' ? value.trim() : value) as T;

/**
 * Brings a backup up to the current format before it is imported: reads legacy
 * field names, fills what older backups left out and trims category names. Only
 * what can be repaired safely; the server rejects the rest.
 */
export function upgradeBackup(data: Partial<AppData>): AppData {
    const normalizedCards = (data.cards || []).map(c => {
        const unsafeObj = c as unknown as LooseRecord;
        const cardTypeId = c.cardTypeId || readString(unsafeObj.card_type_id);

        return {
            ...c,
            cardHolder: c.cardHolder || '',
            notes: c.notes || '',
            cardTypeId,
        };
    });

    const normalizedOffers = (data.offers || []).map(o => {
        const unsafeObj = o as unknown as LooseRecord;
        const retailerFromObj = readString(unsafeObj.retailer);
        const merchantNameFromObj = o.merchantName;

        const merchantName = merchantNameFromObj || retailerFromObj || 'Unknown Merchant';
        const expirationDateFromObj = readString(unsafeObj.expirationDate);
        const expiryDateFromObj = o.expiryDate;
        const expiryDate = expiryDateFromObj || expirationDateFromObj || '';
        const url = readString(unsafeObj.url) || '';

        return {
            ...o,
            merchantName,
            description: o.description || '',
            terms: o.terms || '',
            category: trimmed(o.category) || 'Shopping',
            expiryDate,
            url
        };
    });

    const normalizedTrackedOffers = data.trackedOffers || [];
    const normalizedCardTypes = (data.cardTypes || []).map(type => ({
        ...type,
        color: type.color || DEFAULT_CARD_TYPE_COLOR,
    }));
    const normalizedRewards = (data.rewards || []).map(reward => {
        const unsafeObj = reward as unknown as LooseRecord;
        const rewardUnit = reward.rewardUnit || readString(unsafeObj.reward_unit) || '%';

        return {
            ...reward,
            cardTypeId: reward.cardTypeId || readString(unsafeObj.card_type_id) || '',
            category: trimmed(reward.category),
            rewardValue: reward.rewardValue ?? readNumber(unsafeObj.reward_value) ?? 0,
            rewardUnit: rewardUnit as Reward['rewardUnit'],
            description: reward.description || '',
        };
    });

    return {
        cards: normalizedCards,
        offers: normalizedOffers,
        trackedOffers: normalizedTrackedOffers,
        cardTypes: normalizedCardTypes,
        rewards: normalizedRewards
    };
}
