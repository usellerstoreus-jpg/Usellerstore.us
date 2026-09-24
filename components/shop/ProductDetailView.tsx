'use client'

import React, { useState, useMemo } from 'react'
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  Lock,
  CheckCircle2,
  Minus,
  Plus,
  ArrowRight,
  Store,
  Home as HomeIcon,
  ChevronRight,
  Package,
} from 'lucide-react'
import { Product } from '@/lib/mock-data'
import { BrandLogo } from '@/components/ui/BrandLogo'

export interface ProductDetailViewProps {
  product: Product
  allProducts: Product[]
  onBackToShop: () => void
  onNavigateHome: () => void
  onSelectCategory: (category: string) => void
  onSelectProduct: (product: Product) => void
  onAddToCart: (product: Product, quantity: number, e?: React.MouseEvent) => void
  onBuyNow: (product: Product, quantity: number) => void
  wishlist: string[]
  onToggleWishlist: (productId: string, e?: React.MouseEvent) => void
  onToast: (msg: string) => void
  onSwitchToSeller?: () => void
  onOpenCart?: () => void
  onOpenLogin?: () => void
  onOpenSignUp?: () => void
  onTrackOrder?: () => void
}

interface ReviewItem {
  id: string
  name: string
  date: string
  rating: number
  comment: string
  avatarBg: string
  avatarEmoji: string
}

const mockCustomerReviews: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Evelyn Reyes',
    date: '24/04/2026',
    rating: 5,
    comment: 'Customer support was super responsive when I had a sizing question.',
    avatarBg: 'bg-amber-100 text-amber-800',
    avatarEmoji: '👩🏾',
  },
  {
    id: 'rev-2',
    name: 'Jack Walker',
    date: '24/04/2026',
    rating: 5,
    comment: "Doesn't feel flimsy at all. You can tell some thought went into the design.",
    avatarBg: 'bg-blue-100 text-blue-800',
    avatarEmoji: '🧔🏿',
  },
  {
    id: 'rev-3',
    name: 'Ella Hernandez',
    date: '24/04/2026',
    rating: 5,
    comment: 'Switched from a name-brand version and honestly cannot tell the difference.',
    avatarBg: 'bg-rose-100 text-rose-800',
    avatarEmoji: '👩🏼',
  },
  {
    id: 'rev-4',
    name: 'Ava Thompson',
    date: '24/04/2026',
    rating: 5,
    comment: "Bought this on a whim and it's now my favorite purchase of the month.",
    avatarBg: 'bg-emerald-100 text-emerald-800',
    avatarEmoji: '👩🏻',
  },
]

