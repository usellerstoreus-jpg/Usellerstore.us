export interface Product {
  id: string
  title: string
  category: string
  cost: number
  sell: number
  profit: number
  image: string
  images?: string[]
  description?: string
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
  category?: 'order' | 'store' | 'product' | 'kyc' | 'payout' | 'system' | 'security' | 'seller'
  targetRole?: 'seller' | 'admin' | 'shop' | 'all'
  sellerId?: string
  sellerEmail?: string
  shopName?: string
  productId?: string
  productImage?: string
  productPrice?: number
  promoCode?: string
  badgeText?: string
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
    title: 'PetSafe Wireless Pet Containment System',
    category: 'Electronics',
    cost: 128.81,
    sell: 166.46,
    profit: 37.65,
    originalPrice: 199.99,
    discountPercent: 17,
    rating: 4.5,
    reviewCount: 241,
    image: '/products/petsafe_collar_main.jpg',
    images: [
      '/products/petsafe_kit_box.jpg',
      '/products/petsafe_dog_yard.jpg',
      '/products/petsafe_wireless_fence.jpg',
      '/products/petsafe_dog_portrait.jpg',
      '/products/petsafe_collar_main.jpg',
    ],
    description: "The PetSafe Wireless Pet Containment System is a reliable, portable pet containment system that uses advanced wireless fence technology to create a secure, invisible boundary perimeter without digging. The circular boundary can be adjusted to cover up to 1/2 of an acre, offering a flexible and accurate wireless fence solution that sets up in just 1~2 hours. Simply plug the training transmitter in inside, place the included boundary flags, and customize the range to suit your yard or travel destination, perfect for RV trips or vacation homes. The included waterproof receiver collar features a tone-only mode and five adjustable static correction levels, making it easy to tailor the training to your dog's temperament. Static-free reentry further reinforces positive behavior. The collar operates on a replaceable RFA-67 battery, which lasts 1-2 months, and includes a battery status indicator for added convenience. This adjustable collar is intended for dogs at least 6 months old weighing 8lbs+ and fits neck sizes from 6-28 inches. This multi-pet training system supports additional collars, allowing all your pets to enjoy the yard safely. The PetSafe Stay & Play Wireless Fence delivers a reliable, expert-recommended way to keep your pets safe, happy, and free to play.",
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
  {
    id: 'prod-25',
    title: 'Samsung 85 Inch Neo QLED TV',
    category: 'Electronics',
    cost: 5100.00,
    sell: 6469.00,
    originalPrice: 7520.00,
    profit: 1369.00,
    discountPercent: 14,
    rating: 4.8,
    reviewCount: 68,
    image: '/products/samsung_qled_tv.jpg',
    stock: 14,
    sku: 'SAM-QLED-85',
    status: 'active',
  },
  {
    id: 'prod-26',
    title: 'VIPERTEK VTS-880 Mini Stun Gun for Self Defense...',
    category: 'Electronics',
    cost: 6.50,
    sell: 10.99,
    profit: 4.49,
    rating: 4.5,
    reviewCount: 113,
    image: '/products/vipertek_stun_gun.jpg',
    stock: 92,
    sku: 'VIP-STUN-880',
    status: 'active',
  },
  {
    id: 'prod-27',
    title: 'SWEETFULL SWEETFULL Portable Handheld Mini Fan with LED...',
    category: 'Electronics',
    cost: 8.00,
    sell: 12.99,
    originalPrice: 15.99,
    discountPercent: 19,
    profit: 4.99,
    rating: 4.2,
    reviewCount: 88,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80',
    stock: 64,
    sku: 'SWT-FAN-LED',
    status: 'active',
  },
  {
    id: 'prod-28',
    title: 'JISULIFE JISULIFE 3 IN 1 Handheld Mini Fan',
    category: 'Electronics',
    cost: 9.10,
    sell: 13.76,
    originalPrice: 16.29,
    discountPercent: 16,
    profit: 4.66,
    rating: 4.5,
    reviewCount: 82,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=500&q=80',
    stock: 80,
    sku: 'JIS-FAN-3IN1',
    status: 'active',
  },
  {
    id: 'prod-29',
    title: 'Universal Wall Mount Storage Organizer for...',
    category: 'Home & Kitchen',
    cost: 7.20,
    sell: 11.99,
    profit: 4.79,
    rating: 4.2,
    reviewCount: 152,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80',
    stock: 45,
    sku: 'ORG-WALL-MNT',
    status: 'active',
  },
  {
    id: 'prod-30',
    title: 'TONULAX Solar Garden Lights',
    category: 'Home & Kitchen',
    cost: 8.50,
    sell: 13.41,
    originalPrice: 16.99,
    discountPercent: 21,
    profit: 4.91,
    rating: 4.5,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80',
    stock: 110,
    sku: 'TNX-SOL-GARD',
    status: 'active',
  },
  {
    id: 'prod-31',
    title: 'Ring Outdoor Cam Plus',
    category: 'Electronics',
    cost: 68.00,
    sell: 99.99,
    profit: 31.99,
    rating: 4.3,
    reviewCount: 249,
    image: '/products/ring_outdoor_cam.jpg',
    stock: 55,
    sku: 'RNG-CAM-PLUS',
    status: 'active',
  },
  {
    id: 'prod-32',
    title: 'WYZE Bulb Cam Security Camera',
    category: 'Electronics',
    cost: 32.00,
    sell: 49.98,
    profit: 17.98,
    rating: 4.2,
    reviewCount: 90,
    image: '/products/wyze_bulb_cam.jpg',
    stock: 70,
    sku: 'WYZ-BLB-CAM',
    status: 'active',
  },
  {
    id: 'prod-33',
    title: 'Outdoor String Lights Patio LED',
    category: 'Electronics',
    cost: 8.50,
    sell: 14.99,
    originalPrice: 23.99,
    discountPercent: 37,
    profit: 6.49,
    rating: 4.0,
    reviewCount: 1,
    image: '/products/outdoor_string_lights.jpg',
    stock: 130,
    sku: 'STR-LGT-PATIO',
    status: 'active',
  },
  {
    id: 'prod-34',
    title: 'Bionic Flood Light 2 Pk Solar Lights Outdoor Waterproof',
    category: 'Electronics',
    cost: 16.00,
    sell: 26.99,
    originalPrice: 39.95,
    discountPercent: 32,
    profit: 10.99,
    rating: 4.5,
    reviewCount: 233,
    image: '/products/bionic_flood_light.jpg',
    stock: 42,
    sku: 'BNC-FLD-2PK',
    status: 'active',
  },
  {
    id: 'prod-35',
    title: 'GOOTOP Bug Zapper Outdoor',
    category: 'Electronics',
    cost: 21.00,
    sell: 35.99,
    originalPrice: 59.99,
    discountPercent: 40,
    profit: 14.99,
    rating: 4.7,
    reviewCount: 295,
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80',
    stock: 38,
    sku: 'GTP-BUG-ZAP',
    status: 'active',
  },
  {
    id: 'prod-36',
    title: 'Bell+Howell Bionic Spotlight Motion Solar Spot Lights...',
    category: 'Electronics',
    cost: 10.50,
    sell: 17.99,
    profit: 7.49,
    rating: 4.5,
    reviewCount: 242,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80',
    stock: 85,
    sku: 'BLH-BNC-SPOT',
    status: 'active',
  },
]

export const initialProducts: Product[] = masterCatalogProducts

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


