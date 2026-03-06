export type CardIssuer = 'Amex' | 'Chase' | 'Citi' | 'Bank of America' | 'US Bank' | 'Other';

export interface CreditCard {
    id: string;
    name: string;
    issuer: CardIssuer;
    last4: string;
    color: string; // Hex code for card background
    cardHolder?: string;
    notes?: string;
    cardTypeId?: string;
}

export interface Offer {
    id: string;
    merchantName: string;
    description: string; // e.g., "Spend $50, get $10 back"
    terms: string; // Detailed terms
    expiryDate: string; // ISO Date string
    category: OfferCategory;
}

export type OfferCategory = 'Travel' | 'Dining' | 'Shopping' | 'Entertainment' | 'Service' | 'Grocery Stores' | 'Gas/EV charging' | 'TV, Internet & Streaming Services' | 'Home Utilities' | 'Other';


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
    cardTypes: CardType[];
    rewards: Reward[];
};

export interface CardType {
    id: string;
    name: string;
    issuer: CardIssuer;
    color: string;
}

export interface Reward {
    id: string;
    cardTypeId: string;
    category: OfferCategory | string; // Allow string for custom categories validation
    rewardValue: number;
    rewardUnit: '%' | 'x' | 'points';
    description: string;
}
