import type { MOG } from "@/lib/types";

export const INCREMENTAL_BATCH = { addedOn: "2026-02-01", count: 10 };

export const MOGS: MOG[] = [
  // ── Nuts & Dry Fruits ──────────────────────────────────────────────────────
  { id: "mog-00004", name: "Almond Whole", type: "elementary", genericIngredient: "Almond", category: "Nuts & Dry Fruits", scopeOrigin: "original" },
  { id: "mog-00109", name: "Cashew Nut Whole", type: "elementary", genericIngredient: "Cashew Nut", category: "Nuts & Dry Fruits", scopeOrigin: "original" },
  { id: "mog-00170", name: "Coconut Dry Whole", type: "elementary", genericIngredient: "Coconut", category: "Nuts & Dry Fruits", scopeOrigin: "original" },
  { id: "mog-00475", name: "Raisins Dried Green", type: "elementary", genericIngredient: "Raisins", category: "Nuts & Dry Fruits", scopeOrigin: "original" },
  { id: "mog-00991", name: "Pistachio Powder", type: "elementary", genericIngredient: "Pistachio", category: "Nuts & Dry Fruits", scopeOrigin: "original" },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  { id: "mog-00014", name: "Apple Whole Local", type: "elementary", genericIngredient: "Apple", category: "Fruits", scopeOrigin: "original" },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  { id: "mog-00095", name: "Capsicum Green Fresh", type: "elementary", genericIngredient: "Capsicum", category: "Vegetables", scopeOrigin: "original" },
  { id: "mog-00103", name: "Carrot Red Fresh", type: "elementary", genericIngredient: "Carrot", category: "Vegetables", scopeOrigin: "original" },
  { id: "mog-00296", name: "Jalapeno Sliced", type: "elementary", genericIngredient: "Jalapeno", category: "Vegetables", scopeOrigin: "original" },
  { id: "mog-00604", name: "Arugula Leaves Fresh", type: "elementary", genericIngredient: "Arugula", category: "Vegetables", scopeOrigin: "original" },

  // ── Bakery ─────────────────────────────────────────────────────────────────
  { id: "mog-00063", name: "Bread Regular Brown", type: "elementary", genericIngredient: "Bread", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00067", name: "Bread Regular Jumbo White", type: "elementary", genericIngredient: "Bread", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00068", name: "Bread Regular Multigrain", type: "elementary", genericIngredient: "Bread", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00154", name: "Choco Chips Dark", type: "elementary", genericIngredient: "Chocolate", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00156", name: "Chocolate Compound Dark", type: "elementary", genericIngredient: "Chocolate", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00879", name: "Cream Roll", type: "elementary", genericIngredient: "Roll", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00949", name: "Sesame Bun", type: "elementary", genericIngredient: "Bun", category: "Bakery", scopeOrigin: "original" },
  { id: "mog-00908", name: "Eggless Vanilla Muffin Premix", type: "composite", genericIngredient: "Premix", category: "Bakery", scopeOrigin: "incremental", scopeAddedOn: "2026-02-01" },
  { id: "mog-01008", name: "Eggless Red Velvet Cake Premix", type: "composite", genericIngredient: "Premix", category: "Bakery", scopeOrigin: "incremental", scopeAddedOn: "2026-02-01" },
  { id: "mog-01043", name: "Eggless Chocolate Muffin Premix", type: "composite", genericIngredient: "Premix", category: "Bakery", scopeOrigin: "incremental", scopeAddedOn: "2026-02-01" },

  // ── Baking ─────────────────────────────────────────────────────────────────
  { id: "mog-00176", name: "Cooking Soda Powder", type: "elementary", genericIngredient: "Baking Soda", category: "Baking", scopeOrigin: "original" },
  { id: "mog-00230", name: "Essence Vanilla", type: "elementary", genericIngredient: "Vanilla", category: "Baking", scopeOrigin: "original" },
  { id: "mog-00254", name: "Gelatin Powder", type: "elementary", genericIngredient: "Gelatin", category: "Baking", scopeOrigin: "original" },

  // ── Dairy ──────────────────────────────────────────────────────────────────
  { id: "mog-00087", name: "Butter Yellow Salted Table", type: "elementary", genericIngredient: "Butter", category: "Dairy", scopeOrigin: "original" },
  { id: "mog-00188", name: "Curd Cup", type: "elementary", genericIngredient: "Curd", category: "Dairy", scopeOrigin: "original" },
  { id: "mog-00651", name: "Cheese Mozzarella", type: "elementary", genericIngredient: "Cheese", category: "Dairy", scopeOrigin: "original" },
  { id: "mog-00844", name: "Coconut Milk Powder", type: "elementary", genericIngredient: "Coconut Milk", category: "Dairy", scopeOrigin: "original" },
  { id: "mog-00869", name: "Milk Made RTU", type: "elementary", genericIngredient: "Condensed Milk", category: "Dairy", scopeOrigin: "original" },
  { id: "mog-00910", name: "Cream Cheese RTU", type: "elementary", genericIngredient: "Cream Cheese", category: "Dairy", scopeOrigin: "original" },

  // ── Spices ─────────────────────────────────────────────────────────────────
  { id: "mog-00162", name: "Cinnamon Powder", type: "elementary", genericIngredient: "Cinnamon", category: "Spices", scopeOrigin: "original" },
  { id: "mog-00215", name: "Deggi Chilli Powder", type: "elementary", genericIngredient: "Chilli", category: "Spices", scopeOrigin: "original" },
  { id: "mog-00374", name: "Mustard Seeds Yellow", type: "elementary", genericIngredient: "Mustard Seeds", category: "Spices", scopeOrigin: "original" },
  { id: "mog-00488", name: "Red Chilli Guntur Whole Stemless", type: "elementary", genericIngredient: "Red Chilli", category: "Spices", scopeOrigin: "original" },
  { id: "mog-00490", name: "Red Chilli Powder", type: "elementary", genericIngredient: "Red Chilli", category: "Spices", scopeOrigin: "original" },
  { id: "mog-00655", name: "Kashmiri Chilli Whole", type: "elementary", genericIngredient: "Kashmiri Chilli", category: "Spices", scopeOrigin: "original" },
  { id: "mog-00894", name: "Oregano Spice Mix", type: "composite", genericIngredient: "Oregano", category: "Spices", scopeOrigin: "original" },

  // ── Condiments ─────────────────────────────────────────────────────────────
  { id: "mog-00491", name: "Red Chilli Sauce RTU", type: "elementary", genericIngredient: "Red Chilli Sauce", category: "Condiments", scopeOrigin: "original" },
  { id: "mog-00530", name: "Soya Sauce Dark", type: "elementary", genericIngredient: "Soya Sauce", category: "Condiments", scopeOrigin: "original" },
  { id: "mog-00531", name: "Soya Sauce Light", type: "elementary", genericIngredient: "Soya Sauce", category: "Condiments", scopeOrigin: "original" },
  { id: "mog-00583", name: "Vinegar Synthetic White", type: "elementary", genericIngredient: "Vinegar", category: "Condiments", scopeOrigin: "original" },
  { id: "mog-00861", name: "Mustard Sauce", type: "elementary", genericIngredient: "Mustard", category: "Condiments", scopeOrigin: "original" },
  { id: "mog-01167", name: "Schezwan Sauce RTU", type: "elementary", genericIngredient: "Schezwan Sauce", category: "Condiments", scopeOrigin: "original" },

  // ── Pulses ─────────────────────────────────────────────────────────────────
  { id: "mog-00202", name: "Dal Moong Split", type: "elementary", genericIngredient: "Moong Dal", category: "Pulses", scopeOrigin: "original" },

  // ── Oils & Fats ────────────────────────────────────────────────────────────
  { id: "mog-00256", name: "Ghee Vanaspati", type: "elementary", genericIngredient: "Ghee", category: "Oils & Fats", scopeOrigin: "original" },
  { id: "mog-00515", name: "Salad Oil RTU", type: "elementary", genericIngredient: "Salad Oil", category: "Oils & Fats", scopeOrigin: "original" },

  // ── Flour ──────────────────────────────────────────────────────────────────
  { id: "mog-00483", name: "Rava Sooji", type: "elementary", genericIngredient: "Semolina", category: "Flour", scopeOrigin: "original" },
  { id: "mog-00597", name: "Whole Wheat Flour Atta", type: "elementary", genericIngredient: "Atta", category: "Flour", scopeOrigin: "original" },

  // ── Grains ─────────────────────────────────────────────────────────────────
  { id: "mog-00503", name: "Rice Ponni Raw", type: "elementary", genericIngredient: "Rice", category: "Grains", scopeOrigin: "original" },
  { id: "mog-00843", name: "Rice Zeerga Sambha", type: "elementary", genericIngredient: "Rice", category: "Grains", scopeOrigin: "original" },
  { id: "mog-00998", name: "Rice Sticky", type: "elementary", genericIngredient: "Rice", category: "Grains", scopeOrigin: "original" },

  // ── Cereals ────────────────────────────────────────────────────────────────
  { id: "mog-00181", name: "Cornflakes", type: "elementary", genericIngredient: "Cornflakes", category: "Cereals", scopeOrigin: "original" },

  // ── Noodles & Pasta ────────────────────────────────────────────────────────
  { id: "mog-00580", name: "Vermicelli Plain", type: "elementary", genericIngredient: "Vermicelli", category: "Noodles", scopeOrigin: "original" },
  { id: "mog-01025", name: "Noodles Soba", type: "elementary", genericIngredient: "Noodles", category: "Noodles", scopeOrigin: "original" },

  // ── Snacks ─────────────────────────────────────────────────────────────────
  { id: "mog-00362", name: "Moong Dal Vadi RTU", type: "elementary", genericIngredient: "Dal Vadi", category: "Snacks", scopeOrigin: "original" },
  { id: "mog-00611", name: "Papad Appalam", type: "elementary", genericIngredient: "Papad", category: "Snacks", scopeOrigin: "original" },
  { id: "mog-00837", name: "Bhujia RTU", type: "elementary", genericIngredient: "Bhujia", category: "Snacks", scopeOrigin: "original" },
  { id: "mog-00838", name: "Navrattan Mix RTU", type: "composite", genericIngredient: "Snack Mix", category: "Snacks", scopeOrigin: "original" },
  { id: "mog-00877", name: "Banana Chips", type: "elementary", genericIngredient: "Banana Chips", category: "Snacks", scopeOrigin: "original" },

  // ── Beverages ──────────────────────────────────────────────────────────────
  { id: "mog-00711", name: "Iced Tea Syrup", type: "elementary", genericIngredient: "Tea Syrup", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-00539", name: "Sugar Brown", type: "elementary", genericIngredient: "Brown Sugar", category: "Sweeteners", scopeOrigin: "original" },
  { id: "mog-00718", name: "Sugar Free Sachet", type: "elementary", genericIngredient: "Sugar Substitute", category: "Sweeteners", scopeOrigin: "original" },
  { id: "mog-00808", name: "Tea Bag - Assam", type: "elementary", genericIngredient: "Tea", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-00865", name: "Filter Coffee Powder 70:30", type: "elementary", genericIngredient: "Coffee", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-00897", name: "Cold Pressed Juice", type: "elementary", genericIngredient: "Juice", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-00898", name: "Tetra Packed Juice 1 Liter", type: "elementary", genericIngredient: "Juice", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-00951", name: "Irani Tea Powder", type: "elementary", genericIngredient: "Tea", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-01069", name: "Mix Fruit Juice - Tetra", type: "elementary", genericIngredient: "Mixed Fruit Juice", category: "Beverages", scopeOrigin: "original" },
  { id: "mog-01089", name: "Roohafza", type: "elementary", genericIngredient: "Rose Syrup", category: "Beverages", scopeOrigin: "original" },

  // ── Frozen Foods ───────────────────────────────────────────────────────────
  { id: "mog-01034", name: "Soya Paratha Frozen", type: "elementary", genericIngredient: "Paratha", category: "Frozen Foods", scopeOrigin: "incremental", scopeAddedOn: "2026-01-15" },
  { id: "mog-01037", name: "Paneer Paratha Frozen", type: "elementary", genericIngredient: "Paratha", category: "Frozen Foods", scopeOrigin: "incremental", scopeAddedOn: "2026-01-15" },
  { id: "mog-01054", name: "Jalapeno Cheese Pops Frozen", type: "elementary", genericIngredient: "Jalapeno Cheese", category: "Frozen Foods", scopeOrigin: "incremental", scopeAddedOn: "2026-01-15" },
  { id: "mog-01170", name: "Chicken Spring Roll Frozen", type: "elementary", genericIngredient: "Chicken Spring Roll", category: "Frozen Foods", scopeOrigin: "incremental", scopeAddedOn: "2026-01-15" },
  { id: "mog-01174", name: "Chicken Patty Frozen", type: "elementary", genericIngredient: "Chicken Patty", category: "Frozen Foods", scopeOrigin: "incremental", scopeAddedOn: "2026-01-15" },
];
