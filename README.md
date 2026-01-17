# CCMOT - Credit Card & Offer Tracker

A personal finance dashboard to track credit card offers, rewards, and expirations.

## Features

### 🎯 Dashboard
- **Tracked Offers**: View all your active offers linked to specific cards.
- **Smart Status**: Offers automatically mark themselves as **Expired** when the date passes.
- **Compact Cards**: Clean, single-line display of card details (Issuer, Last 4, Holder) with smart masking.
- **Unified Search**: Quickly find any offer or card by name, merchant, or description.

### 💳 Card Management
- **Add/Edit Cards**: Store your credit cards with custom colors and optional notes.
- **Smart Fields**: Optional "Card Holder" and "Notes" fields.
- **Search**: Dedicated search bar for your card inventory (hides automatically during data entry).

### 🏷️ Offer Management
- **Catalog**: Maintain a database of available offers (e.g., "Spend $100, get $20 back").
- **Categories**: Organize offers by Travel, Dining, Shopping, etc., with visual icons.
- **Quick Track**: Easily link an offer to one or multiple cards.

### ⚙️ Data & Settings
- **Local Storage**: Data persists in your browser.
- **Import/Export**: Backup your data to JSON.
    - **Robust Import**: Automatically fixes missing fields from older backups to prevent crashes.

## Technical Details
- **Stack**: React, TypeScript, Vite, Tailwind CSS.
- **State**: Zustand with local storage persistence.
- **Architecture**: Modular components (`TrackedOfferCard`, `CatalogOfferCard`) and custom hooks (`useSearch`).

For deep dive, see [TECH_DOC.md](./src/TECH_DOC.md).

## Getting Started
1. `npm install`
2. `npm run dev`
