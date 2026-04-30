import type {
  AnalyticsOverview,
  CampaignAnalytics,
  CustomerAnalytics,
  ProductAnalytics,
  ProductDetail,
  TimelinePoint,
} from '@/services/analytics.service';

/* ──────────────────────────────────────────────────────
   Demo data matching real backend aggregation shapes.
   Used when API returns empty / no data available.
   ────────────────────────────────────────────────────── */

export const DEMO_OVERVIEW: AnalyticsOverview = {
  kpis: {
    totalScans: 1847,
    uniqueCustomers: 623,
    confirmedPurchases: 412,
    totalPoints: 8945,
    totalProductsPurchased: 2156,
    totalProductsInCampaign: 340,
    conversionRate: 66.1,
  },
  shoppingLists: {
    total: 534,
    validated: 312,
    pending: 222,
    totalItems: 3420,
    uniqueCustomers: 489,
  },
  messaging: {
    total: 24500,
    delivered: 23180,
    errors: 320,
    mms: 18200,
    sms: 6300,
    deliveryRate: 94.6,
  },
};

export const DEMO_CAMPAIGNS: CampaignAnalytics[] = [
  {
    circularId: 'circ-super-fresh-01',
    storeId: '64a1b2c3d4e5f6789012345a',
    storeSlug: 'super-fresh-market-nj',
    totalScans: 342,
    uniqueCustomers: 187,
    confirmedPurchases: 124,
    totalPoints: 2680,
    productsPurchased: 856,
    conversionRate: 66.3,
    firstScan: '2026-04-01T10:23:00Z',
    lastScan: '2026-04-28T16:45:00Z',
  },
  {
    circularId: 'circ-food-palace-02',
    storeId: '64a1b2c3d4e5f6789012345b',
    storeSlug: 'food-palace-paterson',
    totalScans: 289,
    uniqueCustomers: 156,
    confirmedPurchases: 98,
    totalPoints: 1920,
    productsPurchased: 634,
    conversionRate: 62.8,
    firstScan: '2026-04-03T09:15:00Z',
    lastScan: '2026-04-29T14:30:00Z',
  },
  {
    circularId: 'circ-latino-market-03',
    storeId: '64a1b2c3d4e5f6789012345c',
    storeSlug: 'latino-market-elizabeth',
    totalScans: 456,
    uniqueCustomers: 234,
    confirmedPurchases: 178,
    totalPoints: 3450,
    productsPurchased: 1245,
    conversionRate: 76.1,
    firstScan: '2026-03-25T11:00:00Z',
    lastScan: '2026-04-30T09:20:00Z',
  },
  {
    circularId: 'circ-mercado-sol-04',
    storeId: '64a1b2c3d4e5f6789012345d',
    storeSlug: 'mercado-del-sol-newark',
    totalScans: 198,
    uniqueCustomers: 112,
    confirmedPurchases: 67,
    totalPoints: 1340,
    productsPurchased: 423,
    conversionRate: 59.8,
    firstScan: '2026-04-05T08:45:00Z',
    lastScan: '2026-04-27T17:10:00Z',
  },
  {
    circularId: 'circ-tropical-05',
    storeId: '64a1b2c3d4e5f6789012345e',
    storeSlug: 'tropical-supermarket-union',
    totalScans: 267,
    uniqueCustomers: 145,
    confirmedPurchases: 89,
    totalPoints: 1780,
    productsPurchased: 578,
    conversionRate: 61.4,
    firstScan: '2026-04-02T12:30:00Z',
    lastScan: '2026-04-29T15:55:00Z',
  },
];

