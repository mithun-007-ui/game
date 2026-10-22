# ⛩️ Japan Auction Arena (日本オークションアリーナ)
### Japanese Tourist Places Live Auction Game Management System

A full-stack, responsive, real-time web application engineered for college festival events where teams compete to purchase famous Japanese tourist destinations in a high-stakes auction game.

---

## 🌟 Key Highlights & Design

- **Authentic Japanese Aesthetic**: Sakura (cherry blossom) theme with crimson red, gold, charcoal, and glassmorphism. Floating cherry blossom petal animations and traditional accents.
- **Dual Engine Architecture**:
  - **Local Arena Engine**: Out-of-the-box, zero-config real-time multi-tab synchronization using browser `BroadcastChannel` and local storage persistence. Multiple browser tabs (e.g. Admin laptop, Team phones, Auditorium projector) sync instantaneously.
  - **Firebase Firestore Production Mode**: Full cloud integration with Firestore real-time snapshot listeners (`onSnapshot`), atomic Cloud Functions transactions, separate `secretValuations` collections, and production security rules.
- **Strict Multi-Layer Privacy Enforcement**:
  - **Auctioneer View**: Complete transparency with all teams' budgets, spending, purchased places, and secret game asset values.
  - **Participant View**: Teams see only their own remaining purse, spending, and won places.
  - **Database-Level Partitioning**: Secret asset values (`assetValue`) are stored in `secretValuations`, restricted by Firestore security rules so participants cannot query or download secret valuations before the Grand Reveal.
  - **Team Balance Isolation**: Teams can only read their own document in `teams/{teamId}`. Other teams' private remaining balances and spending are withheld at the database level.
- **Dedicated Big-Screen Projector Display (`/projector`)**: Ultra-high contrast display with massive typography designed for college auditorium projectors readable from 30+ meters away.
- **Web Audio Sound Effects**: Synthesized Japanese temple bell (gong), wooden hyoshigi clack, auctioneer bid chime, and championship fanfare using the Web Audio API without external file dependencies.

---

## 🏯 Seeded Japanese Destinations Inventory

The system includes the 10 famous Japanese destinations with authentic photography, base starting prices, and secret game asset values:

| No. | Destination | Prefecture / Region | Base Price | Secret Asset Value |
|---|---|---|---:|---:|
| 1 | **Mount Fuji (富士山)** | Shizuoka / Yamanashi | ¥5,000,000 | ¥15,000,000 |
| 2 | **Himeji Castle (姫路城)** | Hyogo | ¥4,000,000 | ¥12,000,000 |
| 3 | **Itsukushima Shrine (厳島神社)** | Hiroshima (Miyajima) | ¥3,000,000 | ¥10,000,000 |
| 4 | **Shirakawa-go (白川郷)** | Gifu | ¥2,000,000 | ¥8,000,000 |
| 5 | **Arashiyama Bamboo Grove (嵐山竹林)** | Kyoto | ¥3,000,000 | ¥9,000,000 |
| 6 | **Hiroshima Peace Memorial (原爆ドーム)** | Hiroshima | ¥4,000,000 | ¥11,000,000 |
| 7 | **Nikko Toshogu Shrine (日光東照宮)** | Tochigi | ¥2,000,000 | ¥7,000,000 |
| 8 | **Nara Park (奈良公園)** | Nara | ¥2,000,000 | ¥6,000,000 |
| 9 | **Kenrokuen Garden (兼六園)** | Ishikawa | ¥2,000,000 | ¥7,000,000 |
| 10 | **Yakushima Island (屋久島)** | Kagoshima | ¥3,000,000 | ¥10,000,000 |

*Inventory is initialized once and persisted without duplication upon page refresh.*

---

## 👥 Default Participating Teams

Each team begins with a starting purse of **¥100,000,000**:

- **Team Sakura** — Passcode: `SAKURA-888`
- **Team Fuji** — Passcode: `FUJI-777`
- **Team Tokyo** — Passcode: `TOKYO-555`
- **Team Kyoto** — Passcode: `KYOTO-333`
- **Team Osaka** — Passcode: `OSAKA-222`
- **Team Hokkaido** — Passcode: `HOKKAIDO-111`

*The Auctioneer can register custom teams, modify purses, or disable access at any time.*

---

## 🚀 Quick Start Guide

### 1. Installation & Running Locally

```bash
# Clone or navigate into the project directory
cd action

# Start the Vite development server (supports multi-tab testing)
npm run dev

# Or expose on your local network to test across phone and laptop on the same Wi-Fi:
npm run dev -- --host
```

Visit **`http://localhost:5173/`** in your browser.

### 2. Login Credentials

- **Auctioneer / Admin Portal**:
  - Navigate to `/login` and select the **Auctioneer Admin** tab.
  - Master Passcode: `katana123` or `admin123` (or click **⚡ Instant 1-Click Auctioneer Demo Login**).
- **Participant / Team Login**:
  - Navigate to `/login` and select the **Team Participant** tab.
  - Enter any team passcode (e.g., `SAKURA-888` or click any quick-launch demo team button).

---

## 🔒 Security & Privacy Architecture

