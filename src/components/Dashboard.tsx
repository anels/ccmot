import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { ConfirmDialog } from './ConfirmDialog';
import type { OfferCategory } from '../types';
import { Search, Gift, Download, Sparkles, ChevronDown, Check, Filter } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { TrackedOfferCard } from './TrackedOfferCard';
import { CatalogOfferCard } from './CatalogOfferCard';
import { CATEGORIES, DASHBOARD_CATEGORY_ICONS } from '../lib/constants';
import { cn, isOfferExpired, generateOffersExport } from '../lib/utils';




const Dashboard: React.FC = () => {
    const { offers, cards, trackedOffers, trackOffer, updateOfferStatus, deleteTrackedOffer: untrackOffer, rewards, cardTypes } = useStore();
    const [selectedCategory, setSelectedCategory] = useState<OfferCategory | 'All' | string>('All');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Categories with icons map just for dashboard usage to avoid import cycles if any (though currently ok)
    const dashedCategoryIcons = DASHBOARD_CATEGORY_ICONS;

    // Dynamically aggregate all unique categories from default list + rewards + tracked offers
    const allCategories = useMemo(() => {
        const customCategories = new Set<string>();

        rewards.forEach(r => {
            if (!CATEGORIES.includes(r.category as any)) {
                customCategories.add(r.category);
            }
        });

        // Check offers for custom categories
        trackedOffers.forEach(t => {
            const offer = offers.find(o => o.id === t.offerId);
            const cat = offer?.category;
            if (cat && !CATEGORIES.includes(cat as any)) {
                customCategories.add(cat);
            }
        });

        return [...CATEGORIES, ...Array.from(customCategories).sort()];
    }, [rewards, trackedOffers, offers]);

    // Helper to get icon with fallback
    const getCategoryIcon = (category: string) => {
        return dashedCategoryIcons[category as OfferCategory] || Sparkles;
    };

    // Derived state: enriching tracked offers with offer and card details
    const enrichedTrackedOffers = useMemo(() => {
        return trackedOffers.map((tracked) => {
            const offer = offers.find((o) => o.id === tracked.offerId);
            const card = cards.find((c) => c.id === tracked.cardId);
            return { ...tracked, offer, card };
        }).filter((item) => item.offer && item.card); // filter out broken links
    }, [trackedOffers, offers, cards]);

    // Filter enriched tracked offers by category first AND exclude expired active offers
    const categoryFilteredTrackedOffers = useMemo(() => {
        return enrichedTrackedOffers.filter(item => {
            // Category filter
            if (selectedCategory !== 'All' && item.offer?.category !== selectedCategory) return false;

            // Exclude expired active offers
            if (item.offer && isOfferExpired(item.offer, item.status)) return false;

            return true;
        });
    }, [selectedCategory, enrichedTrackedOffers]);

    // Use unified search hook
    const { searchTerm, setSearchTerm, filteredItems: filteredTrackedOffers } = useSearch(categoryFilteredTrackedOffers, [
        (item) => item.offer?.merchantName || '',
        (item) => item.offer?.description || '',
        (item) => item.card?.name || '',
        (item) => item.card?.issuer || ''
    ]);

    const filteredCatalogOffers = useMemo(() => {
        if (!searchTerm && selectedCategory === 'All') return [];

        let res = offers;

        if (selectedCategory !== 'All') {
            res = res.filter(offer => offer.category === selectedCategory);
        }

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

    return (
        <div className="pb-32 space-y-8">
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Stop Tracking Offer"
                message="Are you sure you want to stop tracking this offer? It will be removed from your dashboard."
            />

            {/* Search Bar - Floating Glass Effect */}
            <div className="sticky top-0 z-40 pt-6 pb-4 -mx-4 px-4 md:-mx-8 md:px-8 glass bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 ease-in-out">
                <div className="relative max-w-2xl mx-auto md:mx-0 group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search offers, merchants, or cards..."
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-2xl text-lg shadow-sm hover:shadow-md focus:shadow-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/60 backdrop-blur-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Filters: View All + Dropdown */}
                <div className="flex items-center gap-3 pt-4 pb-2">
                    {/* 'View All' Quick Action */}
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={cn(
                            "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 border",
                            selectedCategory === 'All'
                                ? "bg-primary text-primary-foreground border-primary/50 shadow-lg shadow-primary/25"
                                : "bg-white/40 dark:bg-gray-800/40 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-muted-foreground hover:bg-white dark:hover:bg-gray-800 hover:text-foreground hover:shadow-md glass-interactive backdrop-blur-md"
                        )}
                    >
                        {React.createElement(DASHBOARD_CATEGORY_ICONS['All'], {
                            className: cn("w-4 h-4", selectedCategory === 'All' ? "text-primary-foreground" : "text-muted-foreground")
                        })}
                        View All
                    </button>

                    {/* Category Dropdown - Custom UI */}
                    <div className="relative flex-1 max-w-xs group/dropdown">
                        <button
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 outline-none",
                                "bg-white/40 dark:bg-gray-800/40 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-muted-foreground hover:bg-white dark:hover:bg-gray-800 hover:text-foreground hover:shadow-md glass-interactive backdrop-blur-md group-focus-within/dropdown:ring-2 group-focus-within/dropdown:ring-primary/20"
                            )}
                            onClick={(e) => {
                                const dropdown = e.currentTarget.nextElementSibling;
                                dropdown?.classList.toggle('hidden');
                                dropdown?.classList.toggle('opacity-0');
                                dropdown?.classList.toggle('scale-95');
                            }}
                            onBlur={(e) => {
                                // Delay hiding to allow click event on items to fire
                                setTimeout(() => {
                                    const dropdown = e.target.nextElementSibling;
                                    dropdown?.classList.add('hidden', 'opacity-0', 'scale-95');
                                }, 200);
                            }}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {selectedCategory !== 'All'
                                    ? React.createElement(getCategoryIcon(selectedCategory), { className: "w-4 h-4 text-primary shrink-0" })
                                    : <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                                }
                                <span className={cn("truncate", selectedCategory === 'All' && "text-muted-foreground")}>
                                    {selectedCategory === 'All' ? 'Select a category...' : selectedCategory}
                                </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50 shrink-0 ml-2" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="hidden absolute top-full left-0 right-0 mt-2 p-1.5 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl z-50 flex-col gap-0.5 max-h-80 overflow-y-auto opacity-0 scale-95 transition-all duration-200 origin-top">
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 w-full text-left transition-colors",
                                    selectedCategory === 'All'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
                                )}
                            >
                                <div className="w-6 h-6 flex items-center justify-center rounded-md bg-background/50 border border-gray-200 dark:border-gray-700">
                                    <Filter className="w-3.5 h-3.5" />
                                </div>
                                <span className="flex-1">All Categories</span>
                                {selectedCategory === 'All' && <Check className="w-4 h-4 text-primary" />}
                            </button>

                            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-2" />

                            {allCategories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 w-full text-left transition-colors",
                                        selectedCategory === category
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
                                    )}
                                >
                                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-background/50 border border-gray-200 dark:border-gray-700">
                                        {React.createElement(getCategoryIcon(category), { className: "w-3.5 h-3.5" })}
                                    </div>
                                    <span className="flex-1 truncate">{category}</span>
                                    {selectedCategory === category && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export Button - Always Visible, Disabled if no added offers */}
                    <button
                        onClick={handleExport}
                        disabled={!trackedOffers.some(o => o.status === 'Added')}
                        className={cn(
                            "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 flex items-center gap-2 ml-auto",
                            trackedOffers.some(o => o.status === 'Added')
                                ? "bg-white/40 dark:bg-gray-800/40 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-muted-foreground hover:bg-white dark:hover:bg-gray-800 hover:text-foreground hover:shadow-md glass-interactive backdrop-blur-md cursor-pointer"
                                : "bg-gray-100 dark:bg-gray-800/20 border-transparent text-muted-foreground/50 cursor-not-allowed opacity-50"
                        )}
                        title={trackedOffers.some(o => o.status === 'Added') ? "Export valid offers" : "No active offers to export"}
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Main Content: Categories */}
            <div className="space-y-12">
                {allCategories.filter(cat => selectedCategory === 'All' || selectedCategory === cat).map(category => {
                    const Icon = getCategoryIcon(category);

                    // 1. Get Rewards for this Category (Best Cards)
                    // Note: In a real app we might want to consolidate this logic in a hook or helper
                    // Here we find all rewards for this category, join with cardTypes, and sort by value.
                    // We also filter by SEARCH TERM if it exists.
                    const relevantRewards = rewards
                        .filter(r => r.category === category)
                        .map(r => {
                            const cardType = cardTypes.find(ct => ct.id === r.cardTypeId);
                            // Find if user actually owns this card to show that specifically? 
                            // The prompt implies "Credit Card Rewards" which usually means general knowledge, 
                            // but context says "Best Cards for Category". 
                            // Let's match the RewardBrowser logic: show the card type info.
                            return { ...r, cardType };
                        })
                        .filter(r => r.cardType) // Safety check
                        .sort((a, b) => b.rewardValue - a.rewardValue);

                    // 2. Get Active Offers for this Category
                    const activeOffers = categoryFilteredTrackedOffers.filter(
                        o => o.status === 'Added' && o.offer?.category === category
                    );

                    // Search Filter Logic for this specific section
                    // If search term exists, we only show this category if it has matching rewards OR offers
                    const hasMatchingContent = !searchTerm || (
                        relevantRewards.some(r =>
                            r.cardType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        ) ||
                        activeOffers.length > 0 // usage of useSearch hook handled filtering of activeOffers already
                    );

                    if (!hasMatchingContent && searchTerm) return null;

                    // If no content effectively, maybe skip unless 'All' isn't selected (user specifically asked for this cat)
                    if (relevantRewards.length === 0 && activeOffers.length === 0 && selectedCategory === 'All') return null;

                    return (
                        <section key={category} className="animate-slide-up scroll-mt-32" id={category}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-primary">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                    {category}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                {/* Best Cards Column (Takes 1 col on large screens) */}
                                <div className="xl:col-span-1 space-y-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">Best Cards</h3>
                                    {relevantRewards.length > 0 ? (
                                        <div className="space-y-3">
                                            {relevantRewards.map((reward, idx) => (
                                                <div key={reward.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                                                            idx === 0
                                                                ? "bg-primary/10 text-primary"
                                                                : "bg-secondary text-muted-foreground"
                                                        )}>
                                                            {reward.rewardValue}{reward.rewardUnit === '%' ? '%' : 'x'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate text-sm" title={reward.cardType?.name}>
                                                                {reward.cardType?.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate" title={reward.description}>
                                                                {reward.description || 'Base earn rate'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-sm text-muted-foreground bg-secondary/20">
                                            No cards configured
                                        </div>
                                    )}
                                </div>

                                {/* Active Offers Column (Takes 3 cols on large screens) */}
                                <div className="xl:col-span-3 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                                            Active Offers ({activeOffers.length})
                                        </h3>
                                        {category === selectedCategory && activeOffers.length > 0 && (
                                            <button onClick={handleExport} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                <Download size={12} /> Export
                                            </button>
                                        )}
                                    </div>

                                    {activeOffers.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {activeOffers.map(item => (
                                                <TrackedOfferCard
                                                    key={item.id}
                                                    item={item}
                                                    onUpdateStatus={updateOfferStatus}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-muted-foreground bg-secondary/5 flex flex-col items-center justify-center gap-2">
                                            <Gift className="w-8 h-8 opacity-20" />
                                            <span className="text-sm">No active offers for {category}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    );
                })}

                {/* Categories Empty State (Search result empty) */}
                {searchTerm && filteredTrackedOffers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No matching categories, cards, or offers found.</p>
                    </div>
                )}
            </div>

            {/* Global History Sections (Used/Awarded) - kept at bottom */}
            <div className="space-y-12 border-t pt-12 dark:border-gray-800">
                {/* Used Offers */}
                {filteredTrackedOffers.some(o => o.status === 'Used') && (
                    <section className="animate-slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                <Search className="w-6 h-6 rotate-180" />
                            </div>
                            <h2 className="text-xl font-bold">Recently Used</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTrackedOffers.filter(o => o.status === 'Used').map((item) => (
                                <TrackedOfferCard
                                    key={item.id}
                                    item={item}
                                    onUpdateStatus={updateOfferStatus}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Awarded Offers */}
                {filteredTrackedOffers.some(o => o.status === 'Awarded') && (
                    <section className="animate-slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">Earned Rewards</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTrackedOffers.filter(o => o.status === 'Awarded').map((item) => (
                                <TrackedOfferCard
                                    key={item.id}
                                    item={item}
                                    onUpdateStatus={updateOfferStatus}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Catalog Listing - Only show if specifically searching or filtering, to avoid clutter */}
            {(searchTerm || selectedCategory !== 'All') && filteredCatalogOffers.length > 0 && (
                <section className="animate-slide-up pt-8 border-t dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                        <Gift className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Available from Catalog</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
