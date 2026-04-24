'use client';

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface Product {
  name: string;
  price: string;
  unit?: string;
  emoji?: string;
  imageUrl?: string;
  isHero?: boolean;
  savings?: string;
  category?: string;
}

interface MmsTheme {
  primaryColor: string;
  primaryDark: string;
  accentColor: string;
  textOnPrimary: string;
  footerBg: string;
  logoUrl?: string;
  ctaText?: string;
  footerText?: string;
  showBarcode?: boolean;
  showQr?: boolean;
}

interface Props {
  products: Product[];
  headline: string;
  campaignCode: string;
  storeName: string;
  validDates: string;
  theme?: Partial<MmsTheme>;
}

const DEFAULT: MmsTheme = {
  primaryColor: '#DC1F26',
  primaryDark: '#B01820',
  accentColor: '#FFD700',
  textOnPrimary: '#FFFFFF',
  footerBg: '#1a1a2e',
  ctaText: 'SHOW THIS AT CHECKOUT:',
  footerText: 'Powered by Sweepstouch',
  showBarcode: true,
  showQr: true,
};

/** Category-based fallback emoji icons */
const CATEGORY_ICONS: Record<string, string> = {
  meat: '🥩',
  seafood: '🦐',
  produce: '🥬',
  dairy: '🧀',
  bakery: '🍞',
  frozen: '🧊',
  pantry: '🥫',
  beverages: '🥤',
  deli: '🥪',
  other: '🛒',
};

/** Get the best visual for a product: image URL, emoji, or category fallback */
function getProductVisual(p: Product): { type: 'image' | 'emoji'; value: string } {
  if (p.imageUrl && p.imageUrl !== 'no-image.jpg' && p.imageUrl !== '') {
    return { type: 'image', value: p.imageUrl };
  }
  const emoji = p.emoji || CATEGORY_ICONS[p.category || 'other'] || '🛒';
  return { type: 'emoji', value: emoji };
}

