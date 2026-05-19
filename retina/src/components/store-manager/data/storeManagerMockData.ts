// Static mock data extracted from the source HTML prototype's inline JS.
// Keep article names, ART codes, and category labels exactly as in the source
// so visual diffing against the original prototype is straightforward.

export type ArticleStatus = 'todo' | 'done' | 'failed';

export type Article = {
  id: string;
  name: string;
  weight: string;
  category: string;
  categoryKey: string;
  code: string;
  status: ArticleStatus;
};

export type LooseArticle = {
  id: string;
  name: string;
  weight: string;
  category: string;
  categoryKey: string;
  code: string;
};

export type MappedArticle = {
  id: string;
  name: string;
  weight: string;
  category: string;
  categoryKey: string;
  code: string;
};

export type FilterDef = {
  cat: string;
  label: string;
  count: number;
};

export type ArticleTab = 'scan' | 'mapped' | 'loose';

// "Scanned today" activity row data type used on dashboard/progress screens
export type TodayScanRow = {
  name: string;
  time: string;
  status: 'done' | 'processing' | 'failed';
};

// To-scan articles — combination of failed, in-progress, and to-scan items.
// IDs are stable for use as React keys and for the "mark Paneer scanned/excluded" demo flows.
export const TO_SCAN_ARTICLES: Article[] = [
  {
    id: 'spice-mdh-chana',
    name: 'Spice, MDH, Chana Masala',
    weight: '100 g · Upload failed · retry',
    category: 'Spices',
    categoryKey: 'spices',
    code: 'ART-10102',
    status: 'failed',
  },
  {
    id: 'butter-amul',
    name: 'Butter, Amul, Salted Pasteurised',
    weight: '500 g · Dairy · ART-10112',
    category: 'Dairy',
    categoryKey: 'dairy',
    code: 'ART-10112',
    status: 'todo',
  },
  {
    id: 'chicken-curry-cut',
    name: 'Chicken, Fresh, Curry Cut Bone-in Skinless Marinated',
    weight: '1 kg · Meat · ART-10455',
    category: 'Meat',
    categoryKey: 'dry',
    code: 'ART-10455',
    status: 'todo',
  },
  {
    id: 'frozen-fries',
    name: 'Frozen, McCain, French Fries Classic Cut',
    weight: '1.25 kg · Frozen · ART-10781',
    category: 'Frozen',
    categoryKey: 'frozen',
    code: 'ART-10781',
    status: 'todo',
  },
  {
    id: 'paneer-amul',
    name: 'Paneer, Amul, Fresh Block',
    weight: '1 kg · Dairy · ART-10234',
    category: 'Dairy',
    categoryKey: 'dairy',
    code: 'ART-10234',
    status: 'todo',
  },
  {
    id: 'spice-mtr-sambar',
    name: 'Spice, MTR, Sambar Masala Blend',
    weight: '100 g · Spices · ART-10519',
    category: 'Spices',
    categoryKey: 'spices',
    code: 'ART-10519',
    status: 'todo',
  },
  {
    id: 'icecream-mother-dairy',
    name: 'Ice Cream, Mother Dairy, Vanilla Magic',
    weight: '750 ml · Frozen · ART-10844',
    category: 'Frozen',
    categoryKey: 'frozen',
    code: 'ART-10844',
    status: 'todo',
  },
  {
    id: 'flour-aashirvaad',
    name: 'Flour, Aashirvaad, Whole Wheat Atta Multigrain',
    weight: '5 kg · Dry goods · ART-10921',
    category: 'Dry goods',
    categoryKey: 'dry',
    code: 'ART-10921',
    status: 'todo',
  },
  {
    id: 'jam-kissan',
    name: 'Jam, Kissan, Mixed Fruit Spread',
    weight: '500 g · Condiments · ART-10445',
    category: 'Condiments',
    categoryKey: 'condiments',
    code: 'ART-10445',
    status: 'done',
  },
  {
    id: 'oil-fortune',
    name: 'Oil, Fortune, Refined Sunflower',
    weight: '1 L · Oils · ART-10633',
    category: 'Oils',
    categoryKey: 'oils',
    code: 'ART-10633',
    status: 'todo',
  },
  {
    id: 'bread-modern',
    name: 'Bread, Modern, Whole Wheat Sliced Sandwich',
    weight: '400 g · Bakery · ART-10314',
    category: 'Bakery',
    categoryKey: 'bakery',
    code: 'ART-10314',
    status: 'todo',
  },
  {
    id: 'beverage-coke',
    name: 'Beverage, Coca-Cola, Original Taste',
    weight: '1 L · Beverages · ART-10052',
    category: 'Beverages',
    categoryKey: 'beverages',
    code: 'ART-10052',
    status: 'todo',
  },
  {
    id: 'curd-mother-dairy',
    name: 'Curd, Mother Dairy, Fresh Set Pouch',
    weight: '400 g · Dairy · ART-10678',
    category: 'Dairy',
    categoryKey: 'dairy',
    code: 'ART-10678',
    status: 'todo',
  },
  {
    id: 'sauce-maggi',
    name: 'Sauce, Maggi, Rich Tomato Ketchup',
    weight: '500 g · Condiments · ART-10288',
    category: 'Condiments',
    categoryKey: 'condiments',
    code: 'ART-10288',
    status: 'todo',
  },
];