export const DEMO_CUSTOMERS: CustomerAnalytics[] = [
  { customerId: 'c001', customerName: 'Maria Rodriguez', customerPhone: '+12015551234', totalScans: 28, totalPoints: 890, confirmedPurchases: 22, productsPurchased: 67, storeCount: 3, firstVisit: '2026-02-15', lastVisit: '2026-04-29' },
  { customerId: 'c002', customerName: 'Carlos Mendez', customerPhone: '+12015555678', totalScans: 24, totalPoints: 720, confirmedPurchases: 19, productsPurchased: 54, storeCount: 2, firstVisit: '2026-03-01', lastVisit: '2026-04-28' },
  { customerId: 'c003', customerName: 'Ana Garcia', customerPhone: '+19735551111', totalScans: 21, totalPoints: 650, confirmedPurchases: 17, productsPurchased: 48, storeCount: 2, firstVisit: '2026-02-20', lastVisit: '2026-04-30' },
  { customerId: 'c004', customerName: 'Jose Hernandez', customerPhone: '+19085552222', totalScans: 19, totalPoints: 580, confirmedPurchases: 15, productsPurchased: 42, storeCount: 1, firstVisit: '2026-03-05', lastVisit: '2026-04-27' },
  { customerId: 'c005', customerName: 'Rosa Martinez', customerPhone: '+12015553333', totalScans: 17, totalPoints: 520, confirmedPurchases: 14, productsPurchased: 39, storeCount: 2, firstVisit: '2026-03-10', lastVisit: '2026-04-29' },
  { customerId: 'c006', customerName: 'Pedro Lopez', customerPhone: '+19735554444', totalScans: 15, totalPoints: 460, confirmedPurchases: 12, productsPurchased: 35, storeCount: 1, firstVisit: '2026-03-12', lastVisit: '2026-04-26' },
  { customerId: 'c007', customerName: 'Laura Sanchez', customerPhone: '+12015555555', totalScans: 14, totalPoints: 420, confirmedPurchases: 11, productsPurchased: 31, storeCount: 2, firstVisit: '2026-03-15', lastVisit: '2026-04-28' },
  { customerId: 'c008', customerName: 'Miguel Torres', customerPhone: '+19085556666', totalScans: 12, totalPoints: 380, confirmedPurchases: 10, productsPurchased: 28, storeCount: 1, firstVisit: '2026-03-18', lastVisit: '2026-04-25' },
  { customerId: 'c009', customerName: 'Carmen Diaz', customerPhone: '+12015557777', totalScans: 11, totalPoints: 340, confirmedPurchases: 9, productsPurchased: 26, storeCount: 1, firstVisit: '2026-03-20', lastVisit: '2026-04-29' },
  { customerId: 'c010', customerName: 'Roberto Ruiz', customerPhone: '+19735558888', totalScans: 10, totalPoints: 310, confirmedPurchases: 8, productsPurchased: 23, storeCount: 1, firstVisit: '2026-03-22', lastVisit: '2026-04-27' },
];

