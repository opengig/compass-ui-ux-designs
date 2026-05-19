// @ts-nocheck
import { useState, useEffect } from "react";
import { OFF_CACHE, buildGtin, makePicsums } from "../data/images";

/**
 * Fetches real product photos from Open Food Facts for a given article.
 *
 * Strategy:
 *   1. Show picsum fallback immediately (never blank).
 *   2. Look up OFF by GTIN (derived from APL code).
 *   3. Fall back to OFF name-search if barcode misses.
 *   4. Cache the resolved photo set per article so we only fetch once.
 *
 * Returns `{ offImgs, offLink }` — both `null` until resolved.
 */

export function useOFFImages(art) {
  // ← Start with picsum immediately so users always see images from frame 1
  const [offImgs, setOffImgs] = useState(() => art ? makePicsums(art.id) : null)
  const [offLink, setOffLink] = useState(null)

  useEffect(() => {
    if (!art) return

    // Always reset to picsum for the new article first
    setOffImgs(makePicsums(art.id))
    setOffLink(null)

    // If we already fetched real OFF data, apply it right away
    if (OFF_CACHE[art.id]) {
      if (OFF_CACHE[art.id].imgs) setOffImgs(OFF_CACHE[art.id].imgs)
      if (OFF_CACHE[art.id].link) setOffLink(OFF_CACHE[art.id].link)
      return
    }

    let cancelled = false
    const gtin = buildGtin(art.apl)
    const cleanName = art.name.replace(/\s+\d+\s*(g|ml|kg|l|ltr)\b/gi, "").trim()

    const extractSlots = (p) => {
      if (!p) return null
      const slots = [
        p.image_front_url       || p.image_front_small_url       || null,
        p.image_nutrition_url   || p.image_nutrition_small_url   || null,
        p.image_ingredients_url || p.image_ingredients_small_url || null,
        null,  // OFF has no separate barcode photo
      ]
      return slots.some(Boolean) ? slots : null
    }

    const applyOFF = (slots, code) => {
      if (cancelled) return
      // Merge: real OFF URL where available, picsum where not
      const picsums = makePicsums(art.id)
      const merged  = slots.map((u, i) => u || picsums[i])
      const link    = code ? `https://world.openfoodfacts.org/product/${code}` : null
      OFF_CACHE[art.id] = { imgs: merged, link }
      setOffImgs(merged)
      if (link) setOffLink(link)
    }

    // 1. Try exact barcode
    fetch(
      `https://world.openfoodfacts.org/api/v2/product/${gtin}.json` +
      `?fields=code,image_front_url,image_front_small_url,image_nutrition_url,image_nutrition_small_url,image_ingredients_url,image_ingredients_small_url`
    )
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.status === 1) {
          const slots = extractSlots(data.product)
          if (slots) { applyOFF(slots, data.product.code); return }
        }
        // 2. Name search
        return fetch(
          `https://world.openfoodfacts.org/cgi/search.pl` +
          `?search_terms=${encodeURIComponent(cleanName)}&json=1&page_size=5` +
          `&fields=code,product_name,image_front_url,image_front_small_url,image_nutrition_url,image_nutrition_small_url,image_ingredients_url,image_ingredients_small_url`
        )
          .then(r => r.json())
          .then(sData => {
            if (cancelled) return
            for (const p of (sData.products || [])) {
              const slots = extractSlots(p)
              if (slots) { applyOFF(slots, p.code); return }
            }
            // No OFF match — picsum already showing, just mark as resolved
            OFF_CACHE[art.id] = { imgs: null, link: null }
          })
      })
      .catch(() => {
        // Network error — picsum already showing, nothing to do
        if (!cancelled) OFF_CACHE[art.id] = { imgs: null, link: null }
      })

    return () => { cancelled = true }
  }, [art?.id])

  return { offImgs, offLink }
}
