export interface Product {
  id: string
  title: string
  category: string
  cost: number
  sell: number
  profit: number
  image: string
  stock: number
  sku: string
  status: 'active' | 'draft' | 'out_of_stock'
  originalPrice?: number
  rating?: number
  reviewCount?: number
  discountPercent?: number
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  items: {
    productTitle: string
    quantity: number
    price: number
    image: string
    sellerId?: string
  }[]
  totalAmount: number
  profit: number
  status: 'unpaid' | 'paid' | 'pickup' | 'on_the_way' | 'out_for_delivery' | 'delivered' | 'cancelled'
  date: string
  shippingAddress: string
  sellerId?: string
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  date: string
  timeAgo: string
  refCode: string
  type: 'kyc' | 'order' | 'system' | 'payout'
  read: boolean
  details?: string
}

export interface KycSubmission {
  status: 'pending' | 'approved' | 'rejected'
  submittedAt?: string
  documentType: 'national_id' | 'passport' | 'driving_license' | 'business_license'
  idCardUrl?: string
  businessLicenseUrl?: string
  rejectionReason?: string
  shopName?: string
  ownerName?: string
  email?: string
  phone?: string
  joined?: string
}

export interface SellerProfile {
  id?: string
  kyc?: KycSubmission
  shopName: string
  ownerName: string
  email: string
  phone: string
  currency: string
  balance: number
  guarantee: number
  rating: number
  totalOrders: number
  memberSince: string
  verified: boolean
  active: boolean
  seoTitle: string
  seoDescription: string
  avatarLetter: string
  payoutMethods: {
    type: 'bank' | 'crypto'
    bankName?: string
    accountNumber?: string
    accountHolder?: string
    walletAddress?: string
    network?: string
  }[]
  // Admin Management & Settings
  isSuspended?: boolean
  withdrawalsBlocked?: boolean
  allowProductRemoval?: boolean
  productLimit?: number | 'unlimited'
  viewsBooster?: {
    enabled: boolean
    multiplier: number
    extraDailyViews: number
  }
  isDeleted?: boolean
  deletedAt?: string
  lastActiveAgo?: string
  joinedExact?: string
  password?: string
  reviewCount?: number
  activeItemsCount?: number
}