export const MAPPED_ARTICLES: MappedArticle[] = [
  {
    id: 'm-jam-kissan',
    name: 'Jam, Kissan, Mixed Fruit Spread',
    weight: '500 g · Condiments · ART-10445',
    category: 'Condiments',
    categoryKey: 'condiments',
    code: 'ART-10445',
  },
  {
    id: 'm-butter-amul',
    name: 'Butter, Amul, Salted Pasteurised',
    weight: '500 g · Dairy · ART-10112',
    category: 'Dairy',
    categoryKey: 'dairy',
    code: 'ART-10112',
  },
  {
    id: 'm-salt-tata',
    name: 'Salt, Tata, Iodised Crystal',
    weight: '1 kg · Dry goods · ART-10089',
    category: 'Dry goods',
    categoryKey: 'dry',
    code: 'ART-10089',
  },
  {
    id: 'm-biscuit-parle',
    name: 'Biscuit, Parle-G, Original Glucose',
    weight: '800 g · Bakery · ART-10203',
    category: 'Bakery',
    categoryKey: 'bakery',
    code: 'ART-10203',
  },
];

export const LOOSE_ARTICLES: LooseArticle[] = [
  {
    id: 'l-tomatoes',
    name: 'Tomatoes, Loose, Fresh',
    weight: 'per kg · Vegetables · ART-20011',
    category: 'Vegetables',
    categoryKey: 'vegetables',
    code: 'ART-20011',
  },
  {
    id: 'l-onions',
    name: 'Onions, Loose, Red',
    weight: 'per kg · Vegetables · ART-20015',
    category: 'Vegetables',
    categoryKey: 'vegetables',
    code: 'ART-20015',
  },
  {
    id: 'l-coriander',
    name: 'Coriander, Fresh, Bunch',
    weight: '100 g · Herbs · ART-20023',
    category: 'Herbs',
    categoryKey: 'herbs',
    code: 'ART-20023',
  },
  {
    id: 'l-chicken-drumsticks',
    name: 'Chicken, Fresh, Drumsticks Skin-on',
    weight: 'per kg · Meat · ART-20041',
    category: 'Meat',
    categoryKey: 'meat',
    code: 'ART-20041',
  },
  {
    id: 'l-potatoes',
    name: 'Potatoes, Loose, Premium',
    weight: 'per kg · Vegetables · ART-20009',
    category: 'Vegetables',
    categoryKey: 'vegetables',
    code: 'ART-20009',
  },
  {
    id: 'l-chicken-curry-cut',
    name: 'Chicken, Fresh, Curry Cut Bone-in',
    weight: 'per kg · Meat · ART-20055',
    category: 'Meat',
    categoryKey: 'meat',
    code: 'ART-20055',
  },
  {
    id: 'l-green-chillies',
    name: 'Green Chillies, Loose, Fresh',
    weight: '100 g · Herbs · ART-20028',
    category: 'Herbs',
    categoryKey: 'herbs',
    code: 'ART-20028',
  },
  {
    id: 'l-bananas',
    name: 'Bananas, Loose, Robusta',
    weight: 'per dozen · Fruits · ART-20071',
    category: 'Fruits',
    categoryKey: 'fruits',
    code: 'ART-20071',
  },
];

export const FILTER_DEFS: Record<ArticleTab, FilterDef[]> = {
  scan: [
    { cat: 'dairy', label: 'Dairy', count: 12 },
    { cat: 'dry', label: 'Dry goods', count: 34 },
    { cat: 'frozen', label: 'Frozen', count: 8 },
    { cat: 'beverages', label: 'Beverages', count: 21 },
    { cat: 'bakery', label: 'Bakery', count: 11 },
    { cat: 'spices', label: 'Spices & Masala', count: 18 },
    { cat: 'oils', label: 'Oils', count: 9 },
    { cat: 'condiments', label: 'Condiments', count: 15 },
  ],
  mapped: [
    { cat: 'dairy', label: 'Dairy', count: 2 },
    { cat: 'dry', label: 'Dry goods', count: 1 },
    { cat: 'bakery', label: 'Bakery', count: 1 },
    { cat: 'condiments', label: 'Condiments', count: 1 },
  ],
  loose: [
    { cat: 'vegetables', label: 'Vegetables', count: 3 },
    { cat: 'fruits', label: 'Fruits', count: 1 },
    { cat: 'herbs', label: 'Herbs', count: 2 },
    { cat: 'meat', label: 'Meat', count: 2 },
  ],
};

// GTIN lookup by ART code — used by the capture/review/submitted flows.
export const GTIN_MAP: Record<string, string> = {
  'ART-10112': '8901030542091',
  'ART-10455': '8907001230045',
  'ART-10781': '8904109019871',
  'ART-10234': '8901030546167',
  'ART-10519': '8901042128834',
  'ART-10844': '8906015671123',
  'ART-10921': '8901725019901',
  'ART-10633': '8904056782210',
  'ART-10314': '8901226001234',
  'ART-10052': '5449000000996',
  'ART-10678': '8906009873312',
  'ART-10288': '8901526112345',
};

// Initial seed of selected filters on the scan tab (matches source).
export const INITIAL_FILTERS: Record<ArticleTab, string[]> = {
  scan: ['dairy', 'frozen', 'spices'],
  mapped: [],
  loose: [],
};

// "Scanned today" activity rows for the inline progress card on the articles screen
export const SCANNED_TODAY_INLINE: TodayScanRow[] = [
  { name: 'Amul Paneer 1kg', time: '9:12 AM', status: 'done' },
  { name: 'Amul Butter 500g', time: '9:28 AM', status: 'processing' },
  { name: 'MDH Chana Masala', time: '9:41 AM', status: 'failed' },
];

// "Scanned today" rows for the standalone Progress screen (slightly different)
export const SCANNED_TODAY_PROGRESS: TodayScanRow[] = [
  { name: 'Amul Paneer 1kg', time: '9:12 AM', status: 'done' },
  { name: 'Tata Salt 1kg', time: '9:28 AM', status: 'done' },
  { name: 'MDH Chana Masala', time: '9:41 AM', status: 'failed' },
];
