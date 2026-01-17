import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import { Search, CheckCircle, Gift } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { TrackedOfferCard } from './TrackedOfferCard';
import { CatalogOfferCard } from './CatalogOfferCard';

const Dashboard: React.FC = () => {
    const { offers, cards, trackedOffers, trackOffer, updateOfferStatus, deleteTrackedOffer } = useStore();

    // Derived state: enriching tracked offers with offer and card details
    const enrichedTrackedOffers = useMemo(() => {
        return trackedOffers.map((tracked) => {
            const offer = offers.find((o) => o.id === tracked.offerId);
            const card = cards.find((c) => c.id === tracked.cardId);
            return { ...tracked, offer, card };
        }).filter((item) => item.offer && item.card); // filter out broken links
    }, [trackedOffers, offers, cards]);

    // Use unified search hook for Tracked Offers
    // We want to filter based on offer name, card name, etc.
    // Since enrichedTrackedOffers is complex, we provide functions to access nested fields.
    const { searchTerm, setSearchTerm, filteredItems: filteredTrackedOffers } = useSearch(enrichedTrackedOffers, [
        (item) => item.offer?.merchantName || '',
        (item) => item.offer?.description || '',
        (item) => item.card?.name || '',
        (item) => item.card?.issuer || ''
    ]);

    // Filter available offers
    // Note: useSearch can be reused if we want separate searches, but here we share the ONE search bar 
    // to filter BOTH lists simultaneously?
    // In the previous implementation, the same `searchTerm` filtered both lists.
    // So we need to apply the SAME logic manually or re-use the hook logic?
    // Actually, calling useSearch twice with the same searchTerm state is tricky if the hook *controls* the state.
    // Ah, my hook *internalizes* the state.
    // If I want to share the search term, I should probably NOT use the hook's internal state for both, 
    // OR I should use the hook once for the "primary" list and manually filter the second?
    // OR, I can just use one hook instance if I merge the lists? No, they are different types.

    // Better approach:
    // The hook in its current form owns the state.
    // I will use the hook for the Tracked Offers (primary view).
    // And for the Catalog, I will manually filter using the SAME `searchTerm` returned by the hook.
    // This keeps the hook as the "source of truth" for the search term.

    const filteredCatalogOffers = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return offers.filter((offer) =>
            offer.merchantName.toLowerCase().includes(term) ||
            offer.description.toLowerCase().includes(term)
        );
    }, [searchTerm, offers]);


    return (
        <div className="space-y-10 pb-20">
            {/* Search Bar - Floating Glass Effect */}
            <div className="sticky top-0 z-40 py-4 -mx-4 px-4 md:-mx-8 md:px-8 bg-gray-50/80 dark:bg-black/80 backdrop-blur-xl transition-all border-b border-transparent data-[scrolled=true]:border-border/50">
                <div className="relative max-w-2xl mx-auto md:mx-0">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search offers, merchants, or cards... (e.g., 'Best Buy')"
                        className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border-none rounded-2xl text-lg shadow-lg shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground/60"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Active Tracked Offers */}
            <section className="animate-slide-up">
                <h2 className="text-2xl font-bold mb-6 flex items-center tracking-tight text-foreground/90">
                    <CheckCircle className="w-6 h-6 mr-3 text-primary fill-primary/10" />
                    Tracked Offers
                </h2>

                {filteredTrackedOffers.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <Search className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-lg font-medium">
                            {searchTerm ? "No tracked offers match your search." : "No active offers. Start by adding one!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTrackedOffers.map((item) => (
                            <TrackedOfferCard
                                key={item.id}
                                item={item}
                                onDelete={deleteTrackedOffer}
                                onUpdateStatus={updateOfferStatus}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Catalog Listing */}
            {searchTerm && (
                <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-4 my-8">
                        <div className="h-px bg-border flex-1"></div>
                        <h2 className="text-lg font-semibold text-muted-foreground flex items-center">
                            <Gift className="w-5 h-5 mr-2" />
                            Available Offers Matching "{searchTerm}"
                        </h2>
                        <div className="h-px bg-border flex-1"></div>
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
                        {filteredCatalogOffers.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-secondary">
                                <p>No new offers found matching "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Dashboard;
