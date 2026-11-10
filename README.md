# FINORA — Intelligent Personal Finance & Automated Bank Statement Management

Finora is a fintech-grade personal finance application engineered for zero-fee, automated bank statement imports, multi-account management, rule-based expense categorization, and financial KPI analytics.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Bank Account Management
- Dedicated **Bank Accounts** interface (`/accounts`).
- Supported account types:
  - **Savings Account**
  - **Salary Account**
  - **Current Account**
  - **Cash**
  - **UPI Wallet**
  - **Debit Card**
  - **Credit Card** (outstanding balance tracking)
  - **Digital Wallet**
  - **Investment Account**
- **Security & Privacy First**: Never stores full card numbers or sensitive account details. Strictly enforces masked last-4 digits (`•••• 8921`). Zero banking passwords, OTPs, or net banking credential requests.
- Premium physical/fintech card aesthetics with bank brand accents, metallic gradients, and EMV chip styling.
- Features: Add, Edit, Delete, Archive/Unarchive, account-wise expenses, account-wise income, and aggregate balance calculation.

---

### 2. CSV Bank Statement Import Wizard (10-Step Workflow)
100% free to operate without requiring third-party banking aggregators or paid API subscriptions.
- **Step 1**: Target Bank Account Selection.
- **Step 2**: Modern drag-and-drop file upload with 10MB safety validation.
- **Step 3**: Built-in heuristic parsers for popular Indian banks:
  - **State Bank of India (SBI)**
  - **HDFC Bank** (handles preamble metadata headers and footer disclaimers)
  - **ICICI Bank**
  - **Axis Bank**
  - **Federal Bank**
  - **Canara Bank**
  - **Generic / Custom Indian Bank CSVs**
- **Step 4**: Automatic identification of `Transaction Date`, `Description/Narration`, `Debit Amount`, `Credit Amount`, `Balance`, and `Reference Number (UTR/Cheque)`.
- **Step 5**: Transaction preview table with real-time selection controls.
- **Step 6**: Column Mapping Fallback Tool to adjust custom bank headers with one-click re-parsing.
- **Step 7**: Multi-factor duplicate transaction detection.
- **Step 8**: Rule-based automatic merchant extraction & expense categorization.
- **Step 9**: User review and confirmation bar.
- **Step 10**: Persistent batch import into Finora with immediate KPI and balance recalculation.
- **Strict Guardrail**: Never imports transactions without showing a preview and obtaining user confirmation.

---

### 3. Intelligent Duplicate Transaction Detection
- Multi-factor duplicate checking:
  1. `BankReferenceID` / UTR / Cheque number matching.
  2. Exact `(Date, Amount, Account ID, Description similarity)` matching against existing database records.
  3. Intra-batch duplicate detection (identifies duplicate lines within the uploaded CSV).
- Visual warning badges with explicit reason descriptions (e.g. `Matched Reference ID: UPI/43120199201`).
- Duplicates are deselected by default, allowing users to review and resolve them without silent duplication.

---

### 4. Rule-Based Categorization & Self-Learning Merchant Mappings
- Built-in rule catalog covering leading Indian and international merchants:
  - **Food & Dining**: Swiggy, Zomato, Starbucks, McDonald's, Blinkit, Zepto, Instamart, BigBasket, KFC, Dominos
  - **Travel & Commute**: Uber, Ola, Rapido, IRCTC, MakeMyTrip, Cleartrip, Fastag, IndiGo, Air India
  - **Shopping**: Amazon, Flipkart, Myntra, Meesho, Ajio, Nykaa, Zara, Decathlon
  - **Entertainment**: Netflix, Spotify, Prime Video, Hotstar, BookMyShow, PVR, YouTube
  - **Subscriptions**: Google, Microsoft, OpenAI, GitHub, Notion, AWS, Adobe, Canva
  - **Fuel**: IndianOil, HPCL, BPCL, Shell, Petrol Pump
  - **Utilities & Telecom**: Airtel, Jio, Vi, Bescom, Tata Power, Mahanagar Gas, ACT Fibernet
  - **Healthcare**: Apollo, Netmeds, PharmEasy, 1mg, Practo
  - **Salary & Income**: Payroll, Stipend, Dividends, Interest
  - **Transfers & Investments**: Zerodha, Groww, Upstox, Mutual Funds, Self Transfers
