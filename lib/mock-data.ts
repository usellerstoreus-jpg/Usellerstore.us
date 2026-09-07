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
  }[]
  totalAmount: number
  profit: number
  status: 'unpaid' | 'paid' | 'pickup' | 'on_the_way' | 'out_for_delivery' | 'delivered' | 'cancelled'
  date: string
  shippingAddress: string
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

export interface SellerProfile {
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
}

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Superfeet All-Purpose Support Medium Arch Insoles (Blue) for Activ...',
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
    title: '11 inch 2 in 1 Tablet, 20GB + 128GB, Android 16 Tablet with Case, 1TB...',
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
    title: 'Dorlicecass Irregular Wall Mirror - Wall Mirrors Decorative 22"x 36"...',
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
    title: 'bmani Ear Buds Wireless Earbuds Bluetooth Headphones with 80H...',
    category: 'Electronics',
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
    title: 'YEOREO Workout Scrunch Shorts Women V Back Gym Butt Lifting Liz...',
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
    title: "Children's Scavenger Hunt | Toddler Activities | Games for 2, 3 Year Old's...",
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
    title: 'YudouTech (No Filler Bean Bag Chair Cover Without Filler,Big Round Soft...',
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
    title: 'Aoxun 14pcs Patio Cushion Covers Replacement, Waterproof Outdoor...',
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
    title: 'Furinno JUST Side Table, 3-Tier End Table, Open Shelves Night Stand,...',
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
    title: 'PetSafe Wireless Pet Containment System - Original Wireless Electric...',
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
    title: 'Plant Stand Indoor with Grow Lights - 62" Tall Plant Shelf, Lighted Corner...',
    category: 'Home & Garden',
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
    title: 'Feandrea Litter Box Enclosure for 2 Cats, Hidden Litter Box Furniture wit...',
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
    title: 'RMF-TX500U Voice Replace Remote Applicable for Sony Bravia TV KD-...',
    category: 'Electronics',
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
    title: 'FROGG TOGGS Chilly Pad, Instant Cooling Towel, Long Lasting...',
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
    title: 'Yaheetech 3 Piece Patio Rattan Bistro Set, Outdoor All Weather PE Wicker...',
    category: 'Home & Kitchen',
    cost: 112.30,
    sell: 145.00,
    profit: 32.70,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80',
    stock: 8,
    sku: 'YAH-BST-3PCRAT',
    status: 'active',
  }
]

export const initialOrders: Order[] = []

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'KYC approved',
    description: "Your identity has been verified. You're all set.",
    date: '7 AUGUST 2026',
    timeAgo: '7 Aug',
    refCode: '#6bc54j84',
    type: 'kyc',
    read: true,
    details: 'Your identity document (Passport / ID) submitted for store "tester" was reviewed and approved by the compliance team. You now have full seller privileges including withdrawals.'
  }
]

export const initialSellerProfile: SellerProfile = {
  shopName: 'tester',
  ownerName: 'Zain',
  email: 'zain55@gmail.com',
  phone: '+1 (555) 234-5678',
  currency: 'USD ($)',
  balance: 0.00,
  guarantee: 0.00,
  rating: 5.0,
  totalOrders: 0,
  memberSince: 'Aug 2026',
  verified: true,
  active: true,
  seoTitle: 'tester Official Store - Premium Products & Quick Delivery',
  seoDescription: 'Shop top quality electronics, home goods, wellness and outdoor essentials from tester.',
  avatarLetter: 'Z',
  payoutMethods: [
    {
      type: 'bank',
      bankName: 'Chase Bank USA',
      accountNumber: '•••• •••• 8842',
      accountHolder: 'Zain',
    }
  ]
}
