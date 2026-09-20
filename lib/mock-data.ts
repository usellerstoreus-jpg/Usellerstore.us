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


