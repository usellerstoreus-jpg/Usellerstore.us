'use client'

import React, { useState, useMemo } from 'react'
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
  Layers
} from 'lucide-react'
import { Product } from '@/lib/mock-data'
import { ProductImageUploader } from './ProductImageUploader'

interface ProductsViewProps {
  products: Product[]
  maxSlots?: number
  onAddProduct: (product: Omit<Product, 'id'>) => void
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onToast: (msg: string) => void
}

export function ProductsView({
  products,
  maxSlots = 500,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToast,
}: ProductsViewProps) {
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

  const openAddModal = () => {
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
    setProductToDelete(prod)
  }

  return (
    <div className="products-view-container">
      {/* Top Header */}
      <div className="products-header flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Products</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            <span className="font-semibold text-slate-700">{products.length}</span> of {maxSlots} slots used
          </p>
        </div>

        <button
          type="button"
          id="add-products-header-btn"
          className="add-product-btn flex items-center justify-center gap-2 bg-[#5e7793] hover:bg-[#4d647e] text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all w-full sm:w-auto cursor-pointer"
          onClick={openAddModal}
        >
          <Plus size={18} />
          <span>Add products</span>
        </button>
      </div>

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
            Try adjusting your search filter or click the button below to add a new product.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            onClick={openAddModal}
          >
            <Plus size={16} /> Add new product
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Add New Product</h3>
                  <p className="text-xs text-slate-500">Add a product to your seller catalog</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Memory Foam Cushion..."
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
                    Initial Stock
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

              {/* Profit preview banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="font-semibold text-emerald-800">Estimated Profit per Unit:</span>
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
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Add to Store
                </button>
              </div>
            </form>
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