export function ProductDetailView({
  product,
  allProducts,
  onBackToShop,
  onNavigateHome,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist,
  onToggleWishlist,
  onToast,
  onSwitchToSeller,
  onOpenCart,
  onOpenLogin,
  onOpenSignUp,
  onTrackOrder,
}: ProductDetailViewProps) {
  // Gallery Images List: if product has `images`, use them; otherwise create 5 realistic variants
  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images
    }
    // Fallback images if none specified
    const baseImg = product.image || '/products/petsafe_collar_main.jpg'
    return [
      baseImg,
      '/products/petsafe_kit_box.jpg',
      '/products/petsafe_dog_yard.jpg',
      '/products/petsafe_wireless_fence.jpg',
      '/products/petsafe_dog_portrait.jpg',
    ]
  }, [product])

  // Selected image index - default to last item (or 0) so the main photo matches
  const [selectedImageIndex, setSelectedImageIndex] = useState(
    galleryImages.length > 1 ? galleryImages.length - 1 : 0
  )
  const [quantity, setQuantity] = useState(1)
  const [isFullTitle, setIsFullTitle] = useState(false)
  const [isReadMore, setIsReadMore] = useState(false)

  // Reset image and quantity when viewing another product
  React.useEffect(() => {
    setSelectedImageIndex(galleryImages.length > 1 ? galleryImages.length - 1 : 0)
    setQuantity(1)
    setIsFullTitle(false)
    setIsReadMore(false)
  }, [product.id, galleryImages])

  const isWishlisted = wishlist.includes(product.id)
  const currentImage = galleryImages[selectedImageIndex] || product.image

  const originalPrice =
    product.originalPrice ||
    (product.discountPercent
      ? Number((Number(product.sell) / (1 - product.discountPercent / 100)).toFixed(2))
      : 199.99)

  const discountPercent =
    product.discountPercent ||
    (originalPrice > Number(product.sell)
      ? Math.round(((originalPrice - Number(product.sell)) / originalPrice) * 100)
      : 17)

  const rating = product.rating || 4.5
  const reviewCount = product.reviewCount || 241

  const defaultDescription =
    "The PetSafe Wireless Pet Containment System is a reliable, portable pet containment system that uses advanced wireless fence technology to create a secure, invisible boundary perimeter without digging. The circular boundary can be adjusted to cover up to 1/2 of an acre, offering a flexible and accurate wireless fence solution that sets up in just 1~2 hours. Simply plug the training transmitter in inside, place the included boundary flags, and customize the range to suit your yard or travel destination, perfect for RV trips or vacation homes. The included waterproof receiver collar features a tone-only mode and five adjustable static correction levels, making it easy to tailor the training to your dog's temperament. Static-free reentry further reinforces positive behavior. The collar operates on a replaceable RFA-67 battery, which lasts 1-2 months, and includes a battery status indicator for added convenience. This adjustable collar is intended for dogs at least 6 months old weighing 8lbs+ and fits neck sizes from 6-28 inches. This multi-pet training system supports additional collars, allowing all your pets to enjoy the yard safely. The PetSafe Stay & Play Wireless Fence delivers a reliable, expert-recommended way to keep your pets safe, happy, and free to play."

  const descriptionText = product.description || defaultDescription

  // Related products from the same category or catalog, excluding current product
  const relatedProducts = useMemo(() => {
    const list = allProducts.filter((p) => p.id !== product.id)
    // Put same category items first
    const sameCat = list.filter(
      (p) => p.category.toLowerCase() === product.category.toLowerCase()
    )
    const otherCat = list.filter(
      (p) => p.category.toLowerCase() !== product.category.toLowerCase()
    )
    return [...sameCat, ...otherCat].slice(0, 12)
  }, [allProducts, product])

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      try {
        navigator.clipboard.writeText(window.location.href)
        onToast('Product link copied to clipboard!')
      } catch {
        onToast('Sharing: ' + product.title)
      }
    }
  }

  return (
    <div className="w-full flex-1 bg-white text-slate-900 flex flex-col pb-12">
      {/* 1. BREADCRUMBS ROW (Matching Screenshot 1) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3 w-full">
        <nav
          className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <HomeIcon size={14} className="text-slate-400" />
            <span>Home</span>
          </button>
          <ChevronRight size={13} className="text-slate-400" />
          <button
            type="button"
            onClick={onBackToShop}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Shop
          </button>
          <ChevronRight size={13} className="text-slate-400" />
          <button
            type="button"
            onClick={() => onSelectCategory(product.category)}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {product.title}
          </span>
        </nav>
      </div>

      {/* 2. MAIN PRODUCT HERO SECTION (Matching Screenshot 1) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Large High-Res Featured Image */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#F8FAFC] rounded-3xl border border-slate-200/90 overflow-hidden flex items-center justify-center p-3 sm:p-4 aspect-square shadow-xs relative group">
              <img
                src={currentImage}
                alt={product.title}
                className="w-full h-full object-contain rounded-2xl transition-all duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Title, Pricing, Actions, & MORE VIEWS (Matching Screenshot 1) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Title & Share Button */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h1
                  className={`text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight ${
                    !isFullTitle ? 'line-clamp-2' : ''
                  }`}
                >
                  {product.title}
                </h1>
                <button
                  type="button"
                  id="product-show-full-title-btn"
                  onClick={() => setIsFullTitle(!isFullTitle)}
                  className="text-xs text-slate-600 hover:text-blue-600 font-medium cursor-pointer transition-colors block"
                >
                  {isFullTitle ? 'Show short title' : 'Show full title'}
                </button>
              </div>

              {/* Share Circular Button */}
              <button
                type="button"
                id="product-share-btn"
                onClick={handleShare}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Share this product"
                aria-label="Share product"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Rating Stars & Review Count */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    size={16}
                    className="fill-amber-400 stroke-amber-400 text-amber-500"
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                {Number(rating).toFixed(1)} ({reviewCount} reviews)
              </span>
            </div>

            {/* Price Row: Bold Price, Strikethrough, Discount Pill */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                ${Number(product.sell).toFixed(2)}
              </span>
              {originalPrice > Number(product.sell) && (
                <span className="text-base sm:text-lg text-slate-400 line-through font-normal">
                  ${Number(originalPrice).toFixed(2)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="bg-[#FEF3C7] text-[#92400E] text-xs font-black px-2 py-0.5 rounded-md">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* In Stock Badge */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <Check size={16} strokeWidth={2.5} />
              <span>In stock</span>
            </div>

            {/* Actions Row: Quantity [- 1 +], Add to Cart, Wishlist Heart */}
            <div className="flex items-center gap-3 pt-1">
              {/* Quantity Selector [- 1 +] */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white h-12 px-2 shadow-2xs">
                <button
                  type="button"
                  id="product-qty-minus-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="px-4 text-sm font-extrabold text-slate-900 min-w-[28px] text-center select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  id="product-qty-plus-btn"
                  onClick={() => setQuantity((q) => Math.min(Number(product.stock) || 99, q + 1))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Navy Blue "Add to Cart" Button */}
              <button
                type="button"
                id="product-detail-add-to-cart-btn"
                onClick={(e) => onAddToCart(product, quantity, e)}
                className="flex-1 h-12 px-6 bg-[#1E4E79] hover:bg-[#163c5e] active:scale-[0.99] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                id="product-detail-wishlist-btn"
                onClick={(e) => onToggleWishlist(product.id, e)}
                className="h-12 w-12 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer shrink-0"
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label="Wishlist"
              >
                <Heart
                  size={19}
                  className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''}
                />
              </button>
            </div>

            {/* "Buy Now" Full-Width Button */}
            <div>
              <button
                type="button"
                id="product-detail-buy-now-btn"
                onClick={() => onBuyNow(product, quantity)}
                className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                Buy Now
              </button>
            </div>

            {/* MORE VIEWS Thumbnail Gallery (Matching Screenshot 1) */}
            <div className="pt-3 space-y-2.5">
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                MORE VIEWS
              </span>
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = selectedImageIndex === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      id={`gallery-thumb-${idx}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-2xs ${
                        isActive
                          ? 'border-2 border-blue-600 ring-2 ring-blue-500/25 scale-102'
                          : 'border border-slate-200/90 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                      title={`View photo ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.title} - View ${idx + 1}`}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. PRODUCT DETAILS SECTION (Matching Screenshot 2) */}
        <section className="mt-14 pt-8 border-t border-slate-100 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Product Details
          </h2>
          <div className="relative">
            <p
              className={`text-xs sm:text-sm text-slate-600 leading-relaxed max-w-5xl ${
                !isReadMore ? 'line-clamp-4' : ''
              }`}
            >
              {descriptionText}
            </p>
            <button
              type="button"
              id="product-read-more-btn"
              onClick={() => setIsReadMore(!isReadMore)}
              className="mt-2 text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isReadMore ? 'Read less' : 'Read more'}</span>
              {isReadMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </section>

        {/* 4. CUSTOMER REVIEWS SECTION (Matching Screenshot 2) */}
        <section className="mt-12 pt-8 border-t border-slate-100 space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Reviews
          </h2>

          <div className="space-y-3.5 max-w-5xl">
            {mockCustomerReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Header: Avatar, Name & Date on left; 5 Gold Stars on right */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 select-none ${rev.avatarBg}`}
                    >
                      {rev.avatarEmoji}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {rev.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {rev.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={14}
                        className="fill-amber-400 stroke-amber-400 text-amber-500"
                      />
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-slate-700 mt-3 font-normal leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. RELATED PRODUCTS SECTION (Matching Screenshot 3) */}
        <section className="mt-14 pt-8 border-t border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Related Products
            </h2>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All in Catalog</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {relatedProducts.map((relProd) => {
              const isRelWish = wishlist.includes(relProd.id)
              const relDiscount =
                relProd.discountPercent ||
                (relProd.originalPrice
                  ? Math.round(
                      ((relProd.originalPrice - Number(relProd.sell)) /
                        relProd.originalPrice) *
                        100
                    )
                  : 0)

              return (
                <div
                  key={relProd.id}
                  id={`related-card-${relProd.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-3 flex flex-col justify-between relative"
                >
                  {/* Image & Discount Badge */}
                  <div className="relative mb-2">
                    {relDiscount > 0 && (
                      <span className="absolute top-0.5 left-0.5 z-10 bg-[#E67E22] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                        -{relDiscount}%
                      </span>
                    )}

                    <div
                      className="aspect-square w-full bg-white rounded-xl overflow-hidden flex items-center justify-center cursor-pointer p-1"
                      onClick={() => {
                        onSelectProduct(relProd)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <img
                        src={
                          relProd.image ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
                        }
                        alt={relProd.title}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Heart button */}
                    <button
                      type="button"
                      onClick={(e) => onToggleWishlist(relProd.id, e)}
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/95 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
                      title="Save to wishlist"
                    >
                      <Heart
                        size={13}
                        className={isRelWish ? 'fill-rose-500 text-rose-500' : ''}
                      />
                    </button>
                  </div>

                  {/* Title & Rating */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => {
                          onSelectProduct(relProd)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="font-medium text-slate-800 text-xs hover:text-[#0F52BA] line-clamp-2 leading-relaxed min-h-[34px] cursor-pointer transition-colors"
                        title={relProd.title}
                      >
                        {relProd.title}
                      </h4>

                      <div className="flex items-center gap-1 text-xs mt-1">
                        <Star
                          size={11}
                          className="fill-amber-400 stroke-amber-400 text-amber-500 shrink-0"
                        />
                        <span className="font-bold text-slate-800 text-[11px]">
                          {Number(relProd.rating || 4.5).toFixed(1)}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({relProd.reviewCount || 24})
                        </span>
                      </div>
                    </div>

                    {/* Price & Add to Cart Circular Navy Button */}
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
                        <span className="font-black text-slate-900 text-xs sm:text-sm truncate">
                          ${Number(relProd.sell).toFixed(2)}
                        </span>
                        {relProd.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-normal shrink-0">
                            ${Number(relProd.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        id={`related-cart-btn-${relProd.id}`}
                        onClick={(e) => onAddToCart(relProd, 1, e)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer bg-[#1E3A8A] hover:bg-[#0F52BA] text-white shadow-xs hover:scale-105 active:scale-95"
                        title="Add to cart"
                      >
                        <ShoppingCart size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
