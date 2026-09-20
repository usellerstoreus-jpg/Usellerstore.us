'use client'

import React from 'react'

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark'
  showText?: boolean
  subtitle?: string
  className?: string
  onClick?: () => void
}

export function BrandLogo({
  size = 'md',
  variant = 'dark',
  showText = true,
  subtitle,
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
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }

  const { w, h } = iconSizes[size]
  const isLight = variant === 'light'

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Exact Shopping Cart with Blue Wireframe and Orange Accents */}
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
          stroke={isLight ? '#FFFFFF' : '#2563EB'}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Orange "U" Swoosh / Curve Inside Basket */}
        <path
          d="M14 10C14 15.5 17 18.5 21.5 18.5C26 18.5 29 15.5 29 10"
          stroke="#F97316"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cart Wheels in Vibrant Orange */}
        <circle cx="14.5" cy="28.5" r="3" fill="#F97316" />
        <circle cx="28" cy="28.5" r="3" fill="#F97316" />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-extrabold tracking-tight leading-tight flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className={isLight ? 'text-white' : 'text-slate-900'}>U Seller</span>
            <span className="text-[#2563EB]">Store</span>
          </span>
          {subtitle && (
            <span className={`text-[11px] leading-tight font-normal mt-0.5 ${isLight ? 'text-slate-300' : 'text-slate-400'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
