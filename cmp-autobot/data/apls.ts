import type { APL } from "@/lib/types";

const HYD = "site-hyd-hi";
const D = "2026-04-16T04:12:00+05:30";

function apl(
  id: string,
  genericName: string,
  characteristic: string,
  brand: string,
  packSize: string,
  cost: number,
  cat?: string,
  status: "active" | "inactive" = "active",
): APL {
  return {
    id,
    genericName,
    characteristic,
    brand,
    packSize,
    costPerUnit: cost,
    currency: "INR",
    siteId: HYD,
    status,
    lastModified: D,
    categoryName: cat,
    dataQuality: { complete: true, missingFields: [] },
  };
}

export const APLS: APL[] = [
  // ── Nuts & Dry Fruits ──────────────────────────────────────────────────────
  apl("apl-100063001", "Almond", "Giri Whole", "UB", "1×1 kg", 750, "Nuts & Dry Fruits"),
  apl("apl-101980001", "Cashewnut", "2 Pieces Whole", "UB", "1×1 kg", 860, "Nuts & Dry Fruits"),
  apl("apl-102238",    "Coconut Dry", "Whole", "UB", "1×10 kg", 95, "Nuts & Dry Fruits"),
  apl("apl-102372",    "Kismiss", "Raisins", "UB", "1×1 kg", 185, "Nuts & Dry Fruits"),
  apl("apl-102853",    "Pista", "Local Whole", "UB", "1×1 kg", 1180, "Nuts & Dry Fruits"),

  // ── Fruits ─────────────────────────────────────────────────────────────────
  apl("apl-202602001", "Apple", "Royal Gala", "MK", "1×1 kg", 165, "Fruits"),

  // ── Vegetables ─────────────────────────────────────────────────────────────
  apl("apl-202566001", "Capsicum", "Snack", "Simply Fresh", "1×1 kg", 82, "Vegetables"),
  apl("apl-200817001", "Carrot", "Loose", "UB", "1×1 kg", 38, "Vegetables"),
  apl("apl-202541008", "Lettuce Rocket", "Leaves", "Simply Fresh", "1×1 kg", 290, "Vegetables"),
  apl("apl-108022",    "Nachos", "Jalapeno Salsalito", "S&J", "15×150 g", 145, "Vegetables"),

  // ── Bakery ─────────────────────────────────────────────────────────────────
  apl("apl-205433",    "Bread", "Whole Multigrain", "UB", "1×800 g", 54, "Bakery"),
  apl("apl-205529",    "Bread ST", "Whole Multigrain", "ST", "1×950 g", 58, "Bakery"),
  apl("apl-208844",    "Bread", "Multi Grain Sour", "BH", "1×800 g", 56, "Bakery"),
  apl("apl-201999",    "Bread Modern", "Jumbo Sandwich", "Modern", "1×800 g", 55, "Bakery"),
  apl("apl-205530",    "Bread ST", "Whole Wheat", "ST", "1×850 g", 52, "Bakery"),
  apl("apl-205435",    "Bun", "Maska", "UB", "1×90 g", 18, "Bakery"),
  apl("apl-202050002", "Chocolate", "Dark Compound Premium", "2M", "1×1 kg", 450, "Bakery"),
  apl("apl-111717",    "Milk Chocolate Compound", "White", "Vanleer", "1×500 g", 385, "Bakery"),
  apl("apl-204763002", "Veg Cream Roll", "Plain", "Aapt", "1×80 g", 38, "Bakery"),
  apl("apl-206075",    "Rolls", "Spinach Cheese", "SS", "1×1 kg", 380, "Bakery"),
  apl("apl-207634",    "Veg Roll", "Masala", "UB", "1×40 g", 32, "Bakery"),
  apl("apl-112043",    "Cake Mix", "Vanilla Eggless", "Pillsbury", "1×5 kg", 385, "Bakery"),
  apl("apl-112044",    "Cake Mix", "Vanilla Eggless B Plus", "Pillsbury", "1×5 kg", 390, "Bakery"),
  apl("apl-205862",    "Cake Mix", "Chocolate Eggless B Plus", "Pillsbury", "1×5 kg", 395, "Bakery"),
  apl("apl-207641",    "Cake", "Red Velvet Eggless", "BB", "1×1 kg", 380, "Bakery"),

  // ── Baking ─────────────────────────────────────────────────────────────────
  apl("apl-112764",    "Baking Soda", "Powder", "Weikfield", "1×100 g", 35, "Baking"),
  apl("apl-201124",    "Glazed Gel", "Cake Glaze", "UB", "1×5 kg", 640, "Baking"),
  apl("apl-112175",    "Frappe Premix", "Vanilla", "Marimbula", "1×1 kg", 320, "Baking"),

  // ── Dairy ──────────────────────────────────────────────────────────────────
  apl("apl-200293001", "Cheese", "Tin Block", "Amul", "1×400 g", 420, "Dairy"),
  apl("apl-109755",    "Coconut Milk", "Powder", "Nestle", "1×1 kg", 385, "Dairy"),
  apl("apl-111285",    "Coconut Karam", "Spice Powder", "Nimmi's", "1×1 kg", 125, "Dairy"),
  apl("apl-205863",    "Curd Visakha SS", "Bulk Container", "Visakha", "1×20 kg", 42, "Dairy"),
  apl("apl-203362001", "MilkMaid Condensed Milk", "Sweetened", "Nestlé", "1×5 kg", 380, "Dairy"),
  apl("apl-205402",    "Cream Delecta", "Dairy Cream", "Delecta", "1×1 kg", 285, "Dairy"),
  apl("apl-112917",    "Ghee Cow", "Pure", "Vallhabha", "1×1 L", 585, "Oils & Fats"),

  // ── Spices ─────────────────────────────────────────────────────────────────
  apl("apl-103619",    "Cinnamon Stick", "Powder", "UB", "1×200 g", 180, "Spices"),
  apl("apl-112324",    "Chilli Powder", "Aachi", "Aachi", "1×500 g", 242, "Spices"),
  apl("apl-102422",    "Mustard Seeds", "Whole", "UB", "1×1 kg", 76, "Spices"),
  apl("apl-101187002", "Chili", "Dry Guntur Whole", "UB", "1×10 kg", 165, "Spices"),
  apl("apl-113267",    "Chilli KDL Sunlite", "Dried Whole", "KDL", "1×1 kg", 195, "Spices"),
  apl("apl-101193004", "Chili", "Whole", "UB", "1×1 kg", 148, "Spices"),
  apl("apl-104564002", "Herbs Oregano Seasoning", "Sauce", "Virgo", "1×10 g", 95, "Spices"),
  apl("apl-111287",    "Kura Karam", "Spice Powder", "Nimmi's", "1×1 kg", 122, "Spices"),

  // ── Condiments ─────────────────────────────────────────────────────────────
  apl("apl-103801009", "Sambal Oelek", "Red Chilli Paste", "WOHHUP", "1×320 g", 148, "Condiments"),
  apl("apl-101627001", "Soya Sauce", "Regular", "Kikkoman", "1×1 L", 225, "Condiments"),
  apl("apl-111330",    "Light Soya Sauce", "Light", "Lee Kum Kee", "1×500 ml", 182, "Condiments"),
  apl("apl-101619002", "Soya Sauce", "Regular", "Chings", "1×680 g", 96, "Condiments"),
  apl("apl-103292001", "Vinegar", "Cooking Wine White", "SHAO", "1×650 g", 122, "Condiments"),
  apl("apl-111665",    "Vinegar", "White", "Golden Crown", "1×700 ml", 88, "Condiments"),
  apl("apl-102302",    "French Mustard", "Yellow Paste", "UB", "1×226 g", 96, "Condiments"),
  apl("apl-111693",    "Schezwan Sauce", "Regular", "Saucier", "1×1 kg", 182, "Condiments"),

  // ── Pulses ─────────────────────────────────────────────────────────────────
  apl("apl-100981004", "Moong Dal", "Split", "UB", "1×5 kg", 112, "Pulses"),

  // ── Oils & Fats ────────────────────────────────────────────────────────────
  apl("apl-111664",    "Salad Oil", "Refined", "Golden Crown", "1×1 L", 158, "Oils & Fats"),

  // ── Flour ──────────────────────────────────────────────────────────────────
  apl("apl-102555",    "Wheat Rawa", "Semolina", "UB", "1×50 kg", 42, "Flour"),
  apl("apl-100945007", "Atta", "Ragi Flour", "UB", "1×1 kg", 96, "Flour"),

  // ── Grains ─────────────────────────────────────────────────────────────────
  apl("apl-105454001", "Rice", "Raw", "UB", "1×25 kg", 48, "Grains"),
  apl("apl-106353",    "Rice", "Brown", "Fresh-For-u", "1×1 kg", 98, "Grains"),
  apl("apl-113850",    "Rice", "Sticky MBK", "MBK", "1×2 kg", 185, "Grains"),

  // ── Cereals ────────────────────────────────────────────────────────────────
  apl("apl-103155002", "Cornflake Chocos", "Chocolate Flavour", "Kellogg's", "1×375 g", 145, "Cereals"),
  apl("apl-103155003", "Cornflake Chocos", "Chocolate Flavour", "Kellogg's", "12×475 g", 138, "Cereals"),
  apl("apl-103155004", "Cornflake Chocos", "Chocolate Flavour", "Kellogg's", "12×700 g", 135, "Cereals"),
  apl("apl-111551",    "Chocos", "Chocolate Cornflakes", "Kellogg's", "12×500 g", 136, "Cereals"),
  apl("apl-111552",    "Chocos", "Chocolate Cornflakes", "Kellogg's", "36×110 g", 142, "Cereals"),
  apl("apl-111563",    "Chocos", "Chocolate Cornflakes", "Kellogg's", "12×700 g", 134, "Cereals"),
  apl("apl-103155010", "Wheat Flakes", "Whole Wheat", "Kellogg's", "12×425 g", 148, "Cereals"),

  // ── Noodles ────────────────────────────────────────────────────────────────
  apl("apl-107391",    "Vermicelli", "Plain", "Starlion", "1×500 g", 48, "Noodles"),
  apl("apl-106500",    "Noodles", "Maggi Oats", "Nestlé", "1×73 g", 18, "Noodles"),

  // ── Snacks ─────────────────────────────────────────────────────────────────
  apl("apl-105287004", "Snacks Bhujiya Sev", "Ready to Use", "Haldiram's", "1×1 kg", 282, "Snacks"),
  apl("apl-113093",    "Garlic Mixture", "Snack Mix", "UB", "1×1 kg", 182, "Snacks"),
  apl("apl-114209",    "Aloo Bhujia", "Potato Snack", "Balasa", "1×1 kg", 162, "Snacks"),
  apl("apl-112754",    "Corn Chivda Mix", "Sweet", "Balasa", "1×1 kg", 148, "Snacks"),
  apl("apl-112731",    "Papad", "Punjabi Masala Min 4in", "Bala", "1×1 kg", 132, "Snacks"),
  apl("apl-112734",    "Papad", "Disco Udad 1.5in", "Balasa", "1×1 kg", 128, "Snacks"),
  apl("apl-112736",    "Papad", "Nachni 2in", "Balasa", "1×500 g", 118, "Snacks"),
  apl("apl-112738",    "Papad", "Corn 2in", "Balasa", "1×500 g", 122, "Snacks"),
  apl("apl-112739",    "Papad", "Bajri 2in", "Balasa", "1×500 g", 115, "Snacks"),
  apl("apl-112740",    "Papad", "Jowari 2in", "Balasa", "1×500 g", 112, "Snacks"),
  apl("apl-112741",    "Papad", "Red Chilli Potato 2in", "Balasa", "1×500 g", 118, "Snacks"),
  apl("apl-113713",    "Fryums", "2D Flower Shape", "Balasa", "1×1 kg", 148, "Snacks"),
  apl("apl-113719",    "Fryums", "Diamond Trio Shape", "Balasa", "1×1 kg", 152, "Snacks"),

  // ── Beverages ──────────────────────────────────────────────────────────────
  apl("apl-108152003", "Peach Tea Syrup", "Flavoured", "Taste Craft", "1×750 ml", 282, "Beverages"),
  apl("apl-111238",    "Peach Natural Tea Syrup", "Flavoured", "Monin", "1×700 ml", 585, "Beverages"),
  apl("apl-106239",    "Sugar Brown Sachet", "Sachet", "Trust", "1×5 g", 8, "Beverages"),
  apl("apl-113409",    "Tea Bag Assam Classic", "200nos", "Twinings", "1×200 nos", 582, "Beverages"),
  apl("apl-113415",    "Tea Bag Assam Classic", "100nos", "Twinings", "1×100 nos", 298, "Beverages"),
  apl("apl-108771001", "Coffee Filter Powder", "70:30 Blend", "Bayars", "1×1 kg", 265, "Beverages"),
  apl("apl-113145",    "Coffee Powder Agglomerated", "70:30 Blend", "Bayars", "1×200 g", 68, "Beverages"),
  apl("apl-113533",    "Cold Pressed Juice", "Assorted Glass Bottle", "NCold", "1×1 L", 185, "Beverages"),
  apl("apl-109829",    "Apple Juice MM", "Tetra Pack", "HCCB", "1×150 ml", 28, "Beverages"),
  apl("apl-110480011", "Pineapple Juice", "Tetra Pack", "Dabur Real", "1×180 ml", 32, "Beverages"),
  apl("apl-102526",    "Tea Powder", "Red Label", "Brooke Bond", "1×2 kg", 82, "Beverages"),
  apl("apl-108570001", "Tea Kohinoor Royale", "Premium Blend", "Bayars", "1×1 kg", 425, "Beverages"),
  apl("apl-109540001", "Mix Fruit Juice", "Tetra Pack", "Dabur Real", "1×1 L", 96, "Beverages"),
  apl("apl-102477",    "Roohafza", "Rose Syrup", "Hamdard", "1×750 ml", 168, "Beverages"),

  // ── Frozen Foods ───────────────────────────────────────────────────────────
  apl("apl-208873",    "Paratha", "Homestyle", "ID", "5×65 g", 182, "Frozen Foods"),
  apl("apl-205501",    "Paneer Roll ST", "Stuffed", "ST", "1×80 g", 56, "Frozen Foods"),
  apl("apl-108835",    "Jalapeno Poppers", "Cheesy", "Vista", "1×1 kg", 385, "Frozen Foods"),
  apl("apl-206076",    "Chicken Spring Roll", "Frozen", "SS", "1×1 kg", 355, "Frozen Foods"),
  apl("apl-206088",    "Burger Patty Chilli Chicken", "Frozen", "SS", "1×1.2 kg", 428, "Frozen Foods"),

  // ── Retired APLs (inactive — used as retiredAplId in Blue queue decisions) ──
  {
    ...apl("apl-ret-choc-premix-old", "Chocolate Muffin Mix", "Eggless", "Chef Aid", "1×5 kg", 368, "Bakery", "inactive"),
    inactiveSince: "2026-03-15T00:00:00+05:30",
  },
  {
    ...apl("apl-ret-jalapeno-old", "Jalapeno", "Sliced Pickled", "Del Monte", "1×2.5 kg", 325, "Vegetables", "inactive"),
    inactiveSince: "2026-04-01T00:00:00+05:30",
  },
  {
    ...apl("apl-ret-sugar-brown-bulk", "Sugar Brown", "Bulk Granules", "Nature Brand", "1×25 kg", 48, "Sweeteners", "inactive"),
    inactiveSince: "2026-02-28T00:00:00+05:30",
  },
  // Replacement APL for the Sugar Brown mapped decision
  // apl("apl-sugar-brown-dhampure", "Sugar Brown", "Granules", "Dhampure", "1×25 kg", 52, "Sweeteners"),

  // ── Low-confidence RED matches ─────────────────────────────────────────────
  apl("apl-101895001", "Salt", "Table", "Aashirwaad", "1×1 kg", 28, "Seasoning"),

  // ── No-match APLs (appear as dangling exceptions) ──────────────────────────
  apl("apl-112749",    "Plain Boondi", "For Raita", "Balasa", "1×1 kg", 145, "Snacks"),
  apl("apl-202400001", "Broccoli", "Frozen", "UB", "1×1 kg", 185, "Vegetables"),
  apl("apl-200858001", "Egg", "White 30nos Tray", "UB", "1×30 nos", 165, "Poultry"),
  apl("apl-104131",    "Sev", "Plain", "UB", "1×1 kg", 138, "Snacks"),
  apl("apl-112016",    "Mushroom Porcini", "Dried", "UB", "1×500 g", 485, "Vegetables"),
  apl("apl-103115",    "Oats", "Regular", "Kellogg's", "1×800 g", 188, "Cereals"),
  apl("apl-201978",    "Prawns Premium", "Frozen", "UB", "1×1 kg", 485, "Seafood"),
  apl("apl-109807",    "Kinley Soda", "PET Bottle", "HCCB", "1×750 ml", 28, "Beverages"),
  apl("apl-106289",    "Maida", "Refined White Flour", "Shalimar", "1×50 kg", 38, "Flour"),
  apl("apl-102397",    "Mayonnaise", "Eggless", "Cremica", "1×1 kg", 195, "Condiments"),
];
