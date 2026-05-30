import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { ConfirmDialog } from './ConfirmDialog';
import type { OfferCategory } from '../types';
import { Search, Gift, Download, Sparkles, ChevronDown, Check, Filter, ArrowUpRight, Clock, Trophy } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { TrackedOfferCard } from './TrackedOfferCard';
import { CatalogOfferCard } from './CatalogOfferCard';
import { CATEGORIES, DASHBOARD_CATEGORY_ICONS, getCategoryColor } from '../lib/constants';
import { cn, isOfferExpired, generateOffersExport, type EnrichedTrackedOffer } from '../lib/utils';

const DASHBOARD_SEARCH_FIELDS = [
    (item: EnrichedTrackedOffer) => item.offer?.merchantName || '',
    (item: EnrichedTrackedOffer) => item.offer?.description || '',
    (item: EnrichedTrackedOffer) => item.card?.name || '',
    (item: EnrichedTrackedOffer) => item.card?.issuer || ''
];

const Dashboard: React.FC = () => {
    const { offers, cards, trackedOffers, trackOffer, updateOfferStatus, deleteTrackedOffer: untrackOffer, rewards, cardTypes } = useStore();
    const [selectedCategory, setSelectedCategory] = useState<OfferCategory | 'All' | string>('All');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dashedCategoryIcons = DASHBOARD_CATEGORY_ICONS;

    const allCategories = useMemo(() => {
        const customCategories = new Set<string>();
        const knownCategories = new Set<string>(CATEGORIES);
        rewards.forEach(r => {
            if (!knownCategories.has(r.category)) customCategories.add(r.category);
        });
        trackedOffers.forEach(t => {
            const offer = offers.find(o => o.id === t.offerId);
            const cat = offer?.category;
            if (cat && !knownCategories.has(cat)) customCategories.add(cat);
        });
        return [...CATEGORIES, ...Array.from(customCategories).sort()];
    }, [rewards, trackedOffers, offers]);

    const getCategoryIcon = (category: string) => dashedCategoryIcons[category as OfferCategory] || Sparkles;

    const enrichedTrackedOffers = useMemo(() => {
        return trackedOffers.map((tracked) => {
            const offer = offers.find((o) => o.id === tracked.offerId);
            const card = cards.find((c) => c.id === tracked.cardId);
            return { ...tracked, offer, card };
        }).filter((item) => item.offer && item.card);
    }, [trackedOffers, offers, cards]);

    // KPI counts
    const activeCount = useMemo(
        () => enrichedTrackedOffers.filter(t => t.status === 'Added' && t.offer && !isOfferExpired(t.offer, t.status)).length,
        [enrichedTrackedOffers]
    );
    const usedCount = useMemo(
        () => enrichedTrackedOffers.filter(t => t.status === 'Used').length,
        [enrichedTrackedOffers]
    );
    const awardedCount = useMemo(
        () => enrichedTrackedOffers.filter(t => t.status === 'Awarded').length,
        [enrichedTrackedOffers]
    );
    const cardsCount = cards.length;

    const categoryFilteredTrackedOffers = useMemo(() => {
        return enrichedTrackedOffers.filter(item => {
            if (selectedCategory !== 'All' && item.offer?.category !== selectedCategory) return false;
            if (item.offer && isOfferExpired(item.offer, item.status)) return false;
            return true;
        });
    }, [selectedCategory, enrichedTrackedOffers]);

    const { searchTerm, setSearchTerm, filteredItems: filteredTrackedOffers } = useSearch(categoryFilteredTrackedOffers, DASHBOARD_SEARCH_FIELDS);

    const filteredCatalogOffers = useMemo(() => {
        if (!searchTerm && selectedCategory === 'All') return [];
        let res = offers;
        if (selectedCategory !== 'All') res = res.filter(offer => offer.category === selectedCategory);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter((offer) =>
                offer.merchantName.toLowerCase().includes(term) ||
                offer.description.toLowerCase().includes(term)
            );
        }
        return res;
    }, [searchTerm, offers, selectedCategory]);

    const confirmDelete = async () => {
        if (deleteId) {
            await untrackOffer(deleteId);
            setDeleteId(null);
        }
    };

    const handleExport = async () => {
        await generateOffersExport(enrichedTrackedOffers, rewards, cardTypes);
    };

    const hasAddedOffers = trackedOffers.some(o => o.status === 'Added');

    return (
        <div className="pb-32 space-y-8">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Stop Tracking Offer"
                message="Stop tracking this offer? It will be removed from your dashboard."
            />

            {/* Page header */}
            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Overview</p>
                    <h1 className="text-3xl font-semibold tracking-tight mt-1">Dashboard</h1>
                </div>
                <button
                    onClick={handleExport}
                    disabled={!hasAddedOffers}
                    title={hasAddedOffers ? 'Export active offers as JSON' : 'No active offers to export — add one first'}
                    className={cn(
                        "h-9 px-3 inline-flex items-center gap-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors border",
                        hasAddedOffers
                            ? "bg-card border-border text-foreground hover:bg-accent"
                            : "bg-muted border-border text-muted-foreground/60 cursor-not-allowed"
                    )}
                >
                    <Download className="w-3.5 h-3.5" />
                    Export
                </button>
            </header>

            {/* KPI tiles - each with distinct accent */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-tile relative overflow-hidden">
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500" aria-hidden />
                    <span className="stat-label text-sky-700 dark:text-sky-300">Active</span>
                    <span className="stat-value">{activeCount}</span>
                    <span className="stat-delta text-muted-foreground">offers tracked</span>
                </div>
                <div className="stat-tile relative overflow-hidden">
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" aria-hidden />
                    <span className="stat-label text-amber-700 dark:text-amber-300">Used</span>
                    <span className="stat-value">{usedCount}</span>
                    <span className="stat-delta text-muted-foreground">awaiting reward</span>
                </div>
                <div className="stat-tile relative overflow-hidden">
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" aria-hidden />
                    <span className="stat-label text-emerald-700 dark:text-emerald-300">Awarded</span>
                    <span className="stat-value text-gain">{awardedCount}</span>
                    <span className="stat-delta text-gain inline-flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} /> earned
                    </span>
                </div>
                <div className="stat-tile relative overflow-hidden">
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-violet-500" aria-hidden />
                    <span className="stat-label text-violet-700 dark:text-violet-300">Wallet</span>
                    <span className="stat-value">{cardsCount}</span>
                    <span className="stat-delta text-muted-foreground">{cardsCount === 1 ? 'card' : 'cards'}</span>
                </div>
            </section>

            {/* Filter bar - top offset accounts for mobile Layout header (56px) */}
            <section className="sticky top-14 lg:top-0 z-30 -mx-4 px-4 md:-mx-8 md:px-8 py-3 bg-background border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search offers, merchants, cards…"
                            className="block w-full pl-8 pr-3 py-2 bg-card border border-border rounded-md text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40 focus:border-foreground/40 outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={cn(
                            "h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium uppercase tracking-wider border transition-colors",
                            selectedCategory === 'All'
                                ? "bg-foreground text-background border-foreground"
                                : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        {React.createElement(DASHBOARD_CATEGORY_ICONS['All'], { className: "w-3 h-3" })}
                        All
                    </button>

                    <div className="relative">
                        <button
                            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium uppercase tracking-wider bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors outline-none"
                            onClick={() => setDropdownOpen(o => !o)}
                            onBlur={() => setTimeout(() => setDropdownOpen(false), 180)}
                        >
                            {selectedCategory !== 'All'
                                ? React.createElement(getCategoryIcon(selectedCategory), { className: "w-3 h-3 text-foreground" })
                                : <Filter className="w-3 h-3" />
                            }
                            <span className="truncate max-w-[120px]">
                                {selectedCategory === 'All' ? 'Category' : selectedCategory}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 min-w-[220px] p-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                            <button
                                onClick={() => { setSelectedCategory('All'); setDropdownOpen(false); }}
                                className={cn(
                                    "px-2 py-1.5 rounded-sm text-xs font-medium flex items-center gap-2 w-full text-left transition-colors",
                                    selectedCategory === 'All' ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <Filter className="w-3 h-3" />
                                <span className="flex-1">All Categories</span>
                                {selectedCategory === 'All' && <Check className="w-3 h-3" />}
                            </button>
                            <div className="h-px bg-border my-1" />
                            {allCategories.map((category) => {
                                const cc = getCategoryColor(category);
                                return (
                                    <button
                                        key={category}
                                        onClick={() => { setSelectedCategory(category); setDropdownOpen(false); }}
                                        className={cn(
                                            "px-2 py-1.5 rounded-sm text-xs font-medium flex items-center gap-2 w-full text-left transition-colors",
                                            selectedCategory === category ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <span className={cn("dot", cc.bar)} aria-hidden />
                                        {React.createElement(getCategoryIcon(category), { className: cn("w-3 h-3", cc.text) })}
                                        <span className="flex-1 truncate">{category}</span>
                                        {selectedCategory === category && <Check className="w-3 h-3" />}
                                    </button>
                                );
                            })}
                        </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Category sections */}
            <div className="space-y-10">
                {allCategories.filter(cat => selectedCategory === 'All' || selectedCategory === cat).map(category => {
                    const Icon = getCategoryIcon(category);

                    const relevantRewards = rewards
                        .filter(r => r.category === category)
                        .map(r => {
                            const cardType = cardTypes.find(ct => ct.id === r.cardTypeId);
                            return { ...r, cardType };
                        })
                        .filter(r => r.cardType)
                        .sort((a, b) => b.rewardValue - a.rewardValue);

                    const activeOffers = categoryFilteredTrackedOffers.filter(
                        o => o.status === 'Added' && o.offer?.category === category
                    );

                    const hasMatchingContent = !searchTerm || (
                        relevantRewards.some(r =>
                            r.cardType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        ) ||
                        activeOffers.length > 0
                    );

                    if (!hasMatchingContent && searchTerm) return null;
                    if (relevantRewards.length === 0 && activeOffers.length === 0 && selectedCategory === 'All') return null;

                    const catColor = getCategoryColor(category);
                    return (
                        <section key={category} className="animate-slide-up scroll-mt-32" id={category}>
                            {/* Category header */}
                            <div className="mb-4 pb-3 border-b border-border relative">
                                <div className={cn("absolute -bottom-px left-0 h-0.5 w-12 rounded-full", catColor.bar)} aria-hidden />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", catColor.tile)}>
                                            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                                        </div>
                                        <h2 className={cn("text-base font-semibold tracking-tight", catColor.text)}>{category}</h2>
                                        <span className={cn("text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ring-1 ring-inset", catColor.tile, catColor.ring)}>
                                            {activeOffers.length}
                                        </span>
                                    </div>
                                    {relevantRewards.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                            <Trophy className="w-3 h-3" />
                                            <span>{relevantRewards.length} {relevantRewards.length === 1 ? 'card' : 'cards'} earn here</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                                {/* Best cards column */}
                                <div className="xl:col-span-1 space-y-2">
                                    <h3 className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-1.5">Best Cards</h3>
                                    {relevantRewards.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {relevantRewards.map((reward, idx) => (
                                                <div key={reward.id} className="bg-card border border-border px-3 py-2 rounded-md flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "min-w-[44px] h-9 px-1.5 rounded-sm flex items-center justify-center font-mono text-sm font-semibold tabular-nums shrink-0",
                                                        idx === 0
                                                            ? "bg-gain text-gain-foreground"
                                                            : "bg-muted text-foreground"
                                                    )}>
                                                        {reward.rewardValue}{reward.rewardUnit === '%' ? '%' : 'x'}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-medium truncate" title={reward.cardType?.name}>
                                                            {reward.cardType?.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground truncate" title={reward.description}>
                                                            {reward.description || 'Base earn rate'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-3 py-4 rounded-md border border-dashed border-border text-center text-xs text-muted-foreground bg-muted/30">
                                            No reward rules configured
                                        </div>
                                    )}
                                </div>

                                {/* Active offers column */}
                                <div className="xl:col-span-3">
                                    {activeOffers.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {activeOffers.map(item => (
                                                <TrackedOfferCard
                                                    key={item.id}
                                                    item={item}
                                                    onUpdateStatus={updateOfferStatus}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-6 py-10 rounded-md border border-dashed border-border text-center text-muted-foreground bg-muted/20 flex flex-col items-center justify-center gap-2">
                                            <Gift className="w-5 h-5 opacity-40" />
                                            <span className="text-xs">No active offers in {category}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    );
                })}

                {searchTerm && filteredTrackedOffers.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-border rounded-md">
                        <p className="text-sm text-muted-foreground">No matches for "{searchTerm}"</p>
                    </div>
                )}
            </div>

            {/* History */}
            <div className="space-y-8 border-t border-border pt-8">
                {filteredTrackedOffers.some(o => o.status === 'Used') && (
                    <section className="animate-slide-up">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <h2 className="text-base font-semibold tracking-tight">Awaiting Reward</h2>
                            <span className="text-[11px] font-mono tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {filteredTrackedOffers.filter(o => o.status === 'Used').length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredTrackedOffers.filter(o => o.status === 'Used').map((item) => (
                                <TrackedOfferCard key={item.id} item={item} onUpdateStatus={updateOfferStatus} />
                            ))}
                        </div>
                    </section>
                )}

                {filteredTrackedOffers.some(o => o.status === 'Awarded') && (
                    <section className="animate-slide-up">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-4 h-4 text-gain" />
                            <h2 className="text-base font-semibold tracking-tight">Earned</h2>
                            <span className="text-[11px] font-mono tabular-nums text-gain bg-gain-soft px-1.5 py-0.5 rounded">
                                {filteredTrackedOffers.filter(o => o.status === 'Awarded').length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredTrackedOffers.filter(o => o.status === 'Awarded').map((item) => (
                                <TrackedOfferCard key={item.id} item={item} onUpdateStatus={updateOfferStatus} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Catalog */}
            {(searchTerm || selectedCategory !== 'All') && filteredCatalogOffers.length > 0 && (
                <section className="animate-slide-up pt-8 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <Gift className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-base font-semibold tracking-tight">From Catalog</h2>
                        <span className="text-[11px] font-mono tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {filteredCatalogOffers.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredCatalogOffers.map((offer) => (
                            <CatalogOfferCard
                                key={offer.id}
                                offer={offer}
                                cards={cards}
                                trackedOffers={trackedOffers}
                                onTrackOffer={trackOffer}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Dashboard;
