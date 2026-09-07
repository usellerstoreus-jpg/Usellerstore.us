# U Seller Store - Next.js Seller Console & E-Commerce Platform

A modern e-commerce seller console built with **Next.js 16**, **React 19**, **Tailwind CSS**, and **Supabase** (PostgreSQL Database & Cloud Storage).

---

## Features

- **Store Dashboard**: Analytics, order summaries, revenue stats, and quick balance overview.
- **Product Catalog Management**:
  - Add, edit, and delete products with live Supabase database sync.
  - **Image Uploads**: Drag-and-drop image file uploading backed directly by **Supabase Storage** CDN.
  - Profit and margin calculator per unit.
- **Orders Management**: Order status tracking and demo order generator.
- **Notifications**: Read/unread notification center and compliance verification alerts.
- **Seller Profile**: Custom shop settings, payout methods, and balance withdrawal management.
- **Supabase Cloud Sync**:
  - PostgreSQL database persistence for products, orders, notifications, and profiles.
  - Public file storage bucket for product imagery.
  - Status modal with live latency diagnostics and database ping.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/) Icons
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Storage**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`)

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd u-seller-store
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-or-service-role-key
```

### 3. Setup Database & Storage in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Run the migration script in [`supabase/schema.sql`](./supabase/schema.sql).
4. The script creates the `products`, `orders`, `notifications`, and `seller_profiles` tables with Row Level Security (RLS) and initial seed data.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
