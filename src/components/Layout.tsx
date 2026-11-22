import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Tag, Settings, Menu, X, Diamond } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const error = useStore((state) => state.error);
    const initialize = useStore((state) => state.initialize);
    const clearError = useStore((state) => state.clearError);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/offers', label: 'Offers', icon: Tag },
        { path: '/cards', label: 'Cards', icon: CreditCard },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Mobile top bar */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-background sticky top-0 z-50 border-b border-border">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center">
                        <Diamond className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">OfferTracker</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <aside className={cn(
                    "fixed lg:sticky top-0 left-0 z-40 h-screen w-56",
                    "bg-background border-r border-border",
                    "transition-transform duration-150 ease-out flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}>
                    {/* Brand */}
                    <div className="hidden lg:flex items-center gap-2.5 px-5 py-5 border-b border-border">
                        <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center">
                            <Diamond className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">OfferTracker</span>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-3 space-y-0.5">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors text-sm",
                                    isActive
                                        ? "bg-accent text-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer brand mark */}
                    <div className="px-5 py-3 border-t border-border">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">v0.1 · local</p>
                    </div>
                </aside>

                {/* Main */}
                <main className="flex-1 px-4 py-6 md:px-8 md:py-8 w-full max-w-[1280px] mx-auto min-h-screen">
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-foreground/30 z-30 lg:hidden animate-in fade-in"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}

                    {error && (
                        <div role="alert" className="mb-4 flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive">
                            <span>{error}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => initialize()}
                                    className="h-7 px-2 rounded-md border border-destructive/30 hover:bg-destructive/10 transition-colors text-[11px] font-medium uppercase tracking-wider"
                                >
                                    Reload
                                </button>
                                <button
                                    onClick={clearError}
                                    className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                                    aria-label="Dismiss"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="animate-in fade-in duration-200">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
