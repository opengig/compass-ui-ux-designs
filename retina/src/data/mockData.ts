export type ArticleStatus =
  | 'pending_review'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

export type ReviewSection = 'ingredients' | 'nutrition' | 'allergens' | 'claims';
export type VegStatus = 'veg' | 'non-veg';

export interface Ingredient {
  id: string;
  extractedText: string;
  mappedIngredient: string;
  allergen: 'Yes' | 'No';
  allergenType: string;
  confidence: 'High' | 'Medium' | 'Low';
  source: string;
}

export interface NutrientRow {
  id: string;
  nutrient: string;
  extractedValue: string;
  unit: string;
  rdaPercent: string;
  status: 'OK' | 'Review';
  source: string;
}

export interface AllergenSummary {
  id: string;
  name: string;
  level: 'contains' | 'may_contain';
}

export interface ArticleData {
  id: string;
  name: string;
  aplCode: string;
  barcode: string;
  vegStatus: VegStatus;
  status: ArticleStatus;
  extractedAt: string;
  confidence: number;
  ingredients: Ingredient[];
  nutrition: NutrientRow[];
  allergens: AllergenSummary[];
  claims: string[];
  reviewer?: string;
  approvedAt?: string;
}

export interface EditLogEntry {
  id: string;
  articleId: string;
  section: ReviewSection;
  field: string;
  oldValue: string;
  newValue: string;
  editedBy: string;
  editedAt: string;
  status: 'pending' | 'applied';
}

export type ArtStatus = 'green' | 'amber' | 'red';

export interface Art {
  id: string;
  name: string;
  status: ArtStatus;
  at: string;
}

// Kept exported for legacy props on the Dashboard; intentionally empty now.
export const SITES: string[] = [];

const PEPSI_DEFAULT_BARCODE = '4062139017416';

// Real OFF barcodes (looked up via OFF search API) — these resolve to actual product photos.
const SEED_PRODUCTS: { name: string; barcode: string; vegStatus: VegStatus }[] = [
  { name: 'Sausage Prasuma Chicken Breakfast 1kg', barcode: PEPSI_DEFAULT_BARCODE, vegStatus: 'non-veg' },
  { name: 'Chicken UB Frozen Leg Bone Less 1kg', barcode: PEPSI_DEFAULT_BARCODE, vegStatus: 'non-veg' },
  { name: 'Choco Chips Goodrich 1kg', barcode: '8410376050424', vegStatus: 'veg' },
  { name: 'Dark Compound Morde D15 500g', barcode: '8906051680135', vegStatus: 'veg' },
  { name: 'Chocolate Morde Slab Dark 1kg', barcode: '8906051680135', vegStatus: 'veg' },
  { name: 'Chocolate Morde Slab White 1kg', barcode: '7614500010310', vegStatus: 'veg' },
  { name: 'Tastecraft Chocolate Sauce 1L', barcode: '7613039093801', vegStatus: 'veg' },
  { name: "Nimmi's Cinnamon Fennel Powder 1kg", barcode: '9555502301724', vegStatus: 'veg' },
  { name: 'Cinnamon Stick UB 1kg', barcode: '8413700026263', vegStatus: 'veg' },
  { name: 'Cinnamon Stick Catch 500g', barcode: '8413700026263', vegStatus: 'veg' },
  { name: 'Cloves Catch 1kg', barcode: '0033844002183', vegStatus: 'veg' },
  { name: 'Cloves UB 1kg', barcode: '93716468', vegStatus: 'veg' },
  { name: 'Tendli Kundru UB Loose 1kg', barcode: '0011433117388', vegStatus: 'veg' },
  { name: 'Cocoa Powder Jindal 1kg', barcode: '8410109115543', vegStatus: 'veg' },
  { name: 'Amul Butter 500g', barcode: '8901262010016', vegStatus: 'veg' },
  { name: 'Britannia Marie Lite 200g', barcode: '8901063162914', vegStatus: 'veg' },
  { name: 'Parle-G Biscuits 100g', barcode: '8901719134852', vegStatus: 'veg' },
  { name: 'Tata Salt Lite 1kg', barcode: '8904043901015', vegStatus: 'veg' },
  { name: 'Maggi Masala Noodles 70g', barcode: '8901058000306', vegStatus: 'veg' },
  { name: 'Amul Gold Full Cream Milk 1L', barcode: '8901262150989', vegStatus: 'veg' },
  { name: 'Haldiram Aloo Bhujia 200g', barcode: '8904004400731', vegStatus: 'veg' },
  { name: 'Cadbury Dairy Milk 45g', barcode: '7622202272639', vegStatus: 'veg' },
  { name: 'Nestle Munch Crunchilicious 10x18g', barcode: '8901058022179', vegStatus: 'veg' },
  { name: 'Bingo Mad Angles Achaari Masti 90g', barcode: '8901725017903', vegStatus: 'veg' },
  { name: 'MTR Rasam Powder Authentic 200g', barcode: '8901042954738', vegStatus: 'veg' },
  { name: 'Everest Garam Masala Whole 100g', barcode: '8901786101009', vegStatus: 'veg' },
  { name: 'Dabur Honey Pure Original 250g', barcode: '8901207025372', vegStatus: 'veg' },
  { name: 'Patanjali Atta Whole Wheat 5kg', barcode: '8904422700710', vegStatus: 'veg' },
  { name: 'Aashirvaad Atta Multigrain 5kg', barcode: '8901725006679', vegStatus: 'veg' },
];

