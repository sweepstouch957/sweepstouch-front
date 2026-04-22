'use client';

import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface Product {
  name: string;
  price: string;
  unit?: string;
  emoji?: string;
  isHero?: boolean;
  savings?: string;
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
  footerBg: '#333333',
  ctaText: 'SHOW THIS AT CHECKOUT:',
  footerText: 'Powered by Sweepstouch',
  showBarcode: true,
  showQr: true,
};

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

  return (
    <Box
      sx={{
        mx: 'auto',
        maxWidth: 320,
        borderRadius: '28px',
        overflow: 'hidden',
        border: '8px solid #222',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        background: '#222',
      }}
    >
      {/* Phone Notch */}
      <Box
        sx={{
          height: 24,
          background: '#222',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: 80, height: 6, borderRadius: 3, background: '#444' }} />
      </Box>

      {/* Content */}
      <Box
        sx={{
          maxHeight: 520,
          overflowY: 'auto',
          background: 'white',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: 4 },
        }}
      >
        {/* Header */}
        <Box sx={{ background: t.primaryColor, color: t.textOnPrimary, textAlign: 'center', p: 1.5 }}>
          {t.logoUrl && (
            <Box sx={{ mb: 0.5 }}>
              <img
                src={t.logoUrl}
                alt={storeName}
                style={{ maxHeight: 32, maxWidth: 150, objectFit: 'contain' }}
              />
            </Box>
          )}
          <Typography sx={{ fontSize: 15, fontWeight: 'bold', mb: 0.3 }}>
            🔴 VIP CUSTOMER SALE 🔴
          </Typography>
          <Typography sx={{ fontSize: 11 }}>
            {headline || 'EXCLUSIVE MEMBER PRICING'}
          </Typography>
          <Box
            sx={{
              background: t.accentColor,
              color: t.primaryColor,
              px: 1.5,
              py: 0.5,
              mt: 1,
              fontWeight: 'bold',
              fontSize: 11,
              borderRadius: 0.5,
              display: 'inline-block',
            }}
          >
            {validDates}
          </Box>
        </Box>

        {/* Hero Product */}
        {heroProduct && (
          <Box
            sx={{
              background: `linear-gradient(to bottom, ${t.primaryColor}, ${t.primaryDark})`,
              p: 2,
              textAlign: 'center',
              color: t.textOnPrimary,
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 'bold', mb: 0.5 }}>
              {heroProduct.emoji} {heroProduct.name}
            </Typography>
            <Typography
              sx={{ fontSize: 32, fontWeight: 'bold', color: t.accentColor, lineHeight: 1 }}
            >
              {heroProduct.price}
            </Typography>
            {heroProduct.unit && (
              <Typography sx={{ fontSize: 11, opacity: 0.9 }}>{heroProduct.unit}</Typography>
            )}
            {heroProduct.savings && (
              <Box
                component="span"
                sx={{
                  background: t.accentColor,
                  color: t.primaryColor,
                  px: 1,
                  py: 0.25,
                  borderRadius: 10,
                  display: 'inline-block',
                  mt: 0.5,
                  fontWeight: 'bold',
                  fontSize: 10,
                }}
              >
                SAVE {heroProduct.savings}!
              </Box>
            )}
          </Box>
        )}

        {/* Secondary Products */}
        {secondaryProducts.length > 0 && (
          <Box sx={{ p: 1.5 }}>
            <Typography
              sx={{ fontSize: 13, color: t.primaryColor, textAlign: 'center', fontWeight: 'bold', mb: 1 }}
            >
              MORE VIP DEALS:
            </Typography>
            {secondaryProducts.slice(0, 5).map((p, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.8,
                  borderBottom:
                    i < secondaryProducts.length - 1 ? '1px solid #eee' : 'none',
                }}
              >
                <Typography sx={{ fontSize: 20, mr: 1, minWidth: 28, textAlign: 'center' }}>
                  {p.emoji || '🛒'}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: 11, color: '#333' }}>
                    {p.name}
                  </Typography>
                  <Typography sx={{ color: t.primaryColor, fontWeight: 'bold', fontSize: 13 }}>
                    {p.price}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Barcode Preview */}
        <Box
          sx={{
            background: '#FFF9E6',
            borderTop: `2px solid ${t.primaryColor}`,
            borderBottom: `2px solid ${t.primaryColor}`,
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: '#333', mb: 0.5 }}>
            {t.ctaText}
          </Typography>
          <Box
            sx={{
              background: 'white',
              color: t.primaryColor,
              px: 2,
              py: 0.8,
              borderRadius: 1,
              fontSize: 14,
              fontWeight: 'bold',
              display: 'inline-block',
              border: `1.5px dashed ${t.primaryColor}`,
            }}
          >
            {campaignCode}
          </Box>
          <Box sx={{ mt: 1 }}>
            {t.showBarcode !== false && (
              <Box
                sx={{
                  background: '#f0f0f0',
                  height: 40,
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  maxWidth: 200,
                }}
              >
                <Typography sx={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>
                  ▌▐▌▌▐▌▐▌▌▐▐▌▌▐▌▐▌▌▐▐▌▌▐▌
                </Typography>
              </Box>
            )}
            <Typography sx={{ fontSize: 8, color: '#666', mt: 0.5, fontFamily: 'monospace' }}>
              SUPER-{campaignCode}-XXXXXX
            </Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ background: t.footerBg, color: 'white', p: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 'bold' }}>{storeName}</Typography>
          <Typography sx={{ fontSize: 10, color: t.accentColor, mt: 0.3 }}>
            {validDates}
          </Typography>
          <Typography sx={{ fontSize: 7, opacity: 0.5, mt: 0.5 }}>
            {t.footerText}
          </Typography>
        </Box>
      </Box>

      {/* Phone Bottom */}
      <Box sx={{ height: 20, background: '#222' }} />
    </Box>
  );
}