export const DEMO_PRODUCTS: { purchased: ProductAnalytics[]; selected: ProductAnalytics[] } = {
  selected: [
    { product: 'Perdue Chicken Drumsticks', category: 'meat', price: '$4.99/lb', imageUrl: 'https://jsfpovyoaqucwigttyil.supabase.co/storage/v1/object/public/public-xcircular/products/SKU27094918.png', timesSelected: 145, uniqueCustomers: 98 },
    { product: "Florida's Natural Orange Juice", category: 'beverages', price: '2/$6', imageUrl: 'https://jsfpovyoaqucwigttyil.supabase.co/storage/v1/object/public/public-xcircular/products/SKU27094919.png', timesSelected: 132, uniqueCustomers: 87 },
    { product: 'Avocados Hass', category: 'produce', price: '$0.99 each', timesSelected: 128, uniqueCustomers: 91 },
    { product: 'Goya Black Beans', category: 'pantry', price: '3/$5', timesSelected: 118, uniqueCustomers: 82 },
    { product: 'Tropical Plantains', category: 'produce', price: '$0.59/lb', timesSelected: 105, uniqueCustomers: 76 },
    { product: 'La Fe Yuca Frita', category: 'frozen', price: '$3.99', timesSelected: 97, uniqueCustomers: 68 },
    { product: 'Corona Extra 12pk', category: 'beverages', price: '$14.99', timesSelected: 89, uniqueCustomers: 62 },
    { product: 'Queso Fresco Cacique', category: 'dairy', price: '$4.49', timesSelected: 84, uniqueCustomers: 59 },
    { product: 'Bananas', category: 'produce', price: '$0.39/lb', timesSelected: 78, uniqueCustomers: 55 },
    { product: 'Arroz Canilla Extra Long Grain', category: 'pantry', price: '$5.99', timesSelected: 72, uniqueCustomers: 50 },
    { product: 'Pan Bimbo White Bread', category: 'bakery', price: '$3.49', timesSelected: 65, uniqueCustomers: 45 },
    { product: 'Chips Ahoy! Cookies', category: 'snacks', price: '2/$7', timesSelected: 58, uniqueCustomers: 41 },
    { product: 'Tide Liquid Detergent', category: 'household', price: '$9.99', timesSelected: 42, uniqueCustomers: 35 },
    { product: 'Jamón Ahumado Oscar Mayer', category: 'deli', price: '$5.49', timesSelected: 38, uniqueCustomers: 28 },
  ],
  purchased: [
    { product: 'Perdue Chicken Drumsticks', category: 'meat', price: '$4.99/lb', imageUrl: 'https://jsfpovyoaqucwigttyil.supabase.co/storage/v1/object/public/public-xcircular/products/SKU27094918.png', timesPurchased: 112, uniqueCustomers: 78 },
    { product: 'Avocados Hass', category: 'produce', price: '$0.99 each', timesPurchased: 98, uniqueCustomers: 72 },
    { product: "Florida's Natural Orange Juice", category: 'beverages', price: '2/$6', timesPurchased: 95, uniqueCustomers: 67 },
    { product: 'Goya Black Beans', category: 'pantry', price: '3/$5', timesPurchased: 87, uniqueCustomers: 61 },
    { product: 'Tropical Plantains', category: 'produce', price: '$0.59/lb', timesPurchased: 78, uniqueCustomers: 58 },
    { product: 'Bananas', category: 'produce', price: '$0.39/lb', timesPurchased: 74, uniqueCustomers: 54 },
    { product: 'La Fe Yuca Frita', category: 'frozen', price: '$3.99', timesPurchased: 72, uniqueCustomers: 52 },
    { product: 'Queso Fresco Cacique', category: 'dairy', price: '$4.49', timesPurchased: 65, uniqueCustomers: 48 },
    { product: 'Corona Extra 12pk', category: 'beverages', price: '$14.99', timesPurchased: 56, uniqueCustomers: 42 },
    { product: 'Arroz Canilla Extra Long Grain', category: 'pantry', price: '$5.99', timesPurchased: 52, uniqueCustomers: 38 },
    { product: 'Pan Bimbo White Bread', category: 'bakery', price: '$3.49', timesPurchased: 45, uniqueCustomers: 33 },
    { product: 'Chips Ahoy! Cookies', category: 'snacks', price: '2/$7', timesPurchased: 38, uniqueCustomers: 29 },
  ],
};

// Deterministic pseudo-random for stable renders
const SEED_SCANS = [42, 55, 38, 61, 47, 33, 58, 44, 52, 36, 49, 60, 41, 53, 37, 56, 45, 50, 39, 57, 48];
const SEED_CUST  = [28, 35, 25, 40, 30, 22, 37, 29, 34, 24, 32, 39, 27, 35, 24, 36, 29, 33, 26, 37, 31];
const SEED_CONF  = [15, 20, 14, 24, 17, 12, 21, 16, 19, 13, 18, 23, 15, 20, 13, 21, 16, 19, 14, 22, 17];

function generateTimelineDays(days: number): TimelinePoint[] {
  const result: TimelinePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const idx = days - 1 - i;
    const scans = SEED_SCANS[idx % SEED_SCANS.length];
    const customers = SEED_CUST[idx % SEED_CUST.length];
    const confirmed = SEED_CONF[idx % SEED_CONF.length];
    result.push({
      date: d.toISOString().slice(0, 10),
      scans,
      customers,
      points: scans * 5 + 25,
      confirmed,
    });
  }
  return result;
}

export const DEMO_TIMELINE = {
  scans: generateTimelineDays(21),
  shoppingLists: [],
};