const STATUS_POOL: ArticleStatus[] = [
  'pending_review',
  'needs_changes',
  'approved',
  'rejected',
  'in_review',
  'pending_review',
  'approved',
  'approved',
];

const baseIngredients: Ingredient[] = [
  { id: 'ing-1', extractedText: 'Pasteurised Cream', mappedIngredient: 'Cream', allergen: 'Yes', allergenType: 'Dairy', confidence: 'High', source: 'Back label' },
  { id: 'ing-2', extractedText: 'Common Salt', mappedIngredient: 'Salt', allergen: 'No', allergenType: '-', confidence: 'High', source: 'Back label' },
  { id: 'ing-3', extractedText: 'Starter Culture', mappedIngredient: 'Culture', allergen: 'No', allergenType: '-', confidence: 'Medium', source: 'Back label' },
  { id: 'ing-4', extractedText: 'Microbial Enzyme (Rennet)', mappedIngredient: 'Enzyme', allergen: 'No', allergenType: '-', confidence: 'Medium', source: 'Back label' },
];

const baseNutrition: NutrientRow[] = [
  { id: 'nut-1', nutrient: 'Energy', extractedValue: '726', unit: 'kcal', rdaPercent: '36%', status: 'OK', source: 'Back label' },
  { id: 'nut-2', nutrient: 'Protein', extractedValue: '0.6', unit: 'g', rdaPercent: '1%', status: 'OK', source: 'Back label' },
  { id: 'nut-3', nutrient: 'Total Carbohydrate', extractedValue: '1.3', unit: 'g', rdaPercent: '-', status: 'OK', source: 'Back label' },
  { id: 'nut-4', nutrient: 'Total Fat', extractedValue: '82.0', unit: 'g', rdaPercent: '122%', status: 'Review', source: 'Back label' },
  { id: 'nut-5', nutrient: 'Sodium', extractedValue: '560', unit: 'mg', rdaPercent: '28%', status: 'Review', source: 'Back label' },
];

function statusToArt(status: ArticleStatus): ArtStatus {
  if (status === 'approved') {
    return 'green';
  }
  if (status === 'rejected') {
    return 'red';
  }
  return 'amber';
}

export const ARTICLE_DATA: ArticleData[] = SEED_PRODUCTS.map((product, index) => ({
  id: `APL-${String(index + 100).padStart(5, '0')}`,
  name: product.name,
  aplCode: `APL-${String(index + 100).padStart(5, '0')}`,
  barcode: product.barcode,
  vegStatus: product.vegStatus,
  status: STATUS_POOL[index % STATUS_POOL.length],
  extractedAt: `${13 + (index % 10)} May 2025, 0${(index % 7) + 8}:3${index % 6} PM`,
  confidence: Math.max(72, 94 - index * 2),
  ingredients: baseIngredients.map((item, rowIndex) => ({
    ...item,
    id: `${index}-ing-${rowIndex + 1}`,
    extractedText: rowIndex === 0 && index % 2 === 1 ? 'Whole Wheat Flour' : item.extractedText,
    mappedIngredient: rowIndex === 0 && index % 2 === 1 ? 'Wheat Flour' : item.mappedIngredient,
    allergen: rowIndex === 0 && index % 2 === 1 ? 'Yes' : item.allergen,
    allergenType: rowIndex === 0 && index % 2 === 1 ? 'Gluten' : item.allergenType,
  })),
  nutrition: baseNutrition.map((item, rowIndex) => ({
    ...item,
    id: `${index}-nut-${rowIndex + 1}`,
    extractedValue:
      item.nutrient === 'Energy'
        ? String(Number(item.extractedValue) + index * 4)
        : item.extractedValue,
    status: rowIndex > 2 && STATUS_POOL[index % STATUS_POOL.length] !== 'approved' ? 'Review' : item.status,
  })),
  allergens:
    index % 2 === 0
      ? [
          { id: `${index}-allergen-1`, name: 'Dairy', level: 'contains' },
          { id: `${index}-allergen-2`, name: 'Soy', level: 'may_contain' },
        ]
      : [
          { id: `${index}-allergen-1`, name: 'Gluten', level: 'contains' },
          { id: `${index}-allergen-2`, name: 'Nuts', level: 'may_contain' },
        ],
  claims: ['No artificial colours', 'Store in a cool and dry place'],
  reviewer: STATUS_POOL[index % STATUS_POOL.length] === 'approved' ? 'Priya Sharma' : undefined,
  approvedAt: STATUS_POOL[index % STATUS_POOL.length] === 'approved' ? `16 May 2025, 0${(index % 7) + 1}:15 PM` : undefined,
}));

export const ARTS: Art[] = ARTICLE_DATA.map((article, index) => ({
  id: `ART-${String(index + 1).padStart(3, '0')}`,
  name: article.name,
  status: statusToArt(article.status),
  at: index < 7 ? `Today, ${8 + index}:00 AM` : `16 May, 0${(index - 6) % 7}:30 PM`,
}));

export const ingredients = ARTICLE_DATA[0]?.ingredients ?? [];
export const nutritionData = ARTICLE_DATA[0]?.nutrition ?? [];