export default function MmsPreviewPhone({
  products,
  headline,
  campaignCode,
  storeName,
  validDates,
  theme: rawTheme,
}: Props) {
  const t = useMemo(() => ({ ...DEFAULT, ...rawTheme }), [rawTheme]);
  const heroProduct = useMemo(
    () => products.find((p) => p.isHero) || products[0],
    [products]
  );
  const secondaryProducts = useMemo(
    () => products.filter((p) => p !== heroProduct),
    [products, heroProduct]
  );

  const heroVisual = heroProduct ? getProductVisual(heroProduct) : null;

  return (
    <Box
      sx={{
        mx: 'auto',
        maxWidth: 320,
        borderRadius: '28px',
        overflow: 'hidden',
        border: '8px solid #1a1a2e',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(220,31,38,0.1)',
        background: '#1a1a2e',
      }}
    >
      {/* Phone Notch */}
      <Box
        sx={{
          height: 24,
          background: '#1a1a2e',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: 80, height: 6, borderRadius: 3, background: '#333' }} />
      </Box>

      {/* Content */}
      <Box
        sx={{
          maxHeight: 520,
          overflowY: 'auto',
          background: 'white',
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#ddd', borderRadius: 3 },
        }}
      >
        {/* ─── Header ─────────────────────────── */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${t.primaryColor} 0%, ${t.primaryDark} 100%)`,
            color: t.textOnPrimary,
            textAlign: 'center',
            p: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -30,
              left: -10,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
            },
          }}
        >
          {t.logoUrl && (
            <Box sx={{ mb: 0.5 }}>
              <img
                src={t.logoUrl}
                alt={storeName}
                style={{ maxHeight: 36, maxWidth: 160, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            </Box>
          )}
          <Typography sx={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            ⭐ VIP CUSTOMER SALE ⭐
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.9, mt: 0.3, fontWeight: 500 }}>
            {headline || 'EXCLUSIVE MEMBER PRICING'}
          </Typography>
          <Box
            sx={{
              background: t.accentColor,
              color: '#1a1a1a',
              px: 2,
              py: 0.5,
              mt: 1,
              fontWeight: 800,
              fontSize: 11,
              borderRadius: 1,
              display: 'inline-block',
              boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
            }}
          >
            {validDates}
          </Box>
        </Box>

        {/* ─── Hero Product ───────────────────── */}
        {heroProduct && (
          <Box
            sx={{
              background: `linear-gradient(180deg, ${t.primaryColor} 0%, ${t.primaryDark} 70%, #fff 100%)`,
              textAlign: 'center',
              color: t.textOnPrimary,
              pb: 3,
              pt: 2,
              px: 2,
              position: 'relative',
            }}
          >
            {/* Hero image or emoji */}
            {heroVisual && heroVisual.type === 'image' ? (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 1.5,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={heroVisual.value}
                  alt={heroProduct.name}
                  style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                />
              </Box>
            ) : heroVisual ? (
              <Typography sx={{ fontSize: 48, mb: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                {heroVisual.value}
              </Typography>
            ) : null}

            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 0.5, textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
              {heroProduct.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 40,
                fontWeight: 900,
                color: t.accentColor,
                lineHeight: 1,
                textShadow: '0 3px 6px rgba(0,0,0,0.3)',
                letterSpacing: -1,
              }}
            >
              {heroProduct.price}
            </Typography>
            {heroProduct.unit && (
              <Typography sx={{ fontSize: 12, opacity: 0.85, fontWeight: 500, mt: 0.3 }}>
                {heroProduct.unit}
              </Typography>
            )}
            {heroProduct.savings && (
              <Box
                component="span"
                sx={{
                  background: t.accentColor,
                  color: '#1a1a1a',
                  px: 1.5,
                  py: 0.3,
                  borderRadius: 10,
                  display: 'inline-block',
                  mt: 1,
                  fontWeight: 800,
                  fontSize: 10,
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                  letterSpacing: 0.5,
                }}
              >
                🔥 SAVE {heroProduct.savings}!
              </Box>
            )}
          </Box>
        )}

        {/* ─── Secondary Products ─────────────── */}
        {secondaryProducts.length > 0 && (
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
            <Typography
              sx={{
                fontSize: 13,
                color: t.primaryColor,
                textAlign: 'center',
                fontWeight: 800,
                mb: 1.5,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              🔥 MORE VIP DEALS:
            </Typography>
            {secondaryProducts.slice(0, 5).map((p, i) => {
              const visual = getProductVisual(p);
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.8,
                    px: 0.5,
                    borderBottom: i < Math.min(secondaryProducts.length, 5) - 1 ? '1px solid #f0f0f0' : 'none',
                    borderRadius: 1,
                    transition: 'background 0.15s',
                    '&:hover': { background: '#fafafa' },
                  }}
                >
                  {/* Product image or emoji */}
                  {visual.type === 'image' ? (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        mr: 1,
                        border: '1px solid #eee',
                        bgcolor: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={visual.value}
                        alt={p.name}
                        style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        borderRadius: 1.5,
                        mr: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #eee 100%)',
                        fontSize: 20,
                      }}
                    >
                      {visual.value}
                    </Box>
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 11,
                        color: '#2d2d2d',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: t.primaryColor,
                        fontWeight: 800,
                        fontSize: 14,
                        lineHeight: 1.2,
                      }}
                    >
                      {p.price}
                    </Typography>
                  </Box>

                  {/* Savings badge */}
                  {p.savings && (
                    <Box
                      sx={{
                        background: `linear-gradient(135deg, ${t.primaryColor}, ${t.primaryDark})`,
                        color: 'white',
                        px: 0.8,
                        py: 0.2,
                        borderRadius: 0.5,
                        fontSize: 8,
                        fontWeight: 700,
                        ml: 0.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      -{p.savings}
                    </Box>
                  )}
                </Box>
              );
            })}
            {secondaryProducts.length > 5 && (
              <Typography
                sx={{
                  textAlign: 'center',
                  fontSize: 10,
                  color: t.primaryColor,
                  fontWeight: 600,
                  mt: 1,
                  opacity: 0.7,
                }}
              >
                + {secondaryProducts.length - 5} more deals inside...
              </Typography>
            )}
          </Box>
        )}

        {/* ─── Barcode / Coupon ────────────────── */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #FFFDF0 0%, #FFF9E6 100%)',
            borderTop: `2px solid ${t.primaryColor}`,
            borderBottom: `2px solid ${t.primaryColor}`,
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#333', mb: 0.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {t.ctaText}
          </Typography>
          <Box
            sx={{
              background: 'white',
              color: t.primaryColor,
              px: 2.5,
              py: 1,
              borderRadius: 1.5,
              fontSize: 16,
              fontWeight: 900,
              display: 'inline-block',
              border: `2px dashed ${t.primaryColor}`,
              letterSpacing: 2,
              boxShadow: '0 2px 8px rgba(220,31,38,0.1)',
            }}
          >
            {campaignCode}
          </Box>
          <Box sx={{ mt: 1 }}>
            {t.showBarcode !== false && (
              <Box
                sx={{
                  background: '#f8f8f8',
                  height: 40,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  maxWidth: 200,
                  border: '1px solid #eee',
                }}
              >
                <Typography sx={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: 1, color: '#333' }}>
                  ▌▐▌▌▐▌▐▌▌▐▐▌▌▐▌▐▌▌▐▐▌▌▐▌
                </Typography>
              </Box>
            )}
            <Typography sx={{ fontSize: 8, color: '#888', mt: 0.5, fontFamily: 'monospace', letterSpacing: 0.5 }}>
              SUPER-{campaignCode}-XXXXXX
            </Typography>
          </Box>
        </Box>

        {/* ─── Footer ─────────────────────────── */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${t.footerBg} 0%, #0f0f23 100%)`,
            color: 'white',
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5 }}>
            {storeName}
          </Typography>
          <Typography sx={{ fontSize: 10, color: t.accentColor, mt: 0.3, fontWeight: 600 }}>
            {validDates}
          </Typography>
          <Typography sx={{ fontSize: 7, opacity: 0.4, mt: 0.5, letterSpacing: 0.3 }}>
            {t.footerText}
          </Typography>
        </Box>
      </Box>

      {/* Phone Bottom */}
      <Box sx={{ height: 20, background: '#1a1a2e' }} />
    </Box>
  );
}
