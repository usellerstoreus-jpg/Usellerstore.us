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

export const defaultCustomerProfile: CustomerProfile = {
  name: 'Emily Davis',
  username: 'usellerstore_customer',
  email: 'usellerstore.us@gmail.com',
  phone: '+1 (555) 482-9912',
  avatarLetter: 'U',
  role: 'Customer account',
  addresses: [
    {
      id: 'addr-1',
      title: 'Home Address (Default)',
      street: '452 Broadway Ave, Suite 4B',
      city: 'New York',
      state: 'NY',
      zip: '10013',
      country: 'United States',
      isDefault: true,
    },
    {
      id: 'addr-2',
      title: 'Office / Business',
      street: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      country: 'United States',
      isDefault: false,
    },
  ],
  notifications: {
    emailAlerts: true,
    orderUpdates: true,
    promotions: false,
    inAppAlerts: true,
  },
}

