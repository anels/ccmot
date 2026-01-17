export type CardIssuer = 'Amex' | 'Chase' | 'Citi' | 'Capital One' | 'Discover' | 'Bank of America' | 'Wells Fargo' | 'US Bank' | 'Other';

export interface CreditCard {
    id: string;
    name: string;
    issuer: CardIssuer;
    last4: string;
    color: string; // Hex code for card background
    cardHolder?: string;
    notes?: string;
}

export interface Offer {
    id: string;
    merchantName: string;
    description: string; // e.g., "Spend $50, get $10 back"
    terms: string; // Detailed terms
    expiryDate: string; // ISO Date string
    category: OfferCategory;
}

export type OfferCategory = 'Travel' | 'Dining' | 'Shopping' | 'Entertainment' | 'Service' | 'Other';


export type OfferStatus = 'Added' | 'Used' | 'Awarded' | 'Expired';

export interface TrackedOffer {
    id: string;
    offerId: string;
    cardId: string;
    status: OfferStatus;
    dateAdded: string; // ISO Date string
}

export type AppData = {
    cards: CreditCard[];
    offers: Offer[];
    trackedOffers: TrackedOffer[];
};
