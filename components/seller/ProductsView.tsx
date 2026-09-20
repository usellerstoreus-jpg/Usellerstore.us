'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Edit,
  TrendingUp,
  Package,
  Check,
  X,
  ExternalLink,
  Layers,
  Lock,
  ShieldAlert,
  AlertCircle,
  Boxes,
  Upload,
  CheckCircle2
} from 'lucide-react'
import { Product, masterCatalogProducts } from '@/lib/mock-data'
import { fetchProducts } from '@/lib/supabase/api'
import { ProductImageUploader } from './ProductImageUploader'

interface ProductsViewProps {
  products: Product[]
  maxSlots?: number | 'unlimited'
  isVerified?: boolean
  onRequireKyc?: () => void
  onAddProduct: (product: Omit<Product, 'id'>) => void
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onToast: (msg: string) => void
}

export function ProductsView({
  products,
  maxSlots = 'unlimited',
  isVerified = true,
  onRequireKyc,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToast,
}: ProductsViewProps) {
  const isUnlimited = maxSlots === 'unlimited' || maxSlots === undefined
  const numericLimit = typeof maxSlots === 'number' ? maxSlots : null
  const isLimitReached = numericLimit !== null && products.length >= numericLimit
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for adding/editing product
  const [formData, setFormData] = useState<{
    title: string
    category: string
    cost: number
    sell: number
    image: string
    stock: number
    sku: string
    status: Product['status']
  }>({
    title: '',
    category: 'Home & Kitchen',
    cost: 25.0,
    sell: 39.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
    stock: 50,
    sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
    status: 'active',
  })

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => set.add(p.category))
    return ['All', ...Array.from(set)]
  }, [products])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Tab within the Add/Upload modal: 'catalog' | 'custom'
  const [addModalTab, setAddModalTab] = useState<'catalog' | 'custom'>('catalog')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [catalogCategory, setCatalogCategory] = useState('All')
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>(masterCatalogProducts)

  // Merge any live database products with the master catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const supaProds = await fetchProducts()
        if (supaProds && supaProds.length > 0) {
          const existingIds = new Set(supaProds.map((p) => p.id))
          const existingTitles = new Set(supaProds.map((p) => p.title.toLowerCase()))
          const extras = masterCatalogProducts.filter(
            (m) => !existingIds.has(m.id) && !existingTitles.has(m.title.toLowerCase())
          )
          setAllCatalogProducts([...supaProds, ...extras])
        }
      } catch {}
    }
    loadCatalog()
  }, [])

  // Catalog filtered items
  const filteredCatalog = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      const q = catalogSearchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      const matchesCat = catalogCategory === 'All' || p.category === catalogCategory
      return matchesSearch && matchesCat
    })
  }, [allCatalogProducts, catalogSearchQuery, catalogCategory])

  const catalogCategories = useMemo(() => {
    const set = new Set<string>()
    allCatalogProducts.forEach((p) => set.add(p.category))
    return ['All', ...Array.from(set)]
  }, [allCatalogProducts])

  const isProductInStore = (item: Product) => {
    return products.some(
      (p) =>
        p.id === item.id ||
        (item.sku && p.sku?.toLowerCase() === item.sku.toLowerCase()) ||
        p.title.toLowerCase() === item.title.toLowerCase()
    )
  }

  // Count unadded products in currently filtered catalog
  const unaddedInCatalog = useMemo(() => {
    const existingTitles = new Set(products.map((p) => p.title.toLowerCase()))
    const existingSkus = new Set(products.map((p) => p.sku?.toLowerCase()).filter(Boolean))
    return filteredCatalog.filter(
      (item) => !existingTitles.has(item.title.toLowerCase()) && !(item.sku && existingSkus.has(item.sku.toLowerCase()))
    )
  }, [filteredCatalog, products])

  const handleUploadFromCatalog = (item: Product) => {
    if (isLimitReached) {
      onToast(`⚠️ Upload Limit Reached: Administrator has set your store upload limit to ${numericLimit} products. Only an admin can increase this limit.`)
      return
    }
    if (isProductInStore(item)) {
      onToast(`"${item.title.slice(0, 30)}..." is already in your store.`)
      return
    }

    onAddProduct({
      title: item.title,
      category: item.category,
      cost: item.cost,
      sell: item.sell,
      profit: item.profit || parseFloat((item.sell - item.cost).toFixed(2)),
      image: item.image,
      stock: item.stock || 50,
      sku: item.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      status: 'active',
    })
    setSelectedCategory('All')
    setSearchQuery('')
    onToast(`✓ "${item.title.slice(0, 35)}..." uploaded to your store!`)
  }

  const handleBulkUploadVisible = () => {
    if (isLimitReached) {
      onToast(`⚠️ Upload Limit Reached: Store is at maximum capacity (${products.length}/${numericLimit} slots).`)
      return
    }
    if (unaddedInCatalog.length === 0) {
      onToast('All displayed products are already uploaded in your store.')
      return
    }

    const availableSlots = numericLimit !== null ? Math.max(0, numericLimit - products.length) : unaddedInCatalog.length
    const toUpload = unaddedInCatalog.slice(0, availableSlots)
    if (toUpload.length === 0) {
      onToast(`⚠️ Upload Limit Reached: Store is at ${products.length}/${numericLimit} slots.`)
      return
    }

    toUpload.forEach((item) => {
      onAddProduct({
        title: item.title,
        category: item.category,
        cost: item.cost,
        sell: item.sell,
        profit: item.profit || parseFloat((item.sell - item.cost).toFixed(2)),
        image: item.image,
        stock: item.stock || 50,
        sku: item.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        status: 'active',
      })
    })
    setSelectedCategory('All')
    setSearchQuery('')
    onToast(`✓ Successfully uploaded ${toUpload.length} products to your store!`)
  }

  const openAddModal = () => {
    if (isVerified === false) {
      onToast('⚠️ Verification Required: Your store is in View-Only mode until KYC is approved.')
      if (onRequireKyc) onRequireKyc()
      return
    }
    if (isLimitReached) {
      onToast(`⚠️ Upload Limit Reached: Administrator has set your store upload limit to ${numericLimit} products. Only an admin can increase this limit.`)
      return
    }
    setAddModalTab('catalog')
    setCatalogSearchQuery('')
    setCatalogCategory('All')
    setFormData({
      title: '',
      category: 'Home & Kitchen',
      cost: 29.5,
      sell: 44.99,
      image: '',
      stock: 45,
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      status: 'active',
    })
    setIsAddModalOpen(true)
  }

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLimitReached) {
      onToast(`⚠️ Cannot add product: Your store upload limit of ${numericLimit} products set by Administrator has been reached.`)
      return
    }
    if (!formData.title.trim()) {
      onToast('Please enter a product title')
      return
    }
    const profit = Math.max(0, formData.sell - formData.cost)
    onAddProduct({
      ...formData,
      profit: parseFloat(profit.toFixed(2)),
    })
    setIsAddModalOpen(false)
    onToast('Product added successfully to your store catalog!')
  }

  const handleOpenEdit = (prod: Product) => {
    if (isVerified === false) {
      onToast('⚠️ View-Only Mode: KYC Verification must be approved by Administrator to edit items.')
      if (onRequireKyc) onRequireKyc()
      return
    }
    setSelectedProduct(prod)
    setFormData({
      title: prod.title,
      category: prod.category,
      cost: prod.cost,
      sell: prod.sell,
      image: prod.image,
      stock: prod.stock,
      sku: prod.sku,
      status: prod.status,
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    const profit = Math.max(0, formData.sell - formData.cost)
    onUpdateProduct({
      ...selectedProduct,
      ...formData,
      profit: parseFloat(profit.toFixed(2)),
    })
    setIsEditModalOpen(false)
    setSelectedProduct(null)
    onToast('Product updated successfully!')
  }

  const handleDelete = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isVerified === false) {
      onToast('⚠️ View-Only Mode: Account must be approved by Administrator to delete products.')
      if (onRequireKyc) onRequireKyc()
      return
    }
    setProductToDelete(prod)
  }

  return (
    <div className="products-view-container">
      {/* Top Header */}
      <div className="products-header flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Products</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            <span className="font-semibold text-slate-700">{products.length}</span>{' '}
            {isUnlimited ? (
              <span>products listed <span className="text-emerald-600 font-semibold">(Unlimited quota)</span></span>
            ) : (
              <span>
                of <span className="font-bold text-purple-700">{numericLimit}</span> slots used{' '}
                <span className="text-slate-400 text-xs">(Admin limit)</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isVerified === false && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold uppercase tracking-wider">
              View-Only Mode
            </span>
          )}
          {isLimitReached && (
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Lock size={12} /> Limit Reached ({numericLimit})
            </span>
          )}
          <button
            type="button"
            id="add-products-header-btn"
            className={`add-product-btn flex items-center justify-center gap-2 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all w-full sm:w-auto cursor-pointer ${
              isLimitReached ? 'bg-slate-400 hover:bg-slate-500' : 'bg-[#5e7793] hover:bg-[#4d647e]'
            }`}
            onClick={openAddModal}
            title={isLimitReached ? `Upload limit of ${numericLimit} products reached (Set by Administrator)` : 'Upload products'}
          >
            <Upload size={17} />
            <span>Upload products</span>
          </button>
        </div>
      </div>

      {/* Admin Limit Reached Banner */}
      {isLimitReached && (
        <div className="mb-5 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5 shadow-2xs">
          <ShieldAlert size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Admin Upload Limit Reached ({products.length}/{numericLimit} products)</strong>
            <span className="text-purple-700">
              Only the administrator can configure how many products your store can upload. To list more products, please request a quota increase from the admin.
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="products-toolbar flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-0">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category:</span>
          <select
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-products-state bg-white border border-slate-200 rounded-2xl p-12 text-center my-6 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No products found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
            Browse our wholesale catalog to upload items to your store, or create a custom listing.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            onClick={openAddModal}
          >
            <Upload size={16} /> Browse & Upload Products
          </button>
        </div>
      ) : (
        <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card group relative bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-3 flex gap-3.5 transition-all cursor-pointer items-center"
              onClick={() => handleOpenEdit(product)}
            >
              {/* Product Thumbnail */}
              <div className="product-image-wrap w-24 h-24 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center relative">
                {product.image && product.image.trim() ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // fallback image
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                    <Package size={28} />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="product-info flex-1 min-w-0 pr-1">
                <h3
                  className="text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug mb-1.5"
                  title={product.title}
                >
                  {product.title}
                </h3>

                <div className="flex items-center flex-wrap gap-x-2 text-[11px] font-medium text-slate-600 mt-1">
                  <span>
                    Cost <b className="text-slate-900 font-bold">${product.cost.toFixed(2)}</b>
                  </span>
                  <span>
                    Sell <b className="text-emerald-600 font-bold">${product.sell.toFixed(2)}</b>
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center ml-auto">
                    ↗ +${product.profit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quick Actions overlay on hover */}
              <div className="action-buttons-overlay absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
                <button
                  type="button"
                  className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEdit(product)
                  }}
                  title="Edit Product"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100 cursor-pointer"
                  onClick={(e) => handleDelete(product, e)}
                  title="Delete Product"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload / Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Upload size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight m-0">
                      Upload Products to Store
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {products.length} / {numericLimit !== null ? numericLimit : '∞'} used
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                    Browse all wholesale products available for your store or upload a custom item
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex items-center gap-2 mt-4 pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setAddModalTab('catalog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  addModalTab === 'catalog'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Boxes size={16} />
                <span>Browse All Products ({allCatalogProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('custom')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  addModalTab === 'custom'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus size={16} />
                <span>Custom Product Upload</span>
              </button>
            </div>

            {/* TAB 1: Wholesale Master Catalog */}
            {addModalTab === 'catalog' && (
              <div className="flex-1 flex flex-col min-h-0 pt-3">
                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 mb-3 shrink-0">
                  <div className="relative flex-1 min-w-0">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search catalog by title, SKU, or category..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                      value={catalogSearchQuery}
                      onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                      value={catalogCategory}
                      onChange={(e) => setCatalogCategory(e.target.value)}
                    >
                      {catalogCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'All' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isLimitReached || unaddedInCatalog.length === 0}
                      onClick={handleBulkUploadVisible}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                        isLimitReached || unaddedInCatalog.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      }`}
                      title={
                        isLimitReached
                          ? 'Store limit reached'
                          : unaddedInCatalog.length === 0
                          ? 'All visible items are already added'
                          : `Upload ${unaddedInCatalog.length} unadded items to your store`
                      }
                    >
                      <Upload size={13} />
                      <span>
                        Upload All ({unaddedInCatalog.length})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Products Count Indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1 mb-2 shrink-0">
                  <span>
                    Showing <b className="text-slate-800">{filteredCatalog.length}</b> products available in wholesale catalog
                  </span>
                  <span>
                    <b className="text-emerald-700">{unaddedInCatalog.length}</b> ready to upload
                  </span>
                </div>

                {/* Scrollable Catalog Grid */}
                <div className="flex-1 overflow-y-auto pr-1">
                  {filteredCatalog.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center my-4 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-200/70 text-slate-400 rounded-xl flex items-center justify-center mb-2">
                        <Package size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700">No matching products found</h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1 mb-3">
                        No items match &quot;{catalogSearchQuery}&quot;. You can clear your search or switch to &quot;Custom Product Upload&quot; to add a new one.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearchQuery('')
                          setCatalogCategory('All')
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                      {filteredCatalog.map((item) => {
                        const inStore = isProductInStore(item)
                        const profit = (item.sell - item.cost).toFixed(2)

                        return (
                          <div
                            key={item.id}
                            className={`border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                              inStore
                                ? 'bg-slate-50/70 border-slate-200/70 opacity-80'
                                : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                            }`}
                          >
                            <div>
                              {/* Thumbnail & Category Badge */}
                              <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden mb-2.5 border border-slate-100 flex items-center justify-center">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      ;(e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80'
                                    }}
                                  />
                                ) : (
                                  <Package size={32} className="text-slate-300" />
                                )}
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold tracking-tight">
                                  {item.category}
                                </span>
                                {item.sku && (
                                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/90 text-slate-700 text-[9px] font-mono font-bold shadow-2xs">
                                    {item.sku}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4
                                className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug mb-2"
                                title={item.title}
                              >
                                {item.title}
                              </h4>

                              {/* Pricing Row */}
                              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 space-y-1 mb-3 text-[11px]">
                                <div className="flex justify-between items-center text-slate-500">
                                  <span>Wholesale Cost:</span>
                                  <b className="text-slate-800 font-bold">${item.cost.toFixed(2)}</b>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                  <span>Selling Price:</span>
                                  <b className="text-blue-600 font-bold">${item.sell.toFixed(2)}</b>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 font-bold">
                                  <span className="text-emerald-700">Net Profit:</span>
                                  <span className="text-emerald-600 font-extrabold">+${profit}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            {inStore ? (
                              <button
                                type="button"
                                disabled
                                className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                              >
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                <span>Already in Store</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isLimitReached}
                                onClick={() => handleUploadFromCatalog(item)}
                                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                                  isLimitReached
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-98'
                                }`}
                              >
                                <Upload size={13} />
                                <span>Upload to Store</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer close */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center shrink-0 mt-2">
                  <span className="text-xs text-slate-500">
                    Clicking &quot;Upload to Store&quot; instantly adds the product to your live store catalog.
                  </span>
                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Custom Product Upload Form */}
            {addModalTab === 'custom' && (
              <div className="flex-1 overflow-y-auto pt-3 pr-1">
                <form onSubmit={handleSaveNewProduct} className="space-y-3.5 max-w-xl mx-auto">
                  {/* Product Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      PRODUCT TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ergonomic Memory Foam Cushion..."
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* Category & Initial Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        CATEGORY
                      </label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Under Garments">Under Garments</option>
                        <option value="Clothes">Clothes</option>
                        <option value="Women Clothes">Women Clothes</option>
                        <option value="Remotes">Remotes</option>
                        <option value="Women Accessories">Women Accessories</option>
                        <option value="Bags">Bags</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Laptops">Laptops</option>
                        <option value="Tablets">Tablets</option>
                        <option value="Mobiles & Accessories">Mobiles & Accessories</option>
                        <option value="Headphones & Audio">Headphones & Audio</option>
                        <option value="Keyboards & Mice">Keyboards & Mice</option>
                        <option value="Health & Wellness">Health & Wellness</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                        <option value="Toys & Games">Toys & Games</option>
                        <option value="Sports & Outdoors">Sports & Outdoors</option>
                        <option value="Pet Supplies">Pet Supplies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        INITIAL STOCK
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Cost Price & Sell Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        COST PRICE ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        SELL PRICE ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={formData.sell}
                        onChange={(e) => setFormData({ ...formData, sell: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Estimated Profit Banner */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-800">Estimated Profit per Unit:</span>
                    <span className="font-black text-emerald-600 text-sm">
                      +${Math.max(0, (formData.sell || 0) - (formData.cost || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Product Image */}
                  <ProductImageUploader
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    onToast={onToast}
                  />

                  {/* Footer Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors"
                      onClick={() => setIsAddModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Add to Store
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Edit Product</h3>
                  <p className="text-xs text-slate-500">Update pricing, title, or inventory</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Tablets">Tablets</option>
                    <option value="Under Garments">Under Garments</option>
                    <option value="Toys & Games">Toys & Games</option>
                    <option value="Sports & Outdoors">Sports & Outdoors</option>
                    <option value="Pet Supplies">Pet Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stock Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sell Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.sell}
                    onChange={(e) => setFormData({ ...formData, sell: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="font-semibold text-emerald-800">New Calculated Profit:</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  +${Math.max(0, formData.sell - formData.cost).toFixed(2)}
                </span>
              </div>

              <ProductImageUploader
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                onToast={onToast}
              />

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-sm flex items-center gap-1.5 cursor-pointer"
                  onClick={(e) => {
                    handleDelete(selectedProduct, e)
                    setIsEditModalOpen(false)
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm cursor-pointer"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Delete Product Permanently?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Are you sure you want to remove <strong className="text-slate-800">{productToDelete.title}</strong>?
              This will permanently delete this product from the database and catalog.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                onClick={() => {
                  onDeleteProduct(productToDelete.id)
                  setProductToDelete(null)
                  onToast('Product permanently deleted from database')
                }}
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
