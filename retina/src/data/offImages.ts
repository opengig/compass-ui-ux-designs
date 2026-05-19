// OpenFoodFacts image URL helpers.
// OFF stores product photos at:
//   https://images.openfoodfacts.org/images/products/{a}/{b}/{c}/{d}/{n}.jpg
// where {a}/{b}/{c}/{d} is the 13-digit barcode split as 3/3/3/4 and {n} is the image index.

const OFF_BASE = 'https://images.openfoodfacts.org/images/products';

// For the prototype every article points at this known-good barcode so the
// images load reliably across all rows.
export const PROTOTYPE_OFF_BARCODE = '8902080104048';

function barcodePath(barcode: string): string | null {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length < 8) {
    return null;
  }
  const padded = digits.padStart(13, '0').slice(-13);
  return `${padded.slice(0, 3)}/${padded.slice(3, 6)}/${padded.slice(6, 9)}/${padded.slice(9, 13)}`;
}

export interface ProductImage {
  kind: 'front' | 'back' | 'barcode' | 'more';
  label: string;
  url: string;
  ordinal: number;
}

/**
 * Returns the ordered image set: Front → Back → Barcode → More…
 * Always uses PROTOTYPE_OFF_BARCODE so the OFF photos load deterministically.
 */
export function getProductImages(
  _articleBarcode: string,
  options: { count?: number } = {},
): ProductImage[] {
  const count = options.count ?? 6;
  const path = barcodePath(PROTOTYPE_OFF_BARCODE);
  if (!path) {
    return [];
  }
  const url = (n: number) => `${OFF_BASE}/${path}/${n}.jpg`;
  const images: ProductImage[] = [
    { kind: 'front', label: 'Front', url: url(1), ordinal: 1 },
    { kind: 'back', label: 'Back', url: url(2), ordinal: 2 },
    { kind: 'barcode', label: 'Barcode', url: url(3), ordinal: 3 },
  ];
  for (let i = 4; i <= count; i += 1) {
    images.push({ kind: 'more', label: `More ${i - 3}`, url: url(i), ordinal: i });
  }
  return images;
}

export function getFrontImage(_barcode: string): string {
  const path = barcodePath(PROTOTYPE_OFF_BARCODE);
  if (!path) {
    return '';
  }
  return `${OFF_BASE}/${path}/1.jpg`;
}