export interface CustomerAddress {
  id: string
  title: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

export interface CustomerProfile {
  name: string
  username: string
  email: string
  phone: string
  avatarLetter: string
  role: string
  addresses: CustomerAddress[]
  notifications: {
    emailAlerts: boolean
    orderUpdates: boolean
    promotions: boolean
    inAppAlerts: boolean
  }
}

export const shopCategories = [
  'All',
  'Under Garments',
  'Clothes',
  'Women Clothes',
  'Remotes',
  'Women Accessories',
  'Bags',
  'Electronics',
  'Laptops',
  'Tablets',
  'Mobiles & Accessories',
  'Headphones & Audio',
  'Keyboards & Mice',
  'Home & Kitchen',
  'Fashion',
  'Beauty & Personal Care',
] as const

export const masterCatalogProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Superfeet All-Purpose Support Medium Arch Insoles (Blue) for Active Living',
    category: 'Health & Wellness',
    cost: 47.53,
    sell: 59.95,
    profit: 12.42,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80',
    stock: 84,
    sku: 'SF-INSOLE-BLU',
    status: 'active',
  },
  {
    id: 'prod-2',
    title: '11 inch 2 in 1 Tablet, 20GB + 128GB, Android 16 Tablet with Case, 1TB Expandable',
    category: 'Tablets',
    cost: 59.26,
    sell: 74.99,
    profit: 15.73,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80',
    stock: 35,
    sku: 'TAB-2IN1-11PK',
    status: 'active',
  },
  {
    id: 'prod-3',
    title: 'Dorlicecass Irregular Wall Mirror - Decorative 22"x 36" Gold Metal Frame',
    category: 'Home & Kitchen',
    cost: 56.92,
    sell: 71.99,
    profit: 15.07,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80',
    stock: 22,
    sku: 'MIR-IRR-2236',
    status: 'active',
  },
  {
    id: 'prod-4',
    title: 'bmani Ear Buds Wireless Earbuds Bluetooth Headphones with 80H Playtime',
    category: 'Headphones & Audio',
    cost: 28.69,
    sell: 35.99,
    profit: 7.30,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80',
    stock: 140,
    sku: 'BM-EAR-BT80H',
    status: 'active',
  },
  {
    id: 'prod-5',
    title: 'YEOREO Workout Scrunch Shorts Women V Back Gym Butt Lifting Athletic',
    category: 'Under Garments',
    cost: 19.17,
    sell: 23.99,
    profit: 4.82,
    image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=500&q=80',
    stock: 96,
    sku: 'YEO-SHRT-VBCK',
    status: 'active',
  },
  {
    id: 'prod-6',
    title: "Children's Scavenger Hunt | Toddler Activities & Interactive Card Games",
    category: 'Toys & Games',
    cost: 10.39,
    sell: 12.99,
    profit: 2.60,
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=500&q=80',
    stock: 65,
    sku: 'TOY-SCAV-HUNT',
    status: 'active',
  },
  {
    id: 'prod-7',
    title: 'YudouTech Bean Bag Chair Cover Without Filler, Round Soft Microfiber Lounger',
    category: 'Home & Kitchen',
    cost: 43.81,
    sell: 55.20,
    profit: 11.39,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&q=80',
    stock: 19,
    sku: 'YD-BEAN-BAGCVR',
    status: 'active',
  },
  {
    id: 'prod-8',
    title: 'Aoxun 14pcs Patio Cushion Covers Replacement, Waterproof Outdoor Furniture',
    category: 'Home & Kitchen',
    cost: 86.22,
    sell: 109.99,
    profit: 23.77,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&q=80',
    stock: 14,
    sku: 'AOX-PAT-CSH14',
    status: 'active',
  },
  {
    id: 'prod-9',
    title: 'Furinno JUST Side Table, 3-Tier End Table, Open Shelves Night Stand Storage',
    category: 'Home & Kitchen',
    cost: 11.95,
    sell: 14.94,
    profit: 2.99,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=500&q=80',
    stock: 58,
    sku: 'FUR-ST-3TIER',
    status: 'active',
  },
  {
    id: 'prod-10',
    title: 'PetSafe Wireless Pet Containment System - Electric Underground Boundary Kit',
    category: 'Pet Supplies',
    cost: 128.81,
    sell: 166.46,
    profit: 37.65,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80',
    stock: 11,
    sku: 'PS-PET-SYSWIR',
    status: 'active',
  },
  {
    id: 'prod-11',
    title: 'Plant Stand Indoor with Grow Lights - 62" Tall Plant Shelf, Lighted Corner Stand',
    category: 'Home & Kitchen',
    cost: 54.82,
    sell: 69.29,
    profit: 14.47,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=500&q=80',
    stock: 28,
    sku: 'PLT-STND-62LT',
    status: 'active',
  },
  {
    id: 'prod-12',
    title: 'Feandrea Litter Box Enclosure for 2 Cats, Hidden Furniture with Storage Divider',
    category: 'Pet Supplies',
    cost: 116.51,
    sell: 149.99,
    profit: 33.48,
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80',
    stock: 16,
    sku: 'FEA-LTR-ENC2C',
    status: 'active',
  },
  {
    id: 'prod-13',
    title: 'RMF-TX500U Voice Replace Remote Applicable for Sony Bravia Smart LED TV',
    category: 'Remotes',
    cost: 9.80,
    sell: 14.99,
    profit: 5.19,
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=500&q=80',
    stock: 120,
    sku: 'RMT-SNY-TX500',
    status: 'active',
  },
  {
    id: 'prod-14',
    title: 'FROGG TOGGS Chilly Pad, Instant Cooling Towel, Long Lasting Physical Relief',
    category: 'Sports & Outdoors',
    cost: 8.40,
    sell: 12.99,
    profit: 4.59,
    image: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=500&q=80',
    stock: 75,
    sku: 'FT-COOL-TWL01',
    status: 'active',
  },
  {
    id: 'prod-15',
    title: 'Yaheetech 3 Piece Patio Rattan Bistro Set, Outdoor All Weather PE Wicker Furniture',
    category: 'Home & Kitchen',
    cost: 112.30,
    sell: 145.00,
    profit: 32.70,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80',
    stock: 8,
    sku: 'YAH-BST-3PCRAT',
    status: 'active',
  },
  {
    id: 'prod-16',
    title: 'Apple iPad 10.9-inch Liquid Retina Display, 64GB Wi-Fi, 10th Generation',
    category: 'Tablets',
    cost: 279.00,
    sell: 349.00,
    profit: 70.00,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=500&q=80',
    stock: 24,
    sku: 'APL-IPD-109SL',
    status: 'active',
  },
  {
    id: 'prod-17',
    title: 'Logitech MX Master 3S Wireless Performance Mouse, Quiet Clicks, 8K DPI',
    category: 'Keyboards & Mice',
    cost: 69.50,
    sell: 99.99,
    profit: 30.49,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80',
    stock: 60,
    sku: 'LOG-MXM-3SBLK',
    status: 'active',
  },
  {
    id: 'prod-18',
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
    category: 'Headphones & Audio',
    cost: 265.00,
    sell: 348.00,
    profit: 83.00,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
    stock: 32,
    sku: 'SNY-WH1000-XM5',
    status: 'active',
  },
  {
    id: 'prod-19',
    title: 'Lululemon Everywhere Crossbody Belt Bag 1L, Water-Repellent Fabric Pocket',
    category: 'Bags',
    cost: 24.50,
    sell: 38.00,
    profit: 13.50,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80',
    stock: 88,
    sku: 'LLM-BLT-BAG01',
    status: 'active',
  },
  {
    id: 'prod-20',
    title: 'Stanley Quencher H2.0 FlowState Vacuum Insulated Stainless Steel Tumbler 40oz',
    category: 'Home & Kitchen',
    cost: 29.00,
    sell: 45.00,
    profit: 16.00,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=80',
    stock: 110,
    sku: 'STN-QCH-40OZE',
    status: 'active',
  },
  {
    id: 'prod-21',
    title: 'Anker 737 Power Bank (PowerCore 24K), 140W 3-Port Portable Charger Display',
    category: 'Mobiles & Accessories',
    cost: 84.00,
    sell: 109.99,
    profit: 25.99,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=500&q=80',
    stock: 45,
    sku: 'ANK-PWR-73724',
    status: 'active',
  },
  {
    id: 'prod-22',
    title: "Under Armour Men's Tech 2.0 Short-Sleeve Athletic Training Shirt Quick Dry",
    category: 'Clothes',
    cost: 14.80,
    sell: 25.00,
    profit: 10.20,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80',
    stock: 95,
    sku: 'UAR-TECH-TSH01',
    status: 'active',
  },
  {
    id: 'prod-23',
    title: 'ASUS Vivobook 16 OLED Laptop, Intel Core i7, 16GB RAM, 512GB SSD Display',
    category: 'Laptops',
    cost: 549.00,
    sell: 699.00,
    profit: 150.00,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80',
    stock: 18,
    sku: 'ASU-VVO-16OLED',
    status: 'active',
  },
  {
    id: 'prod-24',
    title: 'CeraVe Moisturizing Cream for Normal to Dry Skin, Daily Body & Face Lotion',
    category: 'Beauty & Personal Care',
    cost: 11.20,
    sell: 17.99,
    profit: 6.79,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80',
    stock: 150,
    sku: 'CRV-MST-CRM16',
    status: 'active',
  },
]

