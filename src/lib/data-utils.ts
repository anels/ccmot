import type { AppData } from '../types';

/**
 * Normalizes imported data to ensure it matches the application's schema.
 * Handles legacy field names and missing optional fields.
 */
export function normalizeImportData(data: AppData): AppData {
    const authorizedCards = (data.cards || []).map(c => ({
        ...c,
        cardHolder: c.cardHolder || '',
        notes: c.notes || ''
    }));

    const authorizedOffers = (data.offers || []).map(o => {
        // Normalize data to match backend schema AND frontend types
        // Create a safe view of the object for legacy property access
        const unsafeObj = o as unknown as Record<string, unknown>;

        // Handle 'retailer' vs 'merchantName'
        const retailerFromObj = typeof unsafeObj.retailer === 'string' ? unsafeObj.retailer : undefined;
        const merchantNameFromObj = o.merchantName;

        const retailer = retailerFromObj || merchantNameFromObj || 'Unknown Merchant';
        const merchantName = merchantNameFromObj || retailerFromObj || 'Unknown Merchant';

        // Handle date fields
        const expirationDateFromObj = typeof unsafeObj.expirationDate === 'string' ? unsafeObj.expirationDate : undefined;
        const expiryDateFromObj = o.expiryDate;

        const expiryDate = expiryDateFromObj || expirationDateFromObj || '';

        // Handle URL
        const url = typeof unsafeObj.url === 'string' ? unsafeObj.url : '';

        return {
            ...o,
            retailer: retailer, // For backend
            merchantName: merchantName, // For frontend type
            description: o.description || '',
            terms: o.terms || '',
            category: o.category || 'Shopping',
            expiryDate: expiryDate,
            url: url
        };
    });

    const authorizedTrackedOffers = data.trackedOffers || [];
    const authorizedCardTypes = data.cardTypes || [];
    const authorizedRewards = data.rewards || [];

    return {
        cards: authorizedCards,
        offers: authorizedOffers,
        trackedOffers: authorizedTrackedOffers,
        cardTypes: authorizedCardTypes,
        rewards: authorizedRewards
    };
}