/* ──────────────────────────────────────────────────────
   Demo per-campaign product breakdown
   ────────────────────────────────────────────────────── */
export const DEMO_CAMPAIGN_PRODUCTS: {
  purchased: ProductDetail[];
  selected: ProductDetail[];
  byCampaign: Record<string, { storeSlug: string; products: ProductDetail[] }>;
} = {
  purchased: [],
  selected: [],
  byCampaign: {
    'circ-super-fresh-01': {
      storeSlug: 'super-fresh-market-nj',
      products: [
        { product: 'Perdue Chicken Drumsticks', category: 'meat', price: '$4.99/lb', quantity: 45, uniqueCustomers: 32 },
        { product: 'Avocados Hass', category: 'produce', price: '$0.99 each', quantity: 38, uniqueCustomers: 28 },
        { product: "Florida's Natural OJ", category: 'beverages', price: '2/$6', quantity: 34, uniqueCustomers: 25 },
        { product: 'Goya Black Beans', category: 'pantry', price: '3/$5', quantity: 28, uniqueCustomers: 21 },
        { product: 'Bananas', category: 'produce', price: '$0.39/lb', quantity: 22, uniqueCustomers: 18 },
      ],
    },
    'circ-food-palace-02': {
      storeSlug: 'food-palace-paterson',
      products: [
        { product: 'Tropical Plantains', category: 'produce', price: '$0.59/lb', quantity: 32, uniqueCustomers: 24 },
        { product: 'Corona Extra 12pk', category: 'beverages', price: '$14.99', quantity: 28, uniqueCustomers: 20 },
        { product: 'Queso Fresco Cacique', category: 'dairy', price: '$4.49', quantity: 25, uniqueCustomers: 18 },
        { product: 'La Fe Yuca Frita', category: 'frozen', price: '$3.99', quantity: 19, uniqueCustomers: 14 },
      ],
    },
    'circ-latino-market-03': {
      storeSlug: 'latino-market-elizabeth',
      products: [
        { product: 'Perdue Chicken Drumsticks', category: 'meat', price: '$4.99/lb', quantity: 67, uniqueCustomers: 48 },
        { product: 'Avocados Hass', category: 'produce', price: '$0.99 each', quantity: 56, uniqueCustomers: 42 },
        { product: "Florida's Natural OJ", category: 'beverages', price: '2/$6', quantity: 48, uniqueCustomers: 36 },
        { product: 'Arroz Canilla Extra Long Grain', category: 'pantry', price: '$5.99', quantity: 42, uniqueCustomers: 31 },
        { product: 'Goya Black Beans', category: 'pantry', price: '3/$5', quantity: 38, uniqueCustomers: 28 },
        { product: 'Tropical Plantains', category: 'produce', price: '$0.59/lb', quantity: 35, uniqueCustomers: 25 },
      ],
    },
    'circ-mercado-sol-04': {
      storeSlug: 'mercado-del-sol-newark',
      products: [
        { product: 'Bananas', category: 'produce', price: '$0.39/lb', quantity: 24, uniqueCustomers: 18 },
        { product: 'Pan Bimbo White Bread', category: 'bakery', price: '$3.49', quantity: 18, uniqueCustomers: 13 },
        { product: 'Chips Ahoy! Cookies', category: 'snacks', price: '2/$7', quantity: 15, uniqueCustomers: 11 },
      ],
    },
    'circ-tropical-05': {
      storeSlug: 'tropical-supermarket-union',
      products: [
        { product: 'La Fe Yuca Frita', category: 'frozen', price: '$3.99', quantity: 30, uniqueCustomers: 22 },
        { product: 'Queso Fresco Cacique', category: 'dairy', price: '$4.49', quantity: 26, uniqueCustomers: 19 },
        { product: 'Corona Extra 12pk', category: 'beverages', price: '$14.99', quantity: 22, uniqueCustomers: 16 },
        { product: 'Tide Liquid Detergent', category: 'household', price: '$9.99', quantity: 14, uniqueCustomers: 10 },
      ],
    },
  },
};
