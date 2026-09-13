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
    id: 'prod-cucumber-trellis',
    title: 'Cucumber Trellis for Raised Bed',
    category: 'Home & Garden',
    cost: 16.50,
    sell: 22.94,
    profit: 6.44,
    originalPrice: 26.99,
    discountPercent: 15,
    rating: 4.8,
    reviewCount: 296,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    stock: 45,
    sku: 'TRL-CUC-RSD',
    status: 'active',
  },
  {
    id: 'prod-move-free-ultra',
    title: 'Move Free Ultra Triple Action Joint Support Supplement',
    category: 'Health & Wellness',
    cost: 18.20,
    sell: 26.49,
    profit: 8.29,
    originalPrice: 32.99,
    discountPercent: 20,
    rating: 4.5,
    reviewCount: 100,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    stock: 60,
    sku: 'MV-FREE-ULTRA',
    status: 'active',
  },
  {
    id: 'prod-rainsmore-tote',
    title: 'RAINSMORE Teacher Tote Bag with Insulated Lunch Compartment',
    category: 'Accessories',
    cost: 22.10,
    sell: 31.99,
    profit: 9.89,
    originalPrice: 35.99,
    discountPercent: 11,
    rating: 4.7,
    reviewCount: 181,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    stock: 38,
    sku: 'RNS-TCH-TOTE',
    status: 'active',
  },
  {
    id: 'prod-petsafe-wireless',
    title: 'PetSafe Wireless Pet Containment System',
    category: 'Pet Supplies',
    cost: 128.81,
    sell: 166.46,
    profit: 37.65,
    originalPrice: 199.99,
    discountPercent: 17,
    rating: 4.5,
    reviewCount: 241,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80',
    stock: 18,
    sku: 'PS-PET-SYSWIR',
    status: 'active',
  },
  {
    id: 'prod-cake-beauty-spray',
    title: 'Cake Beauty Big Wig Dry Texturizing Spray, 5.6 oz',
    category: 'Beauty & Personal Care',
    cost: 7.80,
    sell: 11.49,
    profit: 3.69,
    rating: 4.3,
    reviewCount: 189,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    stock: 82,
    sku: 'CAKE-BIG-WIG',
    status: 'active',
  },
  {
    id: 'prod-klutz-lego-bots',
    title: 'Klutz Lego Gear Bots Science/STEM Activity Kit for Kids',
    category: 'Toys & Games',
    cost: 15.20,
    sell: 22.56,
    profit: 7.36,
    originalPrice: 24.99,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 285,
    image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=600&q=80',
    stock: 50,
    sku: 'KLTZ-LGO-BOTS',
    status: 'active',
  },
  {
    id: 'prod-bathroom-saver-rack',
    title: 'Bathroom 3-Tier Over-the-Toilet Space Saver Shelving Unit',
    category: 'Home & Kitchen',
    cost: 32.00,
    sell: 45.99,
    profit: 13.99,
    originalPrice: 54.00,
    discountPercent: 15,
    rating: 4.6,
    reviewCount: 142,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    stock: 24,
    sku: 'BTH-OVR-TOILET',
    status: 'active',
  },
  {
    id: 'prod-amika-soulfood-mask',
    title: 'amika: Soulfood Nourishing Hair Mask Treatment, 8.5 oz',
    category: 'Beauty & Personal Care',
    cost: 21.50,
    sell: 32.00,
    profit: 10.50,
    rating: 4.7,
    reviewCount: 318,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
    stock: 65,
    sku: 'AMK-SOUL-MASK',
    status: 'active',
  },
  {
    id: 'prod-corner-clamps-90deg',
    title: '90 Degree Right Angle Corner Clamps for Woodworking (4-Pack)',
    category: 'Tools & Home Improvement',
    cost: 11.20,
    sell: 19.99,
    profit: 8.79,
    originalPrice: 34.50,
    discountPercent: 42,
    rating: 4.5,
    reviewCount: 98,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    stock: 40,
    sku: 'CLR-CLMP-90DEG',
    status: 'active',
  },
  {
    id: 'prod-mosquito-incense-240',
    title: 'Plant-Based Mosquito Repellent Incense Sticks (240 Pack)',
    category: 'Home & Garden',
    cost: 9.30,
    sell: 14.99,
    profit: 5.69,
    originalPrice: 18.99,
    discountPercent: 21,
    rating: 4.6,
    reviewCount: 175,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    stock: 110,
    sku: 'MOSQ-RPL-240',
    status: 'active',
  },
  {
    id: 'prod-hebony-keychains',
    title: 'H.ebony 5Pcs Stranger 5 Keychains for Women Men',
    category: 'Accessories',
    cost: 6.80,
    sell: 11.99,
    profit: 5.19,
    originalPrice: 12.99,
    discountPercent: 8,
    rating: 4.9,
    reviewCount: 147,
    image: 'https://images.unsplash.com/photo-1614036417651-efe5912149d8?auto=format&fit=crop&w=600&q=80',
    stock: 88,
    sku: 'HEB-5PC-KEYCH',
    status: 'active',
  },
  {
    id: 'prod-veken-packing-cubes',
    title: 'Veken Veken 8 Set Packing Cubes for Travel Luggage',
    category: 'Travel & Luggage',
    cost: 11.40,
    sell: 17.99,
    profit: 6.59,
    originalPrice: 22.99,
    discountPercent: 22,
    rating: 4.8,
    reviewCount: 145,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    stock: 55,
    sku: 'VKN-8SET-CUBE',
    status: 'active',
  },
  {
    id: 'prod-uekeboag-makeup-bag',
    title: 'uekeboag Large Travel Quilted Makeup Bag for Women',
    category: 'Beauty & Personal Care',
    cost: 8.20,
    sell: 13.59,
    profit: 5.39,
    originalPrice: 15.99,
    discountPercent: 15,
    rating: 4.5,
    reviewCount: 187,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    stock: 70,
    sku: 'UKE-QLT-MKUP',
    status: 'active',
  },
  {
    id: 'prod-vipertek-stun-gun',
    title: 'VIPERTEK VTS-880 Mini Stun Gun for Self Defense Rechargeable',
    category: 'Safety & Security',
    cost: 6.40,
    sell: 10.99,
    profit: 4.59,
    rating: 4.5,
    reviewCount: 113,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    stock: 42,
    sku: 'VIP-VTS880-STN',
    status: 'active',
  },
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
