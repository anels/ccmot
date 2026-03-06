import type { CardIssuer, OfferCategory, OfferStatus } from '../types';
import { Plane, Utensils, ShoppingBag, Clapperboard, Briefcase, HelpCircle, LayoutGrid } from 'lucide-react';

export const ISSUERS: CardIssuer[] = ['Amex', 'Chase', 'Citi', 'Bank of America', 'US Bank', 'Other'];

export const ISSUER_COLORS: Record<CardIssuer, string> = {
    'Amex': '#52525B',        // Zinc/Silver (Platinum look)
    'Chase': '#0A4F89',       // Deep Classic Blue
    'Citi': '#00A3E0',        // Bright Cyan/Light Blue
    'Bank of America': '#E31837',
    'US Bank': '#DA291C',     // Red
    'Other': '#374151',
};

export const CATEGORIES: OfferCategory[] = [
    'Travel',
    'Dining',
    'Shopping',
    'Entertainment',
    'Service',
    'Grocery Stores',
    'Gas/EV charging',
    'TV, Internet & Streaming Services',
    'Home Utilities',
    'Other'
];

import { Car, Tv, Zap } from 'lucide-react';

export const CATEGORY_ICONS: Record<OfferCategory, React.ElementType> = {
    'Travel': Plane,
    'Dining': Utensils,
    'Shopping': ShoppingBag,
    'Entertainment': Clapperboard,
    'Service': Briefcase,
    'Grocery Stores': ShoppingBag,
    'Gas/EV charging': Car,
    'TV, Internet & Streaming Services': Tv,
    'Home Utilities': Zap,
    'Other': HelpCircle,
};

export const DASHBOARD_CATEGORY_ICONS: Record<OfferCategory | 'All', React.ElementType> = {
    'All': LayoutGrid,
    ...CATEGORY_ICONS
};

export const OFFER_STATUSES: OfferStatus[] = ['Added', 'Used', 'Awarded', 'Expired'];

export const STATUS_COLORS: Record<OfferStatus, string> = {
    'Added': 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-500/30',
    'Used': 'bg-orange-50 text-orange-700 ring-orange-500/20 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-500/30',
    'Awarded': 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-500/30',
    'Expired': 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/30',
};

export const NEXT_STATUS: Record<OfferStatus, OfferStatus> = {
    'Added': 'Used',
    'Used': 'Awarded',
    'Awarded': 'Added',
    'Expired': 'Added'
};