export const initialProducts: Product[] = []

export const initialOrders: Order[] = []

export const initialNotifications: NotificationItem[] = []

export const initialSellerProfile: SellerProfile = {
  shopName: 'tester',
  ownerName: 'zain',
  email: 'zain55@gmail.com',
  phone: '+1 (555) 234-5678',
  currency: 'USD ($)',
  balance: 0.35,
  guarantee: 0.00,
  rating: 5.0,
  totalOrders: 0,
  memberSince: 'Aug 2026',
  verified: true,
  active: true,
  isSuspended: false,
  withdrawalsBlocked: false,
  allowProductRemoval: true,
  productLimit: 'unlimited',
  activeItemsCount: 504,
  reviewCount: 504,
  lastActiveAgo: '2d ago',
  joinedExact: '7 Aug 2026',
  viewsBooster: {
    enabled: false,
    multiplier: 1.0,
    extraDailyViews: 0,
  },
  seoTitle: 'tester Official Store',
  seoDescription: 'Shop top quality products from tester.',
  avatarLetter: 'T',
  payoutMethods: [],
}

export const defaultCustomerProfile: CustomerProfile = {
  name: '',
  username: '',
  email: '',
  phone: '',
  avatarLetter: 'U',
  role: 'Customer account',
  addresses: [],
  notifications: {
    emailAlerts: true,
    orderUpdates: true,
    promotions: false,
    inAppAlerts: true,
  },
}


