# FinSense AI
link: https://finsense-ai-companion-48.lovable.app
> An intelligent financial planning and smart money assistant powered by AI.

![FinSense AI](https://img.shields.io/badge/FinSense-AI-blueviolet?style=flat&logo=sparkline)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TanStack](https://img.shields.io/badge/TanStack-Start-ff4154?logo=tanstack)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Backend-Lovable%20Cloud-3ECF8E)

FinSense AI is a premium AI-powered fintech web application that helps users securely upload bank statements, analyze spending habits, create personalized budgets, receive AI-powered savings recommendations, track financial goals, and improve financial wellness — all in **South African Rand (ZAR)**.

---

## Features

### Core Capabilities

- **Secure Bank Statement Upload** — Upload PDF or CSV bank statements. Files are stored in a private encrypted bucket and parsed by AI to extract transactions automatically.
- **AI Transaction Categorization** — Transactions are automatically categorized into: Food, Transport, Shopping, Entertainment, Bills, Savings, Subscriptions, Income, and Other.
- **Spending Analysis** — Interactive charts (area charts, pie charts) showing income vs expenses over time and spending breakdown by category.
- **Budget Planner** — Create category-based budgets with monthly limits. Track actual spending against your planned limits.
- **Savings Goals** — Set personalized savings goals (e.g., Emergency Fund, Holiday, New Car) with target amounts and deadlines. Track progress visually.
- **Financial Wellness Score** — Get a holistic financial health score based on savings rate, expense ratios, budget adherence, and goal progress.
- **AI Financial Assistant** — Chat with an AI coach that knows your financial context and gives personalised advice, answers questions, and suggests concrete next steps.

### Authentication & Security

- Email + password authentication with secure sessions
- Google OAuth sign-in
- Password reset via email
- Row-Level Security (RLS) on all database tables
- Private encrypted storage for bank statements
- User data fully isolated — users can only access their own data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) v1 (React 19, SSR/SSG, file-based routing) |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 with custom OKLCH design tokens |
| UI Components | shadcn/ui + Radix UI primitives |
| Charts | Recharts |
| Backend / Auth | Lovable Cloud (Supabase) — PostgreSQL, Auth, Storage |
| AI | Lovable AI Gateway — Gemini 3 Flash for statement parsing & chat |
| Server Logic | TanStack `createServerFn` (edge-ready server functions) |

---

## Project Structure

```
├── src/
│   ├── components/ui/           # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── components/page-header.tsx  # Shared page header & KPI card components
│   ├── hooks/
│   │   ├── use-auth.tsx         # Auth context (Supabase auth + session)
│   │   └── use-mobile.tsx       # Mobile viewport detection
│   ├── integrations/
│   │   ├── lovable/             # Lovable Cloud auth helpers
│   │   └── supabase/            # Supabase clients (browser, server, middleware)
│   ├── lib/
│   │   ├── ai.functions.ts      # Server functions: analyzeStatement, chatWithAssistant
│   │   ├── format.ts            # ZAR currency formatting + category colors
│   │   └── utils.ts             # cn() helper
│   ├── routes/
│   │   ├── __root.tsx           # Root layout (HTML shell, providers, meta tags)
│   │   ├── index.tsx            # Landing page (redirects to dashboard or auth)
│   │   ├── auth.tsx             # Login / Sign-up page
│   │   ├── _authenticated.tsx   # Protected layout (sidebar, auth guard)
│   │   ├── _authenticated.dashboard.tsx   # Dashboard with KPIs & charts
│   │   ├── _authenticated.upload.tsx      # Secure statement upload
│   │   ├── _authenticated.spending.tsx    # Spending analysis
│   │   ├── _authenticated.budgets.tsx     # Budget planner
│   │   ├── _authenticated.goals.tsx       # Savings goals tracker
│   │   ├── _authenticated.wellness.tsx    # Financial wellness score
│   │   ├── _authenticated.assistant.tsx   # AI financial coach chat
│   │   └── _authenticated.privacy.tsx     # Privacy & security info
│   ├── router.tsx               # TanStack Router instance
│   ├── start.ts                 # TanStack Start server config
│   └── styles.css               # Design system tokens (OKLCH colors, glassmorphism)
├── supabase/
│   ├── migrations/              # Database migrations (tables, RLS policies, triggers)
│   └── config.toml              # Supabase project config
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (name, email), auto-created on signup |
| `statements` | Uploaded bank statement metadata (filename, path, totals) |
| `transactions` | Parsed transactions (date, description, category, amount) |
| `budgets` | User-defined budgets (name, category, limit, period) |
| `savings_goals` | Savings goals (name, category, target, current, deadline) |
| `chat_messages` | AI assistant conversation history |

All tables have **Row-Level Security** policies ensuring users can only access their own data.

### Storage

- **Bucket**: `statements` (private)
- Statements uploaded by users are stored with user-isolated paths
- RLS policies enforce users can only read/write their own files

---

## AI Features

### Bank Statement Parser

The `analyzeStatement` server function sends statement text to the Lovable AI Gateway (Gemini 3 Flash) with a structured tool-calling schema. The AI extracts:

- Date (`YYYY-MM-DD`)
- Description
- Category (from 9 predefined categories)
- Amount (ZAR)

If the input is not a valid statement, the AI generates realistic South African example transactions.

### AI Financial Assistant

The `chatWithAssistant` server function provides a conversational financial coach. It receives:

- Chat history
- User's financial context (transactions, budgets, goals)

Returns personalised, actionable advice in a warm, practical tone.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) or Node.js 20+
- A Lovable Cloud project (provides Supabase backend, auth, storage, and AI gateway)

### Install Dependencies

```bash
bun install
```

### Environment Variables

The following are automatically provided by Lovable Cloud in `.env`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

For AI features, `LOVABLE_API_KEY` is injected at runtime by Lovable Cloud.

### Development Server

```bash
bun run dev
```

The app runs at `http://localhost:3000`.

### Build

```bash
bun run build
```

### Database Migrations

Migrations are managed in `supabase/migrations/`. To apply changes, use the Lovable Cloud migration tool.

---

## Design System

- **Dark theme** with glassmorphism cards (`backdrop-blur`, semi-transparent backgrounds)
- **Primary accent**: Cyan-teal gradient (`#2DD4BF` → `#0EA5E9`)
- **Color tokens**: OKLCH-based semantic palette in `src/styles.css`
- **Typography**: System font stack with tight tracking on headings
- **Border radius**: Large rounded corners (2xl, 3xl) for premium feel
- **Shadows**: Custom glow shadows (`--shadow-glow`, `--shadow-card`)

---

## Authentication Flow

1. Unauthenticated users visiting `/dashboard` or any `/_authenticated/*` route are redirected to `/auth`
2. `/auth` page supports:
   - Email + password login
   - Email + password sign-up
   - Google OAuth
   - Password reset
3. After successful auth, users are redirected to `/dashboard`
4. The `_authenticated.tsx` layout guards all child routes and renders the sidebar navigation

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — redirects to dashboard or auth |
| `/auth` | Login / Sign-up |
| `/dashboard` | Main dashboard with KPIs, charts, recent transactions |
| `/upload` | Upload bank statements for AI parsing |
| `/spending` | Detailed spending analysis by category & merchant |
| `/budgets` | Budget planner with limits vs actuals |
| `/goals` | Savings goals tracker |
| `/wellness` | Financial wellness score & recommendations |
| `/assistant` | AI financial coach chat |
| `/privacy` | Privacy & security information |

---

## License

MIT

---

Built with [Lovable](https://lovable.dev) — AI-powered full-stack development.
