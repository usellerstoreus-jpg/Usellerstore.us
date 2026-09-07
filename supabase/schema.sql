-- =========================================================
-- U Seller Store - Supabase Database Schema & Seed Script
-- =========================================================
-- How to apply:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to SQL Editor -> New Query
-- 3. Paste the contents of this file and click "Run"
-- =========================================================

-- Enable uuid-ossp extension if needed
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  title text not null,
  category text not null,
  cost numeric(10, 2) not null default 0.00,
  sell numeric(10, 2) not null default 0.00,
  profit numeric(10, 2) not null default 0.00,
  image text default '',
  stock integer not null default 0,
  sku text default '',
  status text not null check (status in ('active', 'draft', 'out_of_stock')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ORDERS TABLE
create table if not exists public.orders (
  id text primary key,
  order_number text not null,
  customer_name text not null,
  customer_email text default '',
  shipping_address text default '',
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) not null default 0.00,
  profit numeric(10, 2) not null default 0.00,
  status text not null check (status in ('unpaid', 'paid', 'pickup', 'on_the_way', 'out_for_delivery', 'delivered', 'cancelled')) default 'unpaid',
  date text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id text primary key,
  title text not null,
  description text default '',
  date text default '',
  time_ago text default '',
  ref_code text default '',
  type text not null check (type in ('kyc', 'order', 'system', 'payout')) default 'system',
  read boolean not null default false,
  details text default '',
  created_at timestamptz not null default now()
);

