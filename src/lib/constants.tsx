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

/**
 * Per-category color tokens.
 * - `tile`: soft bg + colored text — used for icon chips, badges
 * - `bar`:  saturated bg — used for left accent bar
 * - `ring`: ring tint — for active filter pills
 * - `text`: text/foreground tint for headings
 * - `hex`:  raw hex — for inline styles (e.g. CSS var)
 */
type CategoryColor = { tile: string; bar: string; ring: string; text: string; hex: string };

export const CATEGORY_COLORS: Record<OfferCategory | 'All', CategoryColor> = {
    'All':                                  { tile: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200',           bar: 'bg-zinc-500',    ring: 'ring-zinc-500/30',    text: 'text-zinc-700 dark:text-zinc-200',     hex: '#71717A' },
    'Travel':                               { tile: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',                bar: 'bg-sky-500',     ring: 'ring-sky-500/30',     text: 'text-sky-700 dark:text-sky-300',       hex: '#0EA5E9' },
    'Dining':                               { tile: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',            bar: 'bg-rose-500',    ring: 'ring-rose-500/30',    text: 'text-rose-700 dark:text-rose-300',     hex: '#F43F5E' },
    'Shopping':                             { tile: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',    bar: 'bg-violet-500',  ring: 'ring-violet-500/30',  text: 'text-violet-700 dark:text-violet-300', hex: '#8B5CF6' },
    'Entertainment':                        { tile: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',            bar: 'bg-pink-500',    ring: 'ring-pink-500/30',    text: 'text-pink-700 dark:text-pink-300',     hex: '#EC4899' },
    'Service':                              { tile: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200',        bar: 'bg-slate-500',   ring: 'ring-slate-500/30',   text: 'text-slate-700 dark:text-slate-200',   hex: '#64748B' },
    'Grocery Stores':                       { tile: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300', bar: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', hex: '#10B981' },
    'Gas/EV charging':                      { tile: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',        bar: 'bg-amber-500',   ring: 'ring-amber-500/30',   text: 'text-amber-700 dark:text-amber-300',   hex: '#F59E0B' },
    'TV, Internet & Streaming Services':    { tile: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',    bar: 'bg-indigo-500',  ring: 'ring-indigo-500/30',  text: 'text-indigo-700 dark:text-indigo-300', hex: '#6366F1' },
    'Home Utilities':                       { tile: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',    bar: 'bg-orange-500',  ring: 'ring-orange-500/30',  text: 'text-orange-700 dark:text-orange-300', hex: '#F97316' },
    'Other':                                { tile: 'bg-stone-100 text-stone-700 dark:bg-stone-800/60 dark:text-stone-200',        bar: 'bg-stone-500',   ring: 'ring-stone-500/30',   text: 'text-stone-700 dark:text-stone-200',   hex: '#78716C' },
};

export const getCategoryColor = (category: string): CategoryColor => {
    return CATEGORY_COLORS[category as OfferCategory] || CATEGORY_COLORS['Other'];
};

export const STATUS_COLORS: Record<OfferStatus, string> = {
    'Added': 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/30',
    'Used': 'bg-amber-50 text-amber-700 ring-amber-600/25 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
    'Awarded': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
    'Expired': 'bg-zinc-100 text-zinc-500 ring-zinc-300 dark:bg-zinc-900/40 dark:text-zinc-400 dark:ring-zinc-700',
};

export const STATUS_DOT: Record<OfferStatus, string> = {
    'Added': 'bg-blue-500',
    'Used': 'bg-amber-500',
    'Awarded': 'bg-emerald-500',
    'Expired': 'bg-zinc-400 dark:bg-zinc-600',
};

export const NEXT_STATUS: Record<OfferStatus, OfferStatus> = {
    'Added': 'Used',
    'Used': 'Awarded',
    'Awarded': 'Added',
    'Expired': 'Added'
};