- **Self-Learning Memory**: Any manual category correction made during statement import or on the transactions list is memorized into `MerchantMappings` for all subsequent imports.
- No paid AI APIs required.

---

### 5. Financial Calculation Rules
- **Rule 1 (Debits vs Credits)**: Debit transactions are expenses; Credit transactions are income.
- **Rule 2 (Transfers)**: Internal transfers between accounts (e.g. `SELF TRANSFER TO SAVINGS`) are strictly excluded from monthly income and expense calculations.
- **Rule 3 (Refunds)**: Identified separately and credited to offset category expenses.
- **Rule 4 (Credit Card Bill Payments)**: Payments towards credit cards (e.g. `CRED CC PAYMENT`) are classified as transfers/card payments, completely preventing double-counting of expenses already recorded as credit card charges.
- Real-time updates to:
  - Account balances
  - Total Net Balance
  - Total Bank Balance vs Cash Balance vs Credit Card Outstanding
  - Today's Daily Expense KPI
  - Month's Total Expenses & Income
  - Category-wise Spending & Daily/Monthly Category Target Utilization

---

### 6. Transaction Management & Audit Trail
- **Source Badges**: Every transaction displays its origin (`Manual`, `CSV Import`, `Future Bank Sync`).
- In-place editing: Change category, change account, change transaction type, add notes, and delete.
- **Import History (`/import-history`)**: Complete audit trail showing File Name, Import Date, Total Parsed, Successful Imports, Duplicate Count, and Failed Count.
- **Rollback Engine**: Allows undoing any import batch with a single click, automatically deleting the imported transactions and restoring account balances.

---

### 7. Google Sheets Storage & Local Dual-Engine
- Supported 7 standardized schemas:
  - `Accounts`
  - `Transactions` (with `Source`, `ImportBatchID`, `BankReferenceID`, `ImportedAt`, `MerchantName`, `OriginalDescription`)
  - `Categories`
  - `MerchantMappings`
  - `ImportHistory`
  - `Targets`
  - `Budgets`
- **Zero Frontend Exposure Security**: Google Sheets credentials (`GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) are accessed strictly on the secure backend.
- **Dual-Engine Architecture**: Includes a local JSON engine (`data/finora_data.json`) that works instantly out of the box with zero external dependencies, plus automatic background sync to Google Sheets when configured.

---

### 8. Bank Synchronization Architecture (RBI Account Aggregator)
- Future-ready integration framework located in `src/lib/account-aggregator.ts`.
- Provider-independent contract designed for RBI-licensed NBFC-AAs:
  - **OneMoney**
  - **Finvu**
  - **Setu**
- Dedicated `/bank-sync` architectural explanation page with a transparent "Automatic Bank Sync — Coming Soon" status. Zero fake API calls.

---

## 🧪 Comprehensive Automated Test Suite

Finora includes automated unit and integration tests covering all 13 core scenarios requested:

```bash
npm test
```

### Verified Scenarios:
1. Valid SBI CSV statement import.
2. HDFC Bank CSV statement import with metadata preamble and footer rows.
3. CSV with custom column headers (Axis Bank: `Tran Date`, `PARTICULARS`, `DR`, `CR`, `BAL`).
4. Proper separation of debit (expense) and credit (income) transactions.
5. Duplicate detection when importing the same statement twice.
6. Graceful handling of missing or blank descriptions.
7. Varied Indian date formats (`DD/MM/YYYY`, `DD-Mon-YYYY`, `DD/MM/YY`, `YYYY-MM-DD`).
8. Learning manually corrected merchant-category mappings.
9. Daily expense KPI calculation.
10. Category target utilization and progress calculation.
11. Accurate account balance updates.
12. Exclusion of internal transfers from income and expenses.
13. Prevention of credit card payment double-counting.
14. Complete end-to-end API pipeline (Preview → Mapping → Confirm → Analytics → History → Rollback).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Run Production Build
```bash
npm run build
npm run start
```

### 4. Or Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