-- 4. SELLER PROFILES TABLE
create table if not exists public.seller_profiles (
  id text primary key default 'tester-seller-1',
  shop_name text not null default 'tester',
  owner_name text not null default 'Zain',
  email text not null default 'zain55@gmail.com',
  phone text default '+1 (555) 234-5678',
  currency text default 'USD ($)',
  balance numeric(10, 2) not null default 0.00,
  guarantee numeric(10, 2) not null default 0.00,
  rating numeric(3, 2) not null default 5.0,
  total_orders integer not null default 0,
  member_since text default 'Aug 2026',
  verified boolean not null default true,
  active boolean not null default true,
  seo_title text default 'tester Official Store - Premium Products & Quick Delivery',
  seo_description text default 'Shop top quality electronics, home goods, wellness and outdoor essentials from tester.',
  avatar_letter text default 'Z',
  payout_methods jsonb not null default '[{"type": "bank", "bankName": "Chase Bank USA", "accountNumber": "•••• •••• 8842", "accountHolder": "Zain"}]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable Row Level Security on all tables
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.notifications enable row level security;
alter table public.seller_profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Allow public read access on products" on public.products;
drop policy if exists "Allow public write access on products" on public.products;
drop policy if exists "Allow public update access on products" on public.products;
drop policy if exists "Allow public delete access on products" on public.products;

drop policy if exists "Allow public read access on orders" on public.orders;
drop policy if exists "Allow public write access on orders" on public.orders;
drop policy if exists "Allow public update access on orders" on public.orders;
drop policy if exists "Allow public delete access on orders" on public.orders;

drop policy if exists "Allow public read access on notifications" on public.notifications;
drop policy if exists "Allow public write access on notifications" on public.notifications;
drop policy if exists "Allow public update access on notifications" on public.notifications;
drop policy if exists "Allow public delete access on notifications" on public.notifications;

drop policy if exists "Allow public read access on seller_profiles" on public.seller_profiles;
drop policy if exists "Allow public write access on seller_profiles" on public.seller_profiles;
drop policy if exists "Allow public update access on seller_profiles" on public.seller_profiles;

-- Allow full access for anon/service role (ideal for demo/seller console client operations)
create policy "Allow public read access on products" on public.products for select using (true);
create policy "Allow public write access on products" on public.products for insert with check (true);
create policy "Allow public update access on products" on public.products for update using (true);
create policy "Allow public delete access on products" on public.products for delete using (true);

create policy "Allow public read access on orders" on public.orders for select using (true);
create policy "Allow public write access on orders" on public.orders for insert with check (true);
create policy "Allow public update access on orders" on public.orders for update using (true);
create policy "Allow public delete access on orders" on public.orders for delete using (true);

create policy "Allow public read access on notifications" on public.notifications for select using (true);
create policy "Allow public write access on notifications" on public.notifications for insert with check (true);
create policy "Allow public update access on notifications" on public.notifications for update using (true);
create policy "Allow public delete access on notifications" on public.notifications for delete using (true);

create policy "Allow public read access on seller_profiles" on public.seller_profiles for select using (true);
create policy "Allow public write access on seller_profiles" on public.seller_profiles for insert with check (true);
create policy "Allow public update access on seller_profiles" on public.seller_profiles for update using (true);

-- Enable real-time publication on all tables
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.seller_profiles;

-- 6. SEED INITIAL DATA (Upsert so it can be run multiple times safely)
insert into public.seller_profiles (
  id, shop_name, owner_name, email, phone, currency, balance, guarantee, rating, total_orders, member_since, verified, active, seo_title, seo_description, avatar_letter, payout_methods
) values (
  'tester-seller-1',
  'tester',
  'Zain',
  'zain55@gmail.com',
  '+1 (555) 234-5678',
  'USD ($)',
  0.00,
  0.00,
  5.0,
  0,
  'Aug 2026',
  true,
  true,
  'tester Official Store - Premium Products & Quick Delivery',
  'Shop top quality electronics, home goods, wellness and outdoor essentials from tester.',
  'Z',
  '[{"type": "bank", "bankName": "Chase Bank USA", "accountNumber": "•••• •••• 8842", "accountHolder": "Zain"}]'::jsonb
) on conflict (id) do nothing;

insert into public.notifications (id, title, description, date, time_ago, ref_code, type, read, details)
values (
  'notif-1',
  'KYC approved',
  'Your identity has been verified. You''re all set.',
  '7 AUGUST 2026',
  '7 Aug',
  '#6bc54j84',
  'kyc',
  true,
  'Your identity document (Passport / ID) submitted for store "tester" was reviewed and approved by the compliance team. You now have full seller privileges including withdrawals.'
) on conflict (id) do nothing;

insert into public.products (id, title, category, cost, sell, profit, image, stock, sku, status)
values
  ('prod-1', 'Superfeet All-Purpose Support Medium Arch Insoles (Blue) for Activ...', 'Health & Wellness', 47.53, 59.95, 12.42, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80', 84, 'SF-INSOLE-BLU', 'active'),
  ('prod-2', '11 inch 2 in 1 Tablet, 20GB + 128GB, Android 16 Tablet with Case, 1TB...', 'Tablets', 59.26, 74.99, 15.73, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80', 35, 'TAB-2IN1-11PK', 'active'),
  ('prod-3', 'Dorlicecass Irregular Wall Mirror - Wall Mirrors Decorative 22"x 36"...', 'Home & Kitchen', 56.92, 71.99, 15.07, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80', 22, 'MIR-IRR-2236', 'active'),
  ('prod-4', 'bmani Ear Buds Wireless Earbuds Bluetooth Headphones with 80H...', 'Electronics', 28.69, 35.99, 7.30, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80', 140, 'BM-EAR-BT80H', 'active'),
  ('prod-5', 'YEOREO Workout Scrunch Shorts Women V Back Gym Butt Lifting Liz...', 'Under Garments', 19.17, 23.99, 4.82, 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=500&q=80', 96, 'YEO-SHRT-VBCK', 'active'),
  ('prod-6', 'Children''s Scavenger Hunt | Toddler Activities | Games for 2, 3 Year Old''s...', 'Toys & Games', 10.39, 12.99, 2.60, 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=500&q=80', 65, 'TOY-SCAV-HUNT', 'active'),
  ('prod-7', 'YudouTech (No Filler Bean Bag Chair Cover Without Filler,Big Round Soft...', 'Home & Kitchen', 43.81, 55.20, 11.39, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&q=80', 19, 'YD-BEAN-BAGCVR', 'active'),
  ('prod-8', 'Aoxun 14pcs Patio Cushion Covers Replacement, Waterproof Outdoor...', 'Home & Kitchen', 86.22, 109.99, 23.77, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&q=80', 14, 'AOX-PAT-CSH14', 'active'),
  ('prod-9', 'Furinno JUST Side Table, 3-Tier End Table, Open Shelves Night Stand,...', 'Home & Kitchen', 11.95, 14.94, 2.99, 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=500&q=80', 58, 'FUR-ST-3TIER', 'active'),
  ('prod-10', 'PetSafe Wireless Pet Containment System - Original Wireless Electric...', 'Pet Supplies', 128.81, 166.46, 37.65, 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80', 11, 'PS-PET-SYSWIR', 'active'),
  ('prod-11', 'Plant Stand Indoor with Grow Lights - 62" Tall Plant Shelf, Lighted Corner...', 'Home & Garden', 54.82, 69.29, 14.47, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=500&q=80', 28, 'PLT-STND-62LT', 'active'),
  ('prod-12', 'Feandrea Litter Box Enclosure for 2 Cats, Hidden Litter Box Furniture wit...', 'Pet Supplies', 116.51, 149.99, 33.48, 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80', 16, 'FEA-LTR-ENC2C', 'active'),
  ('prod-13', 'RMF-TX500U Voice Replace Remote Applicable for Sony Bravia TV KD-...', 'Electronics', 9.80, 14.99, 5.19, 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=500&q=80', 120, 'RMT-SNY-TX500', 'active'),
  ('prod-14', 'FROGG TOGGS Chilly Pad, Instant Cooling Towel, Long Lasting...', 'Sports & Outdoors', 8.40, 12.99, 4.59, 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=500&q=80', 75, 'FT-COOL-TWL01', 'active'),
  ('prod-15', 'Yaheetech 3 Piece Patio Rattan Bistro Set, Outdoor All Weather PE Wicker...', 'Home & Kitchen', 112.30, 145.00, 32.70, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80', 8, 'YAH-BST-3PCRAT', 'active')
on conflict (id) do nothing;
