export type ArticleStatus =
  | 'pending_review'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

export type ReviewSection = 'ingredients' | 'nutrition' | 'allergens' | 'claims';

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
  site: string;
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
  site: string;
  status: ArtStatus;
  at: string;
}

export const SITES = ['BigBasket', 'Blinkit', 'Zepto', 'Swiggy Instamart'];

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

const articleSeed = [
  { id: 'APL-00389', name: 'Amul Butter 500g', site: 'BigBasket', status: 'pending_review' as ArticleStatus },
  { id: 'APL-00198', name: 'Britannia Marie Lite 200g', site: 'BigBasket', status: 'needs_changes' as ArticleStatus },
  { id: 'APL-00103', name: 'Parle-G Biscuits 100g', site: 'Blinkit', status: 'approved' as ArticleStatus },
  { id: 'APL-00044', name: 'Tata Salt Lite 1kg', site: 'Blinkit', status: 'rejected' as ArticleStatus },
  { id: 'APL-00621', name: 'Maggi Masala Noodles 70g', site: 'Zepto', status: 'in_review' as ArticleStatus },
  { id: 'APL-00742', name: 'Amul Gold Full Cream Milk 1L', site: 'Zepto', status: 'approved' as ArticleStatus },
  { id: 'APL-00831', name: 'Haldiram Aloo Bhujia 200g', site: 'Swiggy Instamart', status: 'needs_changes' as ArticleStatus },
  { id: 'APL-00512', name: 'Surf Excel Easy Wash 1kg', site: 'Swiggy Instamart', status: 'pending_review' as ArticleStatus },
  { id: 'APL-00619', name: 'Cadbury Dairy Milk 45g', site: 'BigBasket', status: 'approved' as ArticleStatus },
];

function toBarCode(index: number): string {
  return `8901000000${String(226 + index).padStart(3, '0')}`;
}

function statusToArt(status: ArticleStatus): ArtStatus {
  if (status === 'approved') {
    return 'green';
  }
  if (status === 'rejected') {
    return 'red';
  }
  return 'amber';
}

export const ARTICLE_DATA: ArticleData[] = articleSeed.map((seed, index) => ({
  id: seed.id,
  name: seed.name,
  aplCode: seed.id,
  barcode: toBarCode(index),
  site: seed.site,
  status: seed.status,
  extractedAt: `13 May 2025, 0${(index % 7) + 8}:3${index % 6} PM`,
  confidence: Math.max(72, 94 - index * 2),
  ingredients: baseIngredients.map((item, rowIndex) => ({
    ...item,
    id: `${seed.id}-ing-${rowIndex + 1}`,
    extractedText: rowIndex === 0 && index % 2 === 1 ? 'Whole Wheat Flour' : item.extractedText,
    mappedIngredient: rowIndex === 0 && index % 2 === 1 ? 'Wheat Flour' : item.mappedIngredient,
    allergen: rowIndex === 0 && index % 2 === 1 ? 'Yes' : item.allergen,
    allergenType: rowIndex === 0 && index % 2 === 1 ? 'Gluten' : item.allergenType,
  })),
  nutrition: baseNutrition.map((item, rowIndex) => ({
    ...item,
    id: `${seed.id}-nut-${rowIndex + 1}`,
    extractedValue:
      item.nutrient === 'Energy'
        ? String(Number(item.extractedValue) + index * 4)
        : item.extractedValue,
    status: rowIndex > 2 && seed.status !== 'approved' ? 'Review' : item.status,
  })),
  allergens:
    index % 2 === 0
      ? [
          { id: `${seed.id}-allergen-1`, name: 'Dairy', level: 'contains' },
          { id: `${seed.id}-allergen-2`, name: 'Soy', level: 'may_contain' },
        ]
      : [
          { id: `${seed.id}-allergen-1`, name: 'Gluten', level: 'contains' },
          { id: `${seed.id}-allergen-2`, name: 'Nuts', level: 'may_contain' },
        ],
  claims: ['No artificial colours', 'Store in a cool and dry place'],
  reviewer: seed.status === 'approved' ? 'Priya Sharma' : undefined,
  approvedAt: seed.status === 'approved' ? `16 May 2025, 0${index + 1}:15 PM` : undefined,
}));

export const ARTS: Art[] = ARTICLE_DATA.map((article, index) => ({
  id: `ART-${String(index + 1).padStart(3, '0')}`,
  name: article.name,
  site: article.site,
  status: statusToArt(article.status),
  at: index < 7 ? `Today, ${8 + index}:00 AM` : `16 May, 0${index - 6}:30 PM`,
}));

export const ingredients = ARTICLE_DATA[0]?.ingredients ?? [];
export const nutritionData = ARTICLE_DATA[0]?.nutrition ?? [];