'use client'

import React from 'react'

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark'
  showText?: boolean
  className?: string
  onClick?: () => void
}

export function BrandLogo({
  size = 'md',
  variant = 'dark',
  showText = true,
  className = '',
  onClick,
}: BrandLogoProps) {
  // Dimensions
  const iconSizes = {
    sm: { w: 26, h: 24 },
    md: { w: 32, h: 29 },
    lg: { w: 40, h: 36 },
    xl: { w: 48, h: 44 },
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  const { w, h } = iconSizes[size]
  const isLight = variant === 'light'

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Exact Shopping Cart with Orange "U" Swoop Vector */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 38 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:scale-105"
      >
        {/* Shopping Cart Body & Handle */}
        <path
          d="M2.5 3.5H7.5L10.8 20.2C11.1 21.3 12.1 22 13.2 22H28.8C29.8 22 30.8 21.2 31.0 20.2L34.5 8H8.8"
          stroke={isLight ? '#FFFFFF' : '#1E3A8A'}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Orange "U" Swoosh / Smile Inside Basket */}
        <path
          d="M13.5 9.5C13.5 16 16.5 19 21.5 19C26.5 19 29.5 16 29.5 9.5"
          stroke="#F97316"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cart Wheels */}
        <circle cx="14.5" cy="29" r="2.8" fill={isLight ? '#FFFFFF' : '#1E3A8A'} />
        <circle cx="28" cy="29" r="2.8" fill={isLight ? '#FFFFFF' : '#1E3A8A'} />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <span className={`font-black tracking-tight leading-none flex items-center gap-1.5 ${textSizes[size]}`}>
          <span className={isLight ? 'text-white' : 'text-slate-900'}>U Seller</span>
          <span className="text-[#0F52BA]">Store</span>
        </span>
      )}
    </div>
  )
}
