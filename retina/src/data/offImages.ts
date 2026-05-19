/**
 * Product image URLs for the article-sme prototype.
 *
 * We have 3 demo products, each with a front + back photo (saved in
 * `public/product-images/product-{1,2,3}-{front,back}.jpg`, sourced from
 * Grofers CDN at 600×600).
 *
 * Behaviour:
 *   - Each article is deterministically assigned to one of the 3 products
 *     based on a hash of its barcode. Two articles with the same barcode
 *     always show the same product (stable across renders).
 *   - When a specific article is opened, only its product's photos are shown
 *     across Front / Back / Barcode / More slots. We never mix photos from
 *     different products on the same article.
 */

interface Product {
  front: string;
  back: string;
}

// Pool of demo products. Add new pairs here and they'll be distributed
// across articles automatically.
const PRODUCTS: Product[] = [
  { front: '/product-images/product-1-front.jpg', back: '/product-images/product-1-back.jpg' },
  { front: '/product-images/product-2-front.jpg', back: '/product-images/product-2-back.jpg' },
  { front: '/product-images/product-3-front.jpg', back: '/product-images/product-3-back.jpg' },
];

/** Kept exported for back-compat with anything still importing it. */
export const PROTOTYPE_OFF_BARCODE = '8902080104048';

// Stable hash so the same barcode always maps to the same product.
function pickProduct(barcode: string): Product {
  const key = barcode || 'fallback';
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PRODUCTS[h % PRODUCTS.length];
}

export interface ProductImage {
  kind: 'front' | 'back' | 'barcode' | 'more';
  label: string;
  url: string;
  ordinal: number;
}

/**
 * Returns the image set for a specific article — but only photos from
 * THAT article's assigned product (never mixed with other products).
 * Front gets the front photo; Back/Barcode/More all use the back photo
 * since each product only has two real photos.
 */
export function getProductImages(
  articleBarcode: string,
  options: { count?: number } = {},
): ProductImage[] {
  const count = options.count ?? 6;
  const p = pickProduct(articleBarcode);
  const images: ProductImage[] = [
    { kind: 'front', label: 'Front', url: p.front, ordinal: 1 },
    { kind: 'back', label: 'Back', url: p.back, ordinal: 2 },
    { kind: 'barcode', label: 'Barcode', url: p.back, ordinal: 3 },
  ];
  for (let i = 4; i <= count; i += 1) {
    images.push({
      kind: 'more',
      label: `More ${i - 3}`,
      url: i % 2 === 0 ? p.front : p.back,
      ordinal: i,
    });
  }
  return images;
}

/** Front thumbnail for an article — used by the article list. Picks the
 *  product deterministically by barcode so list ↔ detail view stay aligned. */
export function getFrontImage(barcode: string): string {
  return pickProduct(barcode).front;
}
