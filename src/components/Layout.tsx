import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Tag, Settings, Menu, X, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/offers', label: 'Offers', icon: Tag },
        { path: '/cards', label: 'Cards', icon: CreditCard },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 glass sticky top-0 z-50 border-b border-border/50">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        OfferTracker
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar Navigation - Desktop */}
                <aside className={`
                    fixed lg:sticky top-0 left-0 z-40 h-screen w-64 
                    glass border-r border-border/50
                    transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-6">
                        <div className="hidden lg:flex items-center gap-3 font-bold text-2xl mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                OfferTracker
                            </span>
                        </div>

                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-medium relative overflow-hidden",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                                            : "hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto min-h-screen">
                    {/* Overlay for mobile menu */}
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