```
Firestore Database Layout
├── places/{placeId}               --> Public destination metadata (name, image, basePrice, status). NO assetValue!
├── secretValuations/{placeId}     --> Admin & Reveal only: { assetValue: 15000000 }. Blocked from participants!
├── teams/{teamId}                 --> Private finances: { remainingPurse, totalSpent }. Only Admin & Team owner!
├── publicTeams/{teamId}           --> Public directory: { id, name, color, active }. NO financial balances!
├── auctionState/active            --> Live auction sync: { currentBid, leadingTeamId, timerRemaining }
├── purchases/{purchaseId}         --> Confirmed sales. Participants only see won items.
└── auditLogs/{logId}              --> Immutable audit trail. Admin only.
```

1. **Database-Level Secret Asset Value Protection**:
   - `places` contains public destination data. Secret valuations are housed in `secretValuations/{placeId}`.
   - `firestore.rules` enforces: `allow read: if isAdmin() || areResultsRevealed();`. Participants querying `places` literally cannot receive secret valuations.
2. **Team Balance Isolation**:
   - `teams/{teamId}` enforces: `allow read: if isAuthenticated() && (isAdmin() || request.auth.token.teamId == teamId);`. Teams cannot snoop on rival balances.
3. **Atomic Bid & Sale Confirmations**:
   - Handled server-side in Cloud Functions (`functions/index.js`) using `db.runTransaction()`.
   - Bids must equal or exceed base price and strictly surpass the current highest bid.
   - Overspending is blocked server-side: a team cannot purchase beyond their remaining purse.
4. **Accidental Sale Reversals**:
   - The Auctioneer can safely reverse an accidental sale via an explicit confirmation modal.
   - The purchase price is refunded to the team, the place is restored to Available status, and an audit trail entry is preserved as `reversed`.
5. **Controlled Grand Results Reveal**:
   - Final scores and rankings are revealed only when the auctioneer clicks **Reveal Official Results**.
   - Tie-breaking rule: Teams with equal asset values are ranked by higher remaining purse.

---

## 🔥 Firebase Setup & Deployment Guide

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database** in test/production mode.
3. Enable **Authentication** (Email/Password or Anonymous).

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and enter your project keys:
```bash
cp .env.example .env
```
Fill in the values from your Firebase Project Settings:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcde...
```

### Step 3: Deploy Firestore Rules and Cloud Functions
Install the Firebase CLI and deploy the security rules and backend functions:
```bash
# Login to Firebase
firebase login

# Set your active project
firebase use your-project-id

# Deploy Firestore Security Rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions for atomic transactions
firebase deploy --only functions
```

### Step 4: Seed Initial Data to Firestore
Open the web application as the Auctioneer (`/admin`), go to **Game Settings**, and click **"Seed Initial Inventory to Firestore"** (or click the Connection Pill in the top navigation bar to open the diagnostics modal and trigger seeding).

---

## 📱 Two-Device Live Event Verification Checklist

Follow this checklist to verify real-time cross-device synchronization before your live event:

| Step | Action on Device 1 (Auctioneer Laptop) | Action on Device 2 (Participant Phone) | Expected Observed Result |
|:---:|---|---|---|
| **1** | Open `/login`, sign in as Auctioneer (`katana123`). Navigate to `/admin`. | Open `/login`, sign in as **Team Sakura** (`SAKURA-888`). | Both devices are authenticated into their respective roles. |
| **2** | Check Connection Pill in navbar. | Check Connection Pill in navbar. | Both devices show connection status matching active engine (`Firebase Connected` or `Local Real-Time Sync`). |
| **3** | On Admin **Live Auction** tab, select **Mount Fuji** and click **Start Live Auction**. | Keep Participant Dashboard open on **Live Stage**. | Participant phone instantly shows Mount Fuji on the live stage without page refresh. |
| **4** | On Admin, select **Team Sakura**, enter bid **¥7,000,000**, click **Confirm & Update Highest Bid**. | Observe Live Stage on phone. | Current highest bid updates to **¥7,000,000** on phone with "Leading: YOUR TEAM!". |
| **5** | On Admin, click **CONFIRM SOLD (落札)** and confirm the modal. | Observe phone dashboard. | Phone immediately updates: Remaining purse shows **¥93,000,000**, total spent shows **¥7,000,000**, and Mount Fuji appears under **My Secured Places**. |
| **6** | On Admin, check Mount Fuji asset value (shows secret ¥15,000,000). | Inspect Mount Fuji card on phone. | **CRITICAL PRIVACY CHECK**: Secret asset value (¥15M) is **NOT** visible on phone card or anywhere on the participant screen. |
| **7** | On Admin, go to **Leaderboard** and click **Reveal Official Results to All**. | Observe banner appearing on phone. | Phone displays "Official Final Results Have Been Revealed!" with link to Grand Ceremony. |
| **8** | Click **View Grand Reveal Ceremony**. | Tap **View Final Podium Rankings**. | Both devices celebrate with victory fanfare and celebratory confetti! |

---

## 🧪 Automated Test Suite

Run the full end-to-end and security test suite at any time:

```bash
npm test
```

### Verified Test Suite Output:
- **12 End-to-End Tests**: Seeded inventory, opening bid base price validation, consecutive bid rules, budget overspend prevention, sale confirmation, accidental sale reversal, unsold destination handling, participant privacy projection masking, tie-breaker resolution, and storage persistence.
- **4 Security & Concurrency Tests**: Firestore Security Rules structure, Cloud Functions atomic transaction handlers, BroadcastChannel event-driven communication, and budget overspend protection.
- **Total**: 16/16 tests passing with 0 failures.
