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
- **Backend Persistence**: Data is stored securely in a local **SQLite database** via a **Node.js/Express** server.
- **Robust Storage**: Data survives browser cache clearing.
- **Logging**: Detailed server logs for all operations.
- **Configurable**: Environment-based configuration for API URLs.

## Configuration

This application uses environment variables for configuration. You can create a `.env` file in the root directory.

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for the backend API | `http://localhost:3001/api` |

## Technical Details
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Zustand.
- **Backend**: Node.js, Express, SQLite, Morgan (logging).
- **Communication**: REST API.

For deep dive, see [TECH_DOC.md](./src/TECH_DOC.md).

## Getting Started

1. **Install Dependencies** (Root & Backend):
   ```bash
   npm install
   cd server && npm install
   ```

2. **Configure Environment** (Optional):
   Create a `.env` file in the root if you need to customize the API URL.
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Run Application**:
   This command starts both the React Frontend and the Express Backend concurrently.
   ```bash
   npm run dev:all
   ```

3. **Access**:
   - Frontend: `http://localhost:5173` (or similar)
   - Backend API: `http://localhost:3001`
   - Database: `server/database.sqlite`
