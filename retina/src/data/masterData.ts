// Master reference data for the Catalog screen and ingredient/allergen lookups.
// All entries are sourced from the user's authoritative spreadsheet dump.

export interface AllergenMaster {
  code: string;
  name: string;
}

export interface NutrientMaster {
  code: string;
  name: string;
  uom: string;
  group: 'Macro' | 'Micro' | 'Fiber' | 'Index';
  order: number;
}

export interface IngredientMaster {
  code: string;
  name: string;
  uom: string;
  alias: string;
}

export const ALLERGEN_MASTER: AllergenMaster[] = [
  { code: 'ALG-00001', name: 'Egg' },
  { code: 'ALG-00002', name: 'Fish' },
  { code: 'ALG-00003', name: 'Milk' },
  { code: 'ALG-00004', name: 'Peanut' },
  { code: 'ALG-00005', name: 'Soya' },
  { code: 'ALG-00006', name: 'Tree Nuts' },
  { code: 'ALG-00007', name: 'Wheat' },
  { code: 'ALG-00008', name: 'Crustacean Shellfish' },
  { code: 'ALG-00009', name: 'Cereals' },
  { code: 'ALG-00010', name: 'Buckwheat' },
  { code: 'ALG-00011', name: 'Celery (including celeriac)' },
  { code: 'ALG-00012', name: 'Lupin' },
  { code: 'ALG-00013', name: 'Molluscan Shellfish' },
  { code: 'ALG-00014', name: 'Mustard' },
  { code: 'ALG-00015', name: 'Sesame Seeds' },
  { code: 'ALG-00016', name: 'Aspartame' },
  { code: 'ALG-00017', name: 'Sulphur Dioxide and Sulphites' },
  { code: 'ALG-00018', name: 'None' },
];

export const NUTRIENT_MASTER: NutrientMaster[] = [
  { code: 'NTR-00001', name: 'Energy', uom: 'kcal', group: 'Macro', order: 1 },
  { code: 'NTR-00003', name: 'Carb', uom: 'g', group: 'Macro', order: 2 },
  { code: 'NTR-00004', name: 'Protein', uom: 'g', group: 'Macro', order: 3 },
  { code: 'NTR-00006', name: 'Total Fat', uom: 'g', group: 'Macro', order: 4 },
  { code: 'NTR-00010', name: 'Total Dietary Fiber', uom: 'g', group: 'Fiber', order: 5 },
  { code: 'NTR-00013', name: 'Sodium', uom: 'mg', group: 'Micro', order: 6 },
  { code: 'NTR-00020', name: 'Potassium', uom: 'mg', group: 'Micro', order: 7 },
  { code: 'NTR-00014', name: 'Added Sugar', uom: 'g', group: 'Macro', order: 8 },
  { code: 'NTR-00021', name: 'GI-c +_5', uom: 'Index', group: 'Index', order: 9 },
  { code: 'NTR-00022', name: 'GL-c +_4', uom: 'Index', group: 'Index', order: 10 },
  { code: 'NTR-00007', name: 'Sat Fat', uom: 'g', group: 'Macro', order: 11 },
  { code: 'NTR-00008', name: 'MUFA', uom: 'g', group: 'Macro', order: 12 },
  { code: 'NTR-00009', name: 'PUFA', uom: 'g', group: 'Macro', order: 13 },
  { code: 'NTR-00011', name: 'Insoluble Fiber', uom: 'g', group: 'Fiber', order: 14 },
  { code: 'NTR-00012', name: 'Soluble Fiber', uom: 'g', group: 'Fiber', order: 15 },
  { code: 'NTR-00015', name: 'Iron', uom: 'mg', group: 'Micro', order: 16 },
  { code: 'NTR-00016', name: 'Calcium', uom: 'mg', group: 'Micro', order: 17 },
  { code: 'NTR-00017', name: 'Zinc', uom: 'mg', group: 'Micro', order: 18 },
  { code: 'NTR-00018', name: 'Vitamin A (beta-carotene)', uom: 'mcg', group: 'Micro', order: 19 },
  { code: 'NTR-00019', name: 'Vitamin C', uom: 'mg', group: 'Micro', order: 20 },
  { code: 'NTR-00002', name: 'GI of ingredients', uom: 'Index', group: 'Index', order: 21 },
  { code: 'NTR-00005', name: 'Insulin Index +_5', uom: 'Index', group: 'Index', order: 22 },
];

// Ingredient master list — code | name | uom | alias (alias optional).
// Pipe-delimited template string keeps the file compact; parsed once at module load.
const INGREDIENT_RAW = `
MOG-00001|Ajwain Whole|Kg|
MOG-00002|Almond Flakes with Skin|Kg|
MOG-00003|Almond Flakes without Skin|Kg|
MOG-00004|Almond Whole|Kg|
MOG-00005|Amaranth Leaves Red and Green|Kg|
MOG-00006|Amaranth Seed Pale Brown|Kg|
MOG-00007|Amchur Powder|Kg|
MOG-00008|American Corn Frozen|Kg|
MOG-00009|Saunf Green|Kg|Aniseed Cooking Whole, Fennel
MOG-00010|Aniseed Plain Mouth Freshener|Kg|
MOG-00011|Aniseed Sugar Coated|Kg|
MOG-00012|Apple Green Whole|Kg|
MOG-00013|Apple Whole Imported|Kg|
MOG-00014|Apple Whole Local|Kg|
MOG-00015|Apricot Dried|Kg|
MOG-00016|Apricot Whole|Kg|
MOG-00017|Aromat Seasoning|Kg|
MOG-00018|Arvi Fresh|Kg|Colocasia
MOG-00019|Asafoetida Cake|Kg|
MOG-00020|Asafoetida Powder|Kg|
MOG-00021|White Pumpkin|Kg|Ash Gourd Fresh
MOG-00022|Asparagus Fresh|Kg|
MOG-00023|Avocado Fresh|Kg|
MOG-00024|Baby Corn Fresh|Kg|
MOG-00025|Baby Potato Fresh|Kg|
MOG-00026|Bacon Strips|Kg|
MOG-00027|Bael Fruit|Kg|
MOG-00028|Bajra Whole|Kg|
MOG-00029|Baked Beans Can|Kg|
MOG-00030|Baking Powder|Kg|
MOG-00031|Bamboo Shoot Fresh|Kg|
MOG-00032|Bamboo Skewers 6"|Kg|
MOG-00033|Banana Fruit Whole|Kg|
MOG-00034|Banana Leaf Fresh|Kg|
MOG-00035|Banana Raw Fresh|Kg|
MOG-00036|Banana Red Whole|Kg|
MOG-00037|Banana Steam Fresh|Kg|
MOG-00038|Banana Yelakki Whole|Kg|
MOG-00039|Barley Flour|Kg|
MOG-00040|Barley Whole|Kg|
MOG-00041|Basil Fresh|Kg|
MOG-00042|Basundi|Kg|
MOG-00043|Bathua Leaves|Kg|
MOG-00044|Bay Leaves Whole|Kg|
MOG-00045|BBQ Sauce|Kg|
MOG-00046|Beetroot Fresh|Kg|
MOG-00047|Besan Chana Dal|Kg|
MOG-00048|Besan Vatana Dal|Kg|
MOG-00049|Bitter Gourd Fresh|Kg|
MOG-00050|Black Berry Whole|Kg|
MOG-00051|Kalonji|Kg|Black Onion Seeds
MOG-00052|Black Pepper Powder|Kg|
MOG-00053|Black Pepper Whole|Kg|
MOG-00054|Blue Berry Dry|Kg|
MOG-00055|Blue Berry Whole|Kg|
MOG-00056|Bok Choy Fresh|Kg|
MOG-00057|Boondi|Kg|
MOG-00058|Lauki|Kg|Bottle Gourd Fresh
MOG-00059|Bournvita|Kg|
MOG-00060|Bread Crumbs|Kg|
MOG-00061|Bread Improver|Kg|
MOG-00062|Bread Regular Atta|Kg|
MOG-00063|Bread Regular Brown|Kg|
MOG-00064|Bread Regular Jumbo Atta|Kg|
MOG-00065|Bread Regular Jumbo Brown|Kg|
MOG-00066|Bread Regular Jumbo Multigrain|Kg|
MOG-00067|Bread Regular Jumbo White|Kg|
MOG-00068|Bread Regular Multigrain|Kg|
MOG-00069|Bread Regular White|Kg|
MOG-00070|Brinjal Big Fresh|Kg|
MOG-00071|Brinjal Long Green Fresh|Kg|
MOG-00072|Brinjal Long Violet Fresh|Kg|
MOG-00073|Brinjal Small Green Fresh|Kg|
MOG-00074|Brinjal Small Violet Fresh|Kg|
MOG-00075|Broad Beans Fresh|Kg|
MOG-00076|Broccoli Fresh|Kg|
MOG-00077|Broth Powder RTU|Kg|
MOG-00078|Brown Sauce Demi Glace Powder RTU|Kg|
MOG-00079|Brussels Sprouts|Kg|
MOG-00080|Burger Bun Atta RTU|Kg|
MOG-00081|Burger Bun Brown RTU|Kg|
MOG-00082|Burger Bun Multigrain RTU|Kg|
MOG-00083|Burger Bun Regular RTU|Kg|
MOG-00084|Burger Bun White RTU|Kg|
MOG-00085|Butter Nutralite|Kg|
MOG-00086|Butter Yellow Salted Chiplet|Kg|
MOG-00087|Butter Yellow Salted Table|Kg|
MOG-00088|Butterscotch Ice Cream|Kg|
MOG-00089|Cabbage Chinese Fresh|Kg|
MOG-00090|Cabbage Green Fresh|Kg|
MOG-00091|Cabbage Red Fresh|Kg|
MOG-00092|Cabbage Violet Fresh|Kg|
MOG-00093|Cake Gel|Kg|
MOG-00094|Calcium Propionate|Kg|
MOG-00095|Capsicum Green Fresh|Kg|
MOG-00096|Capsicum Red Fresh|Kg|
MOG-00097|Capsicum Yellow Fresh|Kg|
MOG-00098|Caramel Sauce|Kg|
MOG-00099|Cardamom Black Whole|Kg|
MOG-00100|Cardamom Green Whole|Kg|
MOG-00101|Carrot Baby Fresh|Kg|
MOG-00102|Carrot Orange Fresh|Kg|
MOG-00103|Carrot Red Fresh|Kg|
MOG-00104|Cashew Nut Baby|Kg|
MOG-00105|Cashew Nut Eight Pieces|Kg|
MOG-00106|Cashew Nut Four pieces|Kg|
MOG-00107|Cashew Nut Kani|Kg|
MOG-00108|Cashew Nut Split|Kg|
MOG-00109|Cashew Nut Whole|Kg|
MOG-00110|Cauliflower Leaves Fresh|Kg|
MOG-00111|Cauliflower Fresh|Kg|
MOG-00112|Celery Fresh|Kg|
MOG-00113|Chaat Masala RTU|Kg|
MOG-00114|Chana Black|Kg|
MOG-00115|Chana Kabuli|Kg|
MOG-00116|Chana Masala RTU|Kg|
MOG-00117|Char Magaz Whole|Kg|
MOG-00118|Cheese Block Processed Indian|Kg|
MOG-00119|Cheese Camembert Imported|Kg|
MOG-00120|Cheese Cheddar Imported|Kg|
MOG-00121|Paneer|Kg|Cheese Cottage
MOG-00122|Cheese Feta Imported|Kg|
MOG-00123|Cheese Gorgonzola Imported|Kg|
MOG-00124|Cheese Mascarpone Imported|Kg|
MOG-00125|Cheese Parmesan|Kg|
MOG-00126|Cheese Philadelphia Imported|Kg|
MOG-00127|Cheese Slice Processed|Kg|
MOG-00128|Cheese Spread Indian|Kg|
MOG-00129|Chicken Breast Boneless Chilled|Kg|
MOG-00130|Chicken Breast Boneless Frozen|Kg|
MOG-00131|Chicken Curry Cut without Skin Chilled|Kg|
MOG-00132|Chicken Curry Cut without Skin Frozen|Kg|
MOG-00133|Chicken Curry Masala RTU|Kg|
MOG-00134|Chicken Drumsticks Chilled|Kg|
MOG-00135|Chicken Drumsticks Frozen|Kg|
MOG-00136|Chicken Liver|Kg|
MOG-00137|Chicken Lollypop Chilled|Kg|
MOG-00138|Chicken Lollypop Frozen|Kg|
MOG-00139|Chicken Mince Chilled|Kg|
MOG-00140|Chicken Mince Frozen|Kg|
MOG-00141|Chicken Sausage Frozen|Kg|
MOG-00142|Chicken Thigh Boneless Chilled|Kg|
MOG-00143|Chicken Thigh Boneless Frozen|Kg|
MOG-00144|Chicken Whole with Skin Chilled|Kg|
MOG-00145|Chicken Whole with Skin Frozen|Kg|
MOG-00146|Chicken Whole without Skin Chilled|Kg|
MOG-00147|Chicken Whole without Skin Frozen|Kg|
MOG-00148|Chicken Wings Chilled|Kg|
MOG-00149|Chicken Wings Frozen|Kg|
MOG-00150|Chikoo Whole|Kg|Sapota
MOG-00151|Chilli Bajji Fresh|Kg|
MOG-00152|Chilli Powder Yellow|Kg|
MOG-00153|Chives Fresh|Kg|
MOG-00154|Choco Chips Dark|Kg|
MOG-00155|Choco Chips White|Kg|
MOG-00156|Chocolate Compound Dark|Kg|
MOG-00157|Chocolate Compound White|Kg|
MOG-00158|Chocolate Ice Cream|Kg|
MOG-00159|Chocolate Syrup|Kg|
MOG-00160|Chow Chow Fresh|Kg|
MOG-00161|Chukka Kura Fresh|Kg|Kahtti Palak
MOG-00162|Cinnamon Powder|Kg|
MOG-00163|Cinnamon Stick Whole|Kg|
MOG-00164|Cloves Whole|Kg|
MOG-00165|Cluster Beans Fresh|Kg|
MOG-00166|Tendli Fresh|Kg|Coccinia, Dondakaya, Tondli, Kundru
MOG-00167|Coco Powder|Kg|
MOG-00168|Coconut Cream|Kg|
MOG-00169|Coconut Desiccated|Kg|
MOG-00170|Coconut Dry Whole|Kg|
MOG-00171|Coconut Fresh|Kg|
MOG-00172|Coconut Frozen|Kg|
MOG-00173|Coconut Milk|Kg|
MOG-00174|Coconut Water Fresh|Kg|
MOG-00175|Coffee Powder Instant|Kg|
MOG-00176|Cooking Soda Powder|Kg|
MOG-00177|Coriander Leaves Fresh|Kg|
MOG-00178|Coriander Powder RTU|Kg|
MOG-00179|Coriander Seeds Whole|Kg|
MOG-00180|Corn Flour|Kg|
MOG-00181|Cornflakes|Kg|
MOG-00182|Couscous RTU|Kg|
MOG-00183|Cucumber Fresh|Kg|
MOG-00184|Cumin Powder RTU|Kg|
MOG-00185|Cumin Seeds Whole|Kg|
MOG-00186|Curd Bulk|Kg|
MOG-00187|Curd Chilli RTU|Kg|
MOG-00188|Curd Cup|Kg|
MOG-00189|Curd Inhouse|Kg|
MOG-00190|Curry Leaves Fresh|Kg|
MOG-00191|Custard Apple|Kg|
MOG-00192|Custard Powder|Kg|
MOG-00193|Chowli|Kg|Lobia, Karamani, Black Eyed Pea
MOG-00194|Dal Chana Roasted|Kg|
MOG-00195|Dal Chana Split|Kg|
MOG-00196|Dal Chowli Whole|Kg|
MOG-00197|Dal Cowpea Brown|Kg|
MOG-00198|Dal Dry Peas Green|Kg|
MOG-00199|Dal Dry Peas White|Kg|
MOG-00200|Dal Masoor Split|Kg|
MOG-00201|Dal Masoor Whole|Kg|
MOG-00202|Dal Moong Split|Kg|
MOG-00203|Dal Moong Whole|Kg|
MOG-00204|Dal Moth Whole|Kg|Matki
MOG-00205|Dal Red Gram|Kg|
MOG-00206|Dal Toor|Kg|
MOG-00207|Dal Urad White Split|Kg|
MOG-00208|Dal Urad Whole White|Kg|
MOG-00209|Dal Urad Whole Black|Kg|
MOG-00210|Dates Processed|Kg|
MOG-00211|Dates Seedless Imported|Kg|
MOG-00212|Dates Seedless Indian|Kg|
MOG-00213|Dates Whole Imported|Kg|
MOG-00214|Dates Whole Indian|Kg|
MOG-00215|Deggi Chilli Powder|Kg|
MOG-00217|Dhokla Mix RTU|Kg|
MOG-00218|Dill Leaves Fresh|Kg|
MOG-00219|Dosa Batter|Kg|
MOG-00220|Surti Papdi Fresh|Kg|Vaal, Double Beans
MOG-00221|Drum Stick Fresh|Kg|
MOG-00222|Drumstick Leaves Fresh|Kg|
MOG-00223|Egg Whole Brown|Kg|
MOG-00224|Egg Whole Cage-Free|Kg|
MOG-00225|Egg Whole White|Kg|
MOG-00226|Eggplant|Kg|
MOG-00227|Eno|Kg|
MOG-00228|Essence Pineapple|Kg|
MOG-00229|Essence Rose|Kg|
MOG-00230|Essence Vanilla|Kg|
MOG-00231|Farsan Papdi RTU|Kg|
MOG-00232|Farsan Sev RTU|Kg|
MOG-00233|Fig Dried|Kg|
MOG-00234|Fig Fresh|Kg|
MOG-00235|Fish Basa Chilled|Kg|
MOG-00236|Fish Basa Frozen|Kg|
MOG-00237|Fish Hilsa Frozen|Kg|
MOG-00238|Fish Sauce RTU|Kg|
MOG-00239|Fish Shrimp Cleaned Chilled|Kg|
MOG-00240|Fish Shrimp Frozen|Kg|
MOG-00241|Fish Surmai Frozen|Kg|
MOG-00242|Flax Seeds|Kg|
MOG-00243|French Beans Fresh|Kg|French Beans Fresh (Country, Desi)
MOG-00244|French Beans Fresh (Hybrid)|Kg|
MOG-00245|French Fries RTU|Kg|
MOG-00246|Fresh Cream RTU|Kg|
MOG-00247|Fruit Cocktail RTU|Kg|
MOG-00248|Garam Masala Powder Inhouse|Kg|
MOG-00249|Garam Masala RTU|Kg|
MOG-00250|Garam Masala Sambar Inhouse|Kg|
MOG-00251|Garlic Paste RTU|Kg|
MOG-00252|Garlic Peeled Fresh|Kg|
MOG-00253|Garlic Fresh|Kg|
MOG-00254|Gelatin Powder|Kg|
MOG-00255|Desi Ghee|Kg|
MOG-00256|Ghee Vanaspati|Kg|
MOG-00257|Ginger Fresh|Kg|
MOG-00258|Ginger Garlic Paste RTU|Kg|
MOG-00259|Ginger Paste RTU|Kg|
MOG-00260|Ginger Powder RTU|Kg|
MOG-00261|Gluten Powder|Kg|
MOG-00262|Goda Masala RTU|Kg|
MOG-00263|Golden Squash Fresh|Kg|
MOG-00264|Gongura Leaves Fresh|Kg|Ambaada
MOG-00265|Gooseberry Fresh|Kg|
MOG-00266|Grapes Black Whole Imported Seeded|Kg|
MOG-00267|Grapes Black Whole Imported Seedless|Kg|
MOG-00268|Grapes Black Whole Local Seeded|Kg|
MOG-00269|Grapes Black Whole Local Seedless|Kg|
MOG-00270|Grapes Green Whole Local Seeded|Kg|
MOG-00271|Grapes Green Whole Local Seedless|Kg|
MOG-00272|Green Chilli Fresh|Kg|
MOG-00273|Green Chilli Sauce|Kg|
MOG-00274|Green Peas Frozen|Kg|
MOG-00275|Green Peas Fresh|Kg|
MOG-00276|Guava Whole|Kg|
MOG-00277|Gulab Jamun Mix RTU|Kg|
MOG-00278|Herb Basil Dried|Kg|
MOG-00279|Herb Mix Dried|Kg|
MOG-00280|Herb Oregano RTU|Kg|
MOG-00281|Herb Rosemary Dried|Kg|
MOG-00282|Herb Rosemary Fresh|Kg|
MOG-00283|Herb Thyme Dried|Kg|
MOG-00284|Honey RTU|Kg|
MOG-00285|Hot Dog Bun RTU|Kg|
MOG-00286|Idli Mix RTU|Kg|
MOG-00287|Idli Rava|Kg|
MOG-00288|Iodized Salt|Kg|
MOG-00289|Ivy Gourd Fresh|Kg|
MOG-00290|Jack Fruit Ripe Whole|Kg|Panasa
MOG-00291|Jack Fruit Fresh|Kg|
MOG-00292|Jaggery Palm|Kg|Gud
MOG-00293|Jaggery Powder|Kg|Gud
MOG-00294|Jaggery Sugarcane|Kg|
MOG-00295|Jal Jeera RTU|Kg|
MOG-00296|Jalapeno Sliced|Kg|
MOG-00297|Jam Sachet|Kg|
MOG-00298|Jelly Powder|Kg|
MOG-00299|Kaffir Lime Leaves Fresh|Kg|
MOG-00300|Kalpasi Stone Flower Whole|Kg|
MOG-00301|Karonda Fruit Dried|Kg|
MOG-00302|Kashmiri Chilli Powder|Kg|
MOG-00303|Kasoori Methi|Kg|
MOG-00304|Kasundi Sauce RTU|Kg|
MOG-00305|Kellogg's Choco RTU|Kg|
MOG-00306|Kellogg's Honey Loops RTU|Kg|
MOG-00307|Kewra Water RTU|Kg|
MOG-00308|Khoa Granules|Kg|
MOG-00309|Khoa Pindi|Kg|
MOG-00310|Kitchen King Masala RTU|Kg|
MOG-00311|Kiwi Crush|Kg|
MOG-00312|Kiwi Whole|Kg|
MOG-00313|Knol-Khol Fresh|Kg|Ganth Gobhi
MOG-00314|Kodo Millet|Kg|Varagu
MOG-00315|Kokum Syrup|Kg|
MOG-00316|Kokum Whole|Kg|
MOG-00317|Lady Finger Fresh|Kg|Bhindi
MOG-00318|Leeks Fresh|Kg|
MOG-00319|Lemon Grass Fresh|Kg|
MOG-00320|Lemon Fresh|Kg|
MOG-00321|Lettuce Green Fresh|Kg|
MOG-00322|Lettuce Iceberg Fresh|Kg|
MOG-00323|Lettuce Lolo Rosso Fresh|Kg|
MOG-00324|Lettuce Romaine Fresh|Kg|
MOG-00325|Litchi Crush|Kg|
MOG-00326|Litchi Fresh Whole|Kg|
MOG-00327|Pippali Whole|Kg|Long Pepper Whole
MOG-00328|Lotus Root|Kg|Kamal Kakdi
MOG-00329|Mace Whole|Kg|
MOG-00330|Maggi Noodle|Kg|
MOG-00331|Mango Crush|Kg|
MOG-00332|Mango Ginger|Kg|
MOG-00333|Mango Jam|Kg|
MOG-00334|Mango Raw Fresh|Kg|Kairi
MOG-00335|Mango Whole Imported|Kg|
MOG-00336|Mango Whole Local|Kg|
MOG-00337|Manila Tamarind|Kg|
MOG-00338|Marathi Moggu|Kg|
MOG-00339|Margarine Bakery|Kg|
MOG-00340|Mawa Granules|Kg|
MOG-00341|Mawa Pindi|Kg|
MOG-00342|Mayonnaise Sauce RTU|Kg|
MOG-00343|Nagkesar Whole|Kg|Mesua Whole
MOG-00344|Methi Leaves Fresh|Kg|
MOG-00345|Methi Seeds Whole|Kg|
MOG-00346|Milk Double Toned|Kg|
MOG-00347|Milk Full Cream|Kg|
MOG-00348|Milk Powder RTU|Kg|
MOG-00349|Milk Skimmed|Kg|
MOG-00350|Milk Standard|Kg|
MOG-00351|Milk Tetra|Kg|
MOG-00352|Milk Toned|Kg|
MOG-00353|Millets Amaranth Whole|Kg|Rajgira
MOG-00354|Millets Foxtail Whole|Kg|
MOG-00356|Millets Pearl Whole|Kg|
MOG-00357|Millets Proso Whole|Kg|
MOG-00358|Millets Ragi Whole|Kg|Nachini
MOG-00359|Mint Leaves Fresh|Kg|
MOG-00360|Mix Fruit Jam|Kg|
MOG-00361|Mojito Syrup|Kg|
MOG-00362|Moong Dal Vadi RTU|Kg|
MOG-00363|Murmura|Kg|
MOG-00364|Mushroom Button Fresh|Kg|
MOG-00365|Mushroom Fresh|Kg|
MOG-00366|Mushroom Oyster Dried|Kg|
MOG-00367|Mushroom Shiitake Dried|Kg|
MOG-00368|Musk Melon Whole|Kg|
MOG-00369|Mustard Dijon|Kg|
MOG-00370|Mustard English|Kg|
MOG-00371|Mustard Fresh|Kg|Sarson Fresh
MOG-00372|Mustard Powder RTU|Kg|
MOG-00373|Mustard Seeds Black|Kg|
MOG-00374|Mustard Seeds Yellow|Kg|
MOG-00375|Mutton Boneless (Goat)|Kg|
MOG-00376|Mutton Curry Cut Chilled (Goat)|Kg|
MOG-00377|Mutton Curry Cut Frozen (Goat)|Kg|
MOG-00378|Mutton Keema Chilled (Goat)|Kg|
MOG-00379|Mutton Keema Frozen (Goat)|Kg|
MOG-00380|Nalla Karam|Kg|Black Gun Powder
MOG-00381|Noodles Dry|Kg|
MOG-00382|Noodles Moist|Kg|
MOG-00383|Nutmeg Whole|Kg|
MOG-00384|Oats White|Kg|
MOG-00385|Oil Coconut|Kg|
MOG-00386|Oil Gingelly|Kg|
MOG-00387|Oil Mustard|Kg|
MOG-00388|Oil Olive|Kg|
MOG-00389|Oil Refined|Kg|
MOG-00390|Oil Sesame|Kg|
MOG-00391|Olives Black Pitted|Kg|
MOG-00392|Olives Black Slice|Kg|
MOG-00393|Olives Black Whole|Kg|
MOG-00394|Olives Green Pitted|Kg|
MOG-00395|Olives Green Slice|Kg|
MOG-00396|Olives Green Whole|Kg|
MOG-00397|Onion Garlic Masala RTU|Kg|Kanda Lasun Masala RTU
MOG-00398|Onion Small Fresh|Kg|
MOG-00399|Onion Fresh|Kg|
MOG-00400|Orange Crush|Kg|
MOG-00401|Orange Whole Imported|Kg|
MOG-00402|Orange Whole Local|Kg|
MOG-00403|Palm Fruit Whole|Kg|
MOG-00404|Panipuri Shell|Kg|
MOG-00405|Papad Fryums|Kg|
MOG-00406|Papad Masala|Kg|
MOG-00407|Papad Plain|Kg|
MOG-00408|Papad Rice|Kg|
MOG-00409|Papaya Raw Fresh|Kg|
MOG-00410|Papaya Ripe Whole|Kg|
MOG-00411|Papaya Syrup|Kg|
MOG-00412|Paprika Powder RTU|Kg|
MOG-00413|Parsley Fresh|Kg|
MOG-00414|Parval Fresh|Kg|Padwal
MOG-00415|Pasta Farfalle|Kg|
MOG-00416|Pasta Fusilli|Kg|
MOG-00417|Pasta Lasagna Sheet|Kg|
MOG-00418|Pasta Macaroni Imported|Kg|
MOG-00419|Pasta Macaroni Indian|Kg|
MOG-00420|Pasta Penne|Kg|
MOG-00421|Pasta Spaghetti|Kg|
MOG-00422|Pav|Kg|
MOG-00423|Pav Bhaji Masala RTU|Kg|
MOG-00424|Pav Dabeli RTU|Kg|
MOG-00425|Peach Syrup|Kg|
MOG-00426|Peanut Plain RTU|Kg|
MOG-00427|Peanut Roasted RTU|Kg|
MOG-00428|Pear Whole Imported|Kg|
MOG-00429|Pear Whole Local|Kg|
MOG-00430|Phool Makhana Whole|Kg|Lotus Seeds Whole
MOG-00431|Pickle Garlic|Kg|
MOG-00432|Pickle Ginger|Kg|
MOG-00433|Pickle Gongura|Kg|
MOG-00434|Pickle Green Chilli|Kg|
MOG-00435|Pickle Lemon|Kg|
MOG-00436|Pickle Mango|Kg|
MOG-00437|Pickle Mix|Kg|
MOG-00438|Pickle Red Chilli|Kg|
MOG-00439|Pickle Tomato|Kg|
MOG-00440|Pina Colada Syrup|Kg|
MOG-00441|Pine Nut Whole|Kg|
MOG-00442|Pineapple Can|Kg|
MOG-00443|Pineapple Crush|Kg|
MOG-00444|Premix Pancake|Kg|
MOG-00445|Pineapple Jam|Kg|
MOG-00446|Pineapple Whole|Kg|
MOG-00447|Pistachio Nuts Processed|Kg|
MOG-00448|Pita Bread RTU|Kg|
MOG-00449|Plantain Flower Fresh|Kg|Banana Flower Fresh
MOG-00450|Plum Whole Imported|Kg|
MOG-00451|Poha Red|Kg|
MOG-00452|Poha Thick|Kg|
MOG-00453|Poha Thin|Kg|
MOG-00454|Poha White|Kg|
MOG-00455|Pomegranate Powder RTU|Kg|
MOG-00456|Pomegranate Seeds Dried|Kg|
MOG-00457|Pomegranate Whole|Kg|
MOG-00458|Poppy Seeds|Kg|
MOG-00459|Potato Fresh|Kg|
MOG-00460|Premix Dosa|Kg|
MOG-00461|Premix Idli|Kg|
MOG-00462|Premix Jalebi|Kg|
MOG-00463|Premix Rasam|Kg|
MOG-00464|Premix Sambar|Kg|
MOG-00465|Premix Upma|Kg|
MOG-00466|Puliyogare Masala Powder RTU|Kg|
MOG-00467|Pumpkin Red Fresh|Kg|
MOG-00468|Pumpkin White Fresh|Kg|
MOG-00469|Quinoa|Kg|
MOG-00470|Radish Red Fresh|Kg|
MOG-00471|Radish White Fresh|Kg|
MOG-00472|Ragi Flour RTU|Kg|Nachini Flour
MOG-00473|Raisins Dried Black|Kg|
MOG-00474|Raisins Dried Golden|Kg|
MOG-00475|Raisins Dried Green|Kg|
MOG-00476|Rajma Chitra|Kg|
MOG-00477|Rajma Kashmiri|Kg|
MOG-00478|Rambutan Whole|Kg|
MOG-00479|Rasam Masala RTU|Kg|
MOG-00480|Raspberries Whole|Kg|
MOG-00481|Rava Bombay|Kg|
MOG-00483|Rava Sooji|Kg|
MOG-00484|Red Cherry|Kg|
MOG-00485|Red Chilli Byadagi Whole Stemless|Kg|
MOG-00486|Red Chilli Byadagi Whole with Stem|Kg|
MOG-00487|Red Chilli Flakes RTU|Kg|
MOG-00488|Red Chilli Guntur Whole Stemless|Kg|
MOG-00489|Red Chilli Guntur Whole with Stem|Kg|
MOG-00490|Red Chilli Powder|Kg|
MOG-00491|Red Chilli Sauce RTU|Kg|
MOG-00492|Red Chilli Fresh|Kg|
MOG-00493|Rice Basmati 1121|Kg|
MOG-00494|Rice Basmati Brown|Kg|
MOG-00495|Rice Basmati Steam Wand|Kg|
MOG-00496|Rice Basmati Tibar Steam|Kg|
MOG-00497|Rice Basmati Dubar Steam|Kg|
MOG-00498|Rice Flour|Kg|
MOG-00499|Rice Idli|Kg|
MOG-00500|Rice Lachkari Kollam Raw|Kg|
MOG-00501|Rice Lachkari Kollam Steam|Kg|
MOG-00502|Rice Noodles Dry|Kg|
MOG-00503|Rice Ponni Raw|Kg|
MOG-00504|Rice Ponni Boiled|Kg|Rice Ponni Steam
MOG-00505|Rice Puffed|Kg|
MOG-00506|Rice Sona Masoori Raw|Kg|
MOG-00507|Rice Sona Masoori Steam|Kg|
MOG-00508|Rich Cream Whipped|Kg|
MOG-00509|Ridge Gourd Smooth Skin Fresh|Kg|
MOG-00510|Ridge Gourd Fresh|Kg|Dodka
MOG-00511|Roasted Chana|Kg|
MOG-00512|Rose Water RTU|Kg|
MOG-00513|Sabu Dana Whole|Kg|
MOG-00514|Saffron|Kg|
MOG-00515|Salad Oil RTU|Kg|
MOG-00516|Salmon Fillet|Kg|
MOG-00517|Salt Black|Kg|
MOG-00518|Salt Lemon|Kg|
MOG-00519|Salt Rock|Kg|
MOG-00520|Sesame Seeds Black|Kg|
MOG-00521|Sesame Seeds White|Kg|
MOG-00522|Shahi Jeera Whole|Kg|
MOG-00523|Shrimp Paste|Kg|
MOG-00524|Snake Gourd Fresh|Kg|Padwal
MOG-00525|Sour Cream RTU|Kg|
MOG-00526|Soya Chunks|Kg|
MOG-00527|Soya Granules|Kg|
MOG-00528|Soya Chaap Frozen|Kg|
MOG-00529|Soya Peas|Kg|
MOG-00530|Soya Sauce Dark|Kg|
MOG-00531|Soya Sauce Light|Kg|
MOG-00532|Spinach Fresh|Kg|
MOG-00533|Spring Onion Fresh|Kg|
MOG-00534|Star Anise Whole|Kg|
MOG-00535|Strawberry Crush|Kg|
MOG-00536|Strawberry Whole Imported|Kg|
MOG-00537|Strawberry Whole Local|Kg|
MOG-00538|Sugar Bakery|Kg|
MOG-00539|Sugar Brown|Kg|
MOG-00540|Sugar Castor|Kg|
MOG-00541|Sugar Cube|Kg|
MOG-00542|Sugar Granular|Kg|Sugar
MOG-00543|Sugar Icing|Kg|
MOG-00544|Sugar Powder|Kg|
MOG-00545|Sumac Powder RTU|Kg|
MOG-00546|Sunflower Seeds|Kg|
MOG-00547|Sweet Corn|Kg|
MOG-00548|Sweet Lime Whole|Kg|
MOG-00549|Sweet Potato Fresh|Kg|
MOG-00550|Sweet Red Chilli Sauce|Kg|
MOG-00551|Syrup Banana|Kg|
MOG-00552|Tahini Paste RTU|Kg|
MOG-00553|Tamarind Paste|Kg|
MOG-00554|Tamarind Seedless|Kg|
MOG-00555|Tamarind Whole|Kg|
MOG-00556|Sago|Kg|Tapioca
MOG-00557|Tea Bag|Kg|
MOG-00558|Tea Dust|Kg|
MOG-00559|Tea Leaves|Kg|
MOG-00560|Thai Ginger Galangal Fresh|Kg|
MOG-00561|Thai Green Curry Paste RTU|Kg|
MOG-00562|Thai Red Curry Paste RTU|Kg|
MOG-00563|Thota Kura Fresh|Kg|Ambat Chukka
MOG-00564|Thyme Fresh|Kg|
MOG-00565|Tofu|Kg|
MOG-00566|Tomato Cherry Fresh|Kg|
MOG-00567|Tomato Ketchup|Kg|
MOG-00568|Tomato Paste|Kg|
MOG-00569|Tomato Puree RTU|Kg|
MOG-00570|Tomato Fresh (Country)|Kg|Tomato (Desi)
MOG-00571|Tomato Fresh (Hybrid)|Kg|
MOG-00572|Turmeric Powder|Kg|
MOG-00573|Turnip Fresh|Kg|Shalgam
MOG-00574|Tutti Frutti|Kg|
MOG-00575|Argula|Kg|
MOG-00576|Vanilla Ice Cream|Kg|
MOG-00577|Vanilla Syrup|Kg|
MOG-00578|Vermicelli Ragi|Kg|
MOG-00579|Vermicelli Roasted|Kg|
MOG-00580|Vermicelli Plain|Kg|
MOG-00581|Vinegar Balsamic|Kg|
MOG-00582|Vinegar Red Wine|Kg|
MOG-00583|Vinegar Synthetic White|Kg|
MOG-00584|Vinegar White Wine|Kg|
MOG-00585|Walnut Whole With Shell|Kg|
MOG-00586|Walnut Whole Without Shell|Kg|
MOG-00587|Water Chestnut Can|Kg|
MOG-00588|Water Chestnut Fresh|Kg|
MOG-00589|Water Melon Whole|Kg|
MOG-00590|Water RO|Kg|
MOG-00591|Wheat Broken Daliya|Kg|
MOG-00592|Maida|Kg|Wheat Flour Refined
MOG-00593|Wheat Whole|Kg|
MOG-00594|White Base Gravy RTU|Kg|
MOG-00595|White Pepper Powder|Kg|
MOG-00596|White Pepper Whole|Kg|
MOG-00597|Whole Wheat Flour Atta|Kg|
MOG-00598|Worcestershire sauce|Kg|
MOG-00599|Yam Elephant Fresh|Kg|
MOG-00601|Yeast Dry|Kg|
MOG-00602|Zucchini Green Fresh|Kg|
MOG-00603|Zucchini Yellow Fresh|Kg|
MOG-00604|Arugula Leaves Fresh|Kg|
MOG-00605|Black Beans Whole|Kg|
MOG-00606|Cantaloupe Whole|Kg|
MOG-00607|Fresh Red Choliya Fresh|Kg|
MOG-00608|Honeydew Whole|Kg|
MOG-00609|Amla Fresh|Kg|
MOG-00610|Amsul RTU|Kg|
MOG-00611|Papad Appalam|Kg|
MOG-00612|Arvi Leaves Fresh|Kg|Colocasia Leaves
MOG-00613|Appam Powder|Kg|
MOG-00614|Rice Arborio|Kg|
MOG-00615|Sweet Onion Sauce|Kg|
MOG-00616|Focaccia RTU|Kg|
MOG-00617|Baby Spinach Fresh|Kg|
MOG-00618|Bachali Kura Fresh|Kg|
MOG-00619|Baguette RTU|Kg|
MOG-00620|Banana Karpooravalli Whole|Kg|
MOG-00621|Banana Chakkarakeli Whole|Kg|
MOG-00622|Banana Amruthapani Whole|Kg|
MOG-00623|Banana Flower Fresh|Kg|
MOG-00624|Banana Morris Whole|Kg|
MOG-00625|Banana Hill Whole|Kg|
MOG-00626|Banana Poovan Whole|Kg|
MOG-00627|Banana Rasthali Whole|Kg|
MOG-00628|Rava Bansi|Kg|
MOG-00629|Atta Singhara|Kg|
MOG-00630|Atta Gluten Free|Kg|
MOG-00631|Rice Bhagar|Kg|
MOG-00632|Rice Basmati Sella Tibar|Kg|
MOG-00633|Rice Basmati Sella Dubar|Kg|
MOG-00634|Rice Basmati Steam Mogra|Kg|
MOG-00635|Beansprout Fresh|Kg|
MOG-00636|Ber Fruit Whole|Kg|
MOG-00637|Runner Beans Fresh|Kg|
MOG-00638|Avarakkai Seeds|Kg|
MOG-00639|Biryani Masala|Kg|
MOG-00640|Black Pepper Powder Sachet|Kg|
MOG-00641|Black Pepper Powder Sprinkler|Kg|
MOG-00642|Rice Sona Masoori Steam Brown|Kg|
MOG-00643|Cardamom Masala|Kg|
MOG-00644|Atta Kuttu|Kg|
MOG-00645|Atta Makki|Kg|
MOG-00646|Atta Multigrain|Kg|
MOG-00647|Premix Chapati|Kg|
MOG-00648|Cheesecake|Kg|
MOG-00649|Cheesecraker|Kg|
MOG-00650|Cheese Bocconcini|Kg|
MOG-00651|Cheese Mozzarella|Kg|
MOG-00652|Cheese Emmental|Kg|
MOG-00653|Cheese Edam Imported|Kg|
MOG-00654|Chia seeds|Kg|
MOG-00655|Kashmiri Chilli Whole|Kg|
MOG-00656|Rava Chiroti|Kg|
MOG-00657|Chironji|Kg|
MOG-00658|Chole Masala RTU|Kg|
MOG-00659|Citric Acid|Kg|
MOG-00660|Food Colour Apple Green|Kg|
MOG-00661|Food Colour Lemon Yellow|Kg|
MOG-00662|Food Colour Orange Red|Kg|
MOG-00663|Food Colour Red|Kg|
MOG-00664|Food Colour Blue|Kg|
MOG-00665|Food Colour Pink|Kg|
MOG-00666|Corn on the Cob|Kg|
MOG-00667|Muesli|Kg|
MOG-00668|Khus Crush|Kg|
MOG-00669|Blackcurrant Crush|Kg|
MOG-00670|Mixed Berry Crush|Kg|
MOG-00671|Tropical Syrup|Kg|
MOG-00672|Blueberry Crush|Kg|
MOG-00673|Green Apple Crush|Kg|
MOG-00674|Thai Yellow Curry Paste RTU|Kg|
MOG-00675|Madras Curry Powder RTU|Kg|
MOG-00676|Coconut Chutney RTU|Kg|
MOG-00677|Pesto Sauce|Kg|
MOG-00678|Dabeli Masala|Kg|
MOG-00679|Dal Moong Yellow|Kg|
MOG-00680|Dal Masoor Yellow|Kg|
MOG-00681|Rajma Red|Kg|
MOG-00682|Rajma Masala|Kg|
MOG-00683|Dal Vatana|Kg|
MOG-00684|Dal Vatana Roasted|Kg|
MOG-00685|Dal Horse gram|Kg|Dal Chana
MOG-00686|Dal Double Beans|Kg|
MOG-00687|Dal Powder|Kg|
MOG-00688|Papad Sabudana|Kg|
MOG-00689|Sabu Dana Whole Nylon|Kg|
MOG-00690|Oil Vegetable|Kg|
MOG-00691|Red Base Gravy RTU|Kg|
MOG-00692|Brown Base Gravy RTU|Kg|
MOG-00693|Yellow Base Gravy RTU|Kg|
MOG-00694|Zaatar Powder RTU|Kg|
MOG-00695|Wonton Sheet|Kg|
MOG-00696|Wheatgrass|Kg|
MOG-00697|Usal Masala RTU|Kg|
MOG-00698|Undhiya Masala RTU|Kg|
MOG-00699|Sundried Tomatoes RTU|Kg|
MOG-00700|Tinda Fresh|Kg|
MOG-00701|Thandai Syrup|Kg|
MOG-00702|Dressing Thousand Island|Kg|
MOG-00703|Tea Masala|Kg|
MOG-00704|Khus Syrup|Kg|
MOG-00705|Rose Syrup|Kg|
MOG-00706|Caramel Syrup|Kg|
MOG-00707|Hazelnut Syrup|Kg|
MOG-00708|Date Syrup|Kg|
MOG-00709|Blue Curacao Syrup|Kg|
MOG-00710|Blackcurrant Syrup|Kg|
MOG-00711|Iced Tea Syrup|Kg|
MOG-00712|Maple Syrup|Kg|
MOG-00713|Taco Shell RTU|Kg|
MOG-00714|Stevia Sachet|Kg|
MOG-00715|Sugarcane Fresh|Kg|
MOG-00716|Sugar Sachet White|Kg|
MOG-00717|Sugar Sachet Brown|Kg|
MOG-00718|Sugar Free Sachet|Kg|
MOG-00719|Sundakkai Vathal|Kg|
MOG-00720|Tom Yum Paste|Kg|
MOG-00721|Soup Stick|Kg|
MOG-00722|Star Fruit|Kg|
MOG-00723|Squid Chilled|Kg|
MOG-00724|Mango Syrup|Kg|
MOG-00725|Blueberry Syrup|Kg|
MOG-00726|Lemon Syrup|Kg|
MOG-00727|Dressing Snack|Kg|
MOG-00728|Tomato Ketchup Sachet|Kg|
MOG-00729|Tabasco Sauce|Kg|
MOG-00730|Capsico Sauce|Kg|
MOG-00731|Strawberry Jam|Kg|
MOG-00732|Diabetic Jam|Kg|
MOG-00733|Lime Seasoning|Kg|
MOG-00734|Millets Barnyard Whole|Kg|
MOG-00735|Millets Little Whole|Kg|
MOG-00736|Millets Mixed Whole|Kg|
MOG-00737|Millets Rice Whole|Kg|
MOG-00738|Salt Sachet|Kg|
MOG-00739|Papad Urad|Kg|
MOG-00740|Papad Moong|Kg|
MOG-00741|Papad Bullet|Kg|
MOG-00742|Chaat Papdi|Kg|
MOG-00743|Gherkins RTU|Kg|
MOG-00744|Rava Samba|Kg|
MOG-00745|Rice Dosa|Kg|
MOG-00746|Rice Kerala Red|Kg|Matta Red Rice
MOG-00747|Rice Boiled|Kg|
MOG-00748|Rice Kanki|Kg|
MOG-00749|Rice Jeera|Kg|
MOG-00750|Patthar ka Phool|Kg|
MOG-00751|Pasta Fettuccini|Kg|
MOG-00752|Pasta Tricolour|Kg|
MOG-00753|Essence Chocolate|Kg|
MOG-00754|Essence Milk|Kg|
MOG-00755|Essence Orange|Kg|
MOG-00756|Pickle Murabba|Kg|
MOG-00757|Sauce Hoisin|Kg|
MOG-00758|Sauce HP|Kg|
MOG-00759|Pizza Base|Kg|
MOG-00760|Gangavalli Kura Fresh|Kg|
MOG-00761|Grapes Red Whole Imported Seeded|Kg|
MOG-00762|Kale Leaves Fresh|Kg|
MOG-00763|Grapefruit Whole|Kg|
MOG-00764|Dent Leaves Fresh|Kg|
MOG-00765|Dragon fruit Whole|Kg|
MOG-00766|Mangosteen|Kg|
MOG-00767|Snow Peas Fresh|Kg|
MOG-00768|Soya Leaves Fresh|Kg|
MOG-00769|Ponnaganti Kura Fresh|Kg|
MOG-00770|Assorted Leafys Fresh|Kg|
MOG-00771|Long Beans Fresh|Kg|
MOG-00772|Mixed Frozen Vegetables|Kg|
MOG-00773|Pumpkin Seeds|Kg|
MOG-00774|Crab Fresh|Kg|
MOG-00775|Fish Rohu Fresh|Kg|
MOG-00776|Fish Katla Fresh|Kg|
MOG-00777|Fish Talapia Fresh|Kg|
MOG-00778|Fish Mackerel|Kg|
MOG-00779|Fish Prawn Frozen|Kg|
MOG-00780|Fish Pomfret Frozen|Kg|
MOG-00781|Fish Lobster Frozen|Kg|
MOG-00782|Fish Bombay Duck Chilled|Kg|
MOG-00783|Fish Salmon Chilled|Kg|
MOG-00784|Fish Anchovy Chilled|Kg|
MOG-00785|Fish Kermin Chilled|Kg|
MOG-00786|Fish Murrel Fresh|Kg|
MOG-00787|Fish Tuna Chilled|Kg|
MOG-00788|Fish Sole Chilled|Kg|
MOG-00789|Fish Mahi Chilled|Kg|
MOG-00790|Fish Peacock Chilled|Kg|
MOG-00791|Fish Neymeen Chilled|Kg|
MOG-00792|Fish Pandugappa Chilled|Kg|
MOG-00793|Mutton Carcass|Kg|
MOG-00794|Mutton Liver|Kg|
MOG-00795|Mutton Paya|Kg|
MOG-00796|Chicken Salami Frozen|Kg|
MOG-00797|Sauce Tomato|Kg|
MOG-00798|Sauce Oyster|Kg|
MOG-00799|Sauce Snack|Kg|
MOG-00800|Sauce Teriyaki|Kg|
MOG-00801|Sauce Plum|Kg|
MOG-00802|Sauce Salsa|Kg|
MOG-00803|Sauce 8 to 8|Kg|
MOG-00804|Sauce Chilli Garlic|Kg|
MOG-00805|Sauce Manchurian|Kg|
MOG-00806|Sauce Black Bean|Kg|
MOG-00807|Mutton Masala RTU|Kg|
MOG-00808|Tea Bag - Assam|Kg|
MOG-00809|Tea Bag - Lemon|Kg|
MOG-00810|Tea Bag - Plain|Kg|
MOG-00811|Tea Bag - Green Tea|Kg|
MOG-00812|Tea Bag - Jasmine|Kg|
MOG-00813|Tea Bag - Rose|Kg|
MOG-00814|Tea Bag - Camomile|Kg|
MOG-00815|Tea Bag - Darjeeling|Kg|
MOG-00816|Tea Bag - Earl Grey|Kg|
MOG-00817|Tea Bag - Peppermint|Kg|
MOG-00818|Tea Bag - Ginger|Kg|
MOG-00819|Tea Bag - Masala|Kg|
MOG-00820|Tea Bag - English Breakfast|Kg|
MOG-00821|Potato Wedges|Kg|
MOG-00822|Tea Bag - Cardamom|Kg|
MOG-00823|Rice Ambe Mohar|Kg|
MOG-00824|Wood Fire Seasoning|Kg|
MOG-00825|Edible Camphor|Kg|
MOG-00826|Butter Scotch Cream|Kg|
MOG-00827|Strawberry Whipped Cream|Kg|
MOG-00828|Nachos Chips RTU|Kg|
MOG-00829|Peri Peri Seasoning|Kg|
MOG-00830|Achaari Seasoning|Kg|
MOG-00831|Italian Seasoning|Kg|
MOG-00832|Tandoori Seasoning|Kg|
MOG-00833|Chipotle Seasoning|Kg|
MOG-00834|Mediterranean Seasoning|Kg|
MOG-00835|Lucknowi Seasoning|Kg|
MOG-00836|Maggi Seasoning|Kg|
MOG-00837|Bhujia RTU|Kg|
MOG-00838|Navrattan Mix RTU|Kg|
MOG-00839|Soya Chap|Kg|
MOG-00840|Waffle Syrup|Kg|
MOG-00841|Chicken Ham RTU|Kg|
MOG-00842|Rice Govindo Bhog|Kg|
MOG-00843|Rice Zeerga Sambha|Kg|
MOG-00844|Coconut Milk Powder|Kg|
MOG-00845|Chicken Reshami Seekh RTU|Kg|
MOG-00846|Lima Bean|Kg|
MOG-00847|Mangaloreananan Cucumber|Kg|
MOG-00848|Baloon Vine Leaf Veg|Kg|
MOG-00849|Basil Seeds Whole|Kg|
MOG-00850|Yeast Mix RTU|Kg|
MOG-00851|Oregano Fresh|Kg|
MOG-00852|Wild Rice|Kg|
MOG-00853|Bajra Flour|Kg|
MOG-00854|Prunes|Kg|
MOG-00855|Fresh Turmeric|Kg|
MOG-00856|Nutella|Kg|
MOG-00857|Almond Milk|Kg|
MOG-00858|Soya Milk|Kg|
MOG-00859|Edible Flowers|Kg|
MOG-00860|Micro Greens|Kg|
MOG-00861|Mustard Sauce|Kg|
MOG-00862|Mexican Seasoning|Kg|
MOG-00863|Tikka Seasoning|Kg|
MOG-00864|Coffee Beans Arabica 100%|Kg|
MOG-00865|Filter Coffee Powder 70:30|Kg|
MOG-00866|Rice Sevai|Kg|
MOG-00867|Jamun Juice|Kg|
MOG-00868|Cucumber Syrup|Kg|
MOG-00869|Milk Made RTU|Kg|
MOG-00870|Tamarind Syrup|Kg|
MOG-00871|Aamras Juice RTU|Kg|
MOG-00872|Guava Crush|Kg|
MOG-00873|Masala Lemonade Premix|Kg|
MOG-00874|Lemon Powder RTU|Kg|
MOG-00875|Wafers|Kg|
MOG-00876|Khasta Cookie|Kg|
MOG-00877|Banana Chips|Kg|
MOG-00878|Rusk|Kg|
MOG-00879|Cream Roll|Kg|
MOG-00880|Matthi|Kg|
MOG-00881|Fan|Kg|
MOG-00882|Masala Cracker|Kg|
MOG-00883|Dilkush|Kg|
MOG-00884|Moon Biscuit|Kg|
MOG-00885|Khari|Kg|
MOG-00886|Chana Jor Garam|Kg|
MOG-00887|Nippattu|Kg|
MOG-00888|Bhakarwadi|Kg|
MOG-00889|Namak Pare|Kg|
MOG-00890|Gathiya|Kg|
MOG-00891|Osmania Biscuit|Kg|
MOG-00892|Murukku|Kg|
MOG-00893|Khasta Biscuit|Kg|
MOG-00894|Oregano Spice Mix|Kg|
MOG-00895|Buttermilk|Kg|
MOG-00896|Canned Juice|Kg|
MOG-00897|Cold Pressed Juice|Kg|
MOG-00898|Tetra Packed Juice 1 Liter|Kg|
MOG-00899|Lemon Squash|Kg|
MOG-00900|Mango Yoghurt|Kg|
MOG-00901|Strawberry Yoghurt|Kg|
MOG-00902|Mint Yoghurt|Kg|
MOG-00903|Blue Berry Yoghurt|Kg|
MOG-00904|Honey Yoghurt|Kg|
MOG-00905|Millet Rava Roasted|Kg|
MOG-00906|Reetha|Kg|
MOG-00907|Eggless Cake Premix|Kg|
MOG-00908|Eggless Vanilla Muffin Premix|Kg|
MOG-00909|Beetroot Juice RTU|Kg|
MOG-00910|Cream Cheese RTU|Kg|
MOG-00911|Butter Yellow Unsalted Table|Kg|
MOG-00912|Craft Fruit Filling RTU|Kg|
MOG-00913|Brownie Premix|Kg|
MOG-00914|Dates Puree RTU|Kg|
MOG-00915|Speculas Mix RTU|Kg|
MOG-00916|Blueberry Filling RTU|Kg|
MOG-00917|Eggless Chocolate Cookie Premix|Kg|
MOG-00918|Eggless Oatmeal Raisin Cookie Premix|Kg|
MOG-00919|Eggless Cookie Premix|Kg|
MOG-00920|Peanut Butter|Kg|
MOG-00921|Oil Sunflower|Kg|
MOG-00922|Swad Caramel Industrial RTU|Kg|
MOG-00923|Melon Seeds|Kg|
MOG-00924|Vanilla Extract|Kg|
MOG-00925|Digestive Biscuit|Kg|
MOG-00926|Lemon Drink Mix (Tang)|Kg|
MOG-00927|Buttermilk|Kg|
MOG-00928|Complan Powder|Kg|
MOG-00929|Old Monk|Kg|
MOG-00930|Apple Juice|Kg|
MOG-00931|Food Colour Caramel|Kg|
MOG-00932|Laksa Paste RTU|Kg|
MOG-00933|Sambar Powder RTU|Kg|
MOG-00934|Boost Powder|Kg|
MOG-00935|Fish Basa Mince|Kg|
MOG-00936|Fajita Seasoning|Kg|
MOG-00937|Gulkand|Kg|
MOG-00938|Frappe Powder RTU|Kg|
MOG-00939|Ice Cubes|Kg|
MOG-00940|Yogurt Powder RTU|Kg|
MOG-00941|Soda|Kg|
MOG-00942|Pepsi|Kg|
MOG-00943|Dal Urad Flour|Kg|
MOG-00944|Malabar Paratha Frozen|Kg|
MOG-00945|Khubus Bread 8"|Kg|
MOG-00946|Siracha Sauce|Kg|
MOG-00947|Mint Toasted Multigrain Baguet|Kg|
MOG-00949|Sesame Bun|Kg|
MOG-00950|Horlicks Powder|Kg|
MOG-00951|Irani Tea Powder|Kg|
MOG-00952|Psyllium Husk|Kg|
MOG-00953|Rice Basmati Sella|Kg|
MOG-00954|Rice Basmati Tukda|Kg|
MOG-00955|High Fibre Super Flakes|Kg|
MOG-00956|Wheat Flakes|Kg|
MOG-00957|Coffee Powder Sachet|Kg|
MOG-00958|Multigrain Seeds|Kg|
MOG-00959|Lettuce Lollo Bianco Fresh|Kg|
MOG-00960|Lettuce Frisee Fresh|Kg|
MOG-00961|Oregano Fresh|Kg|
MOG-00962|Tomato Peeled RTU|Kg|
MOG-00963|Harissa Sauce RTU|Kg|
MOG-00964|French Mustard RTU|Kg|
MOG-00965|Vita Cookie|Kg|
MOG-00966|Golden Syrup|Kg|
MOG-00967|Capers RTU|Kg|
MOG-00968|Herb Marjoram Dried|Kg|
MOG-00969|Chorizo Mix|Kg|
MOG-00970|Chinese Cooking Wine|Kg|
MOG-00971|Garlic Leaves Fresh|Kg|
MOG-00972|White Butter|Kg|Safed Makkhan
MOG-00973|Jus Powder|Kg|
MOG-00974|Pasta Penne Whole Wheat|Kg|
MOG-00975|Cocktail Onion Chopped|Kg|
MOG-00976|Garlic Powder RTU|Kg|
MOG-00977|Polenta|Kg|
MOG-00978|Essence Biryani|Kg|
MOG-00979|Cocktail Onion RTU|Kg|
MOG-00980|Mayonnaise Sauce Low Fat RTU|Kg|
MOG-00981|Fish Bombil|Kg|
MOG-00982|Tiger Prawn|Kg|
MOG-00983|Fish Seer|Kg|
MOG-00984|Lamb Chops|Kg|
MOG-00985|Charcoal|Kg|
MOG-00986|Vinegar Apple Cider|Kg|
MOG-00987|Oil Olive Extra Virgin|Kg|
MOG-00988|Vinegar Rice|Kg|
MOG-00989|Tart Shell|Kg|
MOG-00990|Mango Juice RTU|Kg|
MOG-00991|Pistachio Powder|Kg|
MOG-00992|Badam Drink Mix|Kg|
MOG-00993|Rice Red|Kg|
MOG-00994|Jumbo Prawn|Kg|
MOG-00995|Puttu Podi|Kg|
MOG-00996|Rice Jasmine|Kg|
MOG-00997|Thai Red Chilli|Kg|
MOG-00998|Rice Sticky|Kg|
MOG-00999|Sprite|Kg|
MOG-01000|English Cucumber Fresh|Kg|
MOG-01001|Cajun Spice|Kg|
MOG-01002|Strawberry Compote|Kg|
MOG-01003|Blueberry Compote|Kg|
MOG-01004|Vegan Oyster Sauce|Kg|
MOG-01005|Chappan Kaddu Fresh|Kg|
MOG-01006|Baked Sprinkler|Kg|
MOG-01007|Cheese Sauce RTU|Kg|
MOG-01008|Eggless Red Velvet Cake Premix|Kg|
MOG-01009|Cranberries Dry|Kg|
MOG-01010|Chocolate Cookies|Kg|
MOG-01011|Butter Scotch Sprinkler|Kg|
MOG-01012|Tortilla Sheet RTU|Kg|
MOG-01013|Sponge Gourd Fresh|Kg|
MOG-01014|Chikki|Kg|
MOG-01015|Chapati Outsourced|Kg|
MOG-01016|Egg Curry Masala RTU|Kg|
MOG-01017|Potato Khis|Kg|
MOG-01018|Biscuit Rs 5|Kg|
MOG-01019|Chicken Maggi Cube|Kg|
MOG-01020|Oil Refined Soya|Kg|
MOG-01021|Dal Urad Black Split|Kg|
MOG-01022|Sugar Candy|Kg|
MOG-01023|Rice Basmati Golden Sella|Kg|
MOG-01024|Sichuan Pepper Whole|Kg|
MOG-01025|Noodles Soba|Kg|
MOG-01026|Missi Chapati Outsourced|Kg|
MOG-01027|Bajra Chapati Outsourced|Kg|
MOG-01028|Makki Chapati Outsourced|Kg|
MOG-01029|Ragi Missi Chapati Outsourced|Kg|
MOG-01030|Kulcha Bakery RTU|Kg|
MOG-01031|Basil Pesto RTU|Kg|
MOG-01032|Makhani Gravy RTU|Kg|
MOG-01033|Four Pepper Seasoning|Kg|
MOG-01034|Soya Paratha Frozen|Kg|
MOG-01035|Aloo Paratha Frozen|Kg|
MOG-01036|Aloo Pyaz Paratha Frozen|Kg|
MOG-01037|Paneer Paratha Frozen|Kg|
MOG-01038|Mix Veg Paratha Frozen|Kg|
MOG-01039|Gobhi Paratha Frozen|Kg|
MOG-01040|Lachha Paratha Frozen|Kg|
MOG-01041|Kala Chana Paratha Frozen|Kg|
MOG-01042|Plain Paratha Frozen|Kg|
MOG-01043|Eggless Chocolate Muffin Premix|Kg|
MOG-01044|Veg Spring Roll Frozen|Kg|
MOG-01045|Hara Bhara Kabab Frozen RTU|Kg|
MOG-01046|Mouth Freshner Sachet|Kg|
MOG-01047|Aloo Tikki Frozen RTU|Kg|
MOG-01048|Pizza Pocket Frozen|Kg|
MOG-01049|Dressing Vinaigrette RTU|Kg|
MOG-01050|Potato Shots Frozen|Kg|
MOG-01051|Galouti Kabab Frozen|Kg|
MOG-01052|Veg Burger Tikki Frozen|Kg|
MOG-01053|Bread Crumbs Panko|Kg|
MOG-01054|Jalapeno Cheese Pops Frozen|Kg|
MOG-01055|Corn Bite Cheese Frozen|Kg|
MOG-01056|Cornflakes Strawberry|Kg|
MOG-01057|Sheermal Outsourced|Kg|
MOG-01058|Potato Starch|Kg|
MOG-01059|Pickle Mix Sachet|Kg|
MOG-01060|Red Pasta Sauce|Kg|
MOG-01061|White Pasta Sauce|Kg|
MOG-01062|Thai Zing Dressing|Kg|
MOG-01063|Russian Dressing|Kg|
MOG-01064|Bhatura Frozen|Kg|
MOG-01065|Chicken Momos Frozen|Kg|
MOG-01066|Mix Veg Momos Frozen|Kg|
MOG-01067|Paneer Momos Frozen|Kg|
MOG-01068|Pineapple Juice - Tetra|Kg|
MOG-01069|Mix Fruit Juice - Tetra|Kg|
MOG-01070|Orange Juice - Tetra|Kg|
MOG-01071|Rice Black|Kg|
MOG-01072|Jowar Sattu|Kg|
MOG-01073|Almond Powder|Kg|
MOG-01074|Avocado Paste|Kg|
MOG-01077|Masala Boondi|Kg|
MOG-01078|Peanuts Salted|Kg|
MOG-01079|Chicken Nuggets|Kg|
MOG-01080|Butter Chicken Gravy RTU|Kg|
MOG-01081|Gongura Paste RTU|Kg|
MOG-01082|Chettinad Paste RTU|Kg|
MOG-01083|Cauliflower Florets Frozen|Kg|
MOG-01084|Onion Tomato Masala Paste RTU|Kg|
MOG-01085|Palak Paste RTU|Kg|
MOG-01086|Rice Basmati|Kg|
MOG-01087|Fish Sole Frozen|Kg|
MOG-01088|Jeeravan Masala RTU|Kg|
MOG-01089|Roohafza|Kg|
MOG-01090|Sorghum Whole|Kg|Jowar Whole
MOG-01091|Schezwan Seasoning|Kg|
MOG-01092|Harissa Seasoning|Kg|
MOG-01093|Sichuan Seasoning|Kg|
MOG-01094|Jamaican Jerk Seasoning|Kg|
MOG-01095|Cayenne Pepper Powder RTU|Kg|
MOG-01096|Five Spice Seasoning|Kg|
MOG-01097|Manchurian Seasoning|Kg|
MOG-01098|Gochujang Seasoning|Kg|
MOG-01099|Shawarma Seasoning|Kg|
MOG-01100|Horseradish Sauce|Kg|
MOG-01101|Herb Sage Fresh|Kg|
MOG-01102|Eggless Premix Pancake Betty Crocker|Kg|
MOG-01103|Bulgogi Seasoning|Kg|
MOG-01104|Salt Pink|Kg|
MOG-01105|Artichoke Hearts Tin|Kg|
MOG-01106|Tomato Juice|Kg|
MOG-01107|Tomato Soup Base Knorr|Kg|
MOG-01108|Sweet Corn Soup Base Knorr|Kg|
MOG-01109|Vanilla Oreo Cookies|Kg|
MOG-01110|Rye Flour|Kg|
MOG-01111|Apricot Jam|Kg|
MOG-01112|Green Pepper Whole|Kg|
MOG-01113|Masala Imli Candy|Kg|
MOG-01114|Miso Paste RTU|Kg|
MOG-01115|Gochujang Paste RTU|Kg|Korean Hot Chilli Paste RTU
MOG-01116|Mirin Sauce|Kg|Japanese Sweet Sauce
MOG-01117|Udon Noodles Dry|Kg|
MOG-01118|Rice Krispies RTU|Kg|
MOG-01119|Smoky BBQ Sauce|Kg|
MOG-01120|Zesty Vinaigrette Dressing|Kg|
MOG-01121|Chipotle Southwest Sauce|Kg|
MOG-01122|Mint Mayonnaise Dressing|Kg|
MOG-01123|Honey Mustard Dressing|Kg|
MOG-01124|Mixed Berries Frozen|Kg|
MOG-01125|Sea Salt|Kg|
MOG-01126|Cheese Ricotta|Kg|
MOG-01127|Cheese Goat|Kg|
MOG-01128|Noodles Glass|Kg|
MOG-01129|Edamame Beans Fresh|Kg|Green Soya Beans Fresh
MOG-01130|Pecan Nuts Without Shell|Kg|
MOG-01131|Plant Protein|Kg|
MOG-01132|Cheese Yellow Slice Processed|Kg|
MOG-01133|Morde Dark Chocolate (D-45)|Kg|
MOG-01134|Liquid Glucose|Kg|
MOG-01135|Nolen Gur|Kg|
MOG-01136|Peruvian Seasoning|Kg|
MOG-01137|Purple Sweet Potato Chips RTU|Kg|
MOG-01138|Paprika Red Slice|Kg|
MOG-01139|Togarashi Seasoning|Kg|
MOG-01140|Turkey Slice|Kg|
MOG-01141|Butter Unsalted - President|Kg|
MOG-01142|T65 Flour|Kg|
MOG-01143|Tandoori Mayo RTU|Kg|
MOG-01144|Honey Mustard Mayo RTU|Kg|
MOG-01145|Chipotle Mayo RTU|Kg|
MOG-01146|Malabari Cucumber|Kg|
MOG-01147|Cheesy Dip RTU|Kg|
MOG-01148|Hazelnut Chocolate Filling|Kg|
MOG-01149|Milk Chocolate Couverture|Kg|
MOG-01150|Eggless Chocolate Cake Premix|Kg|
MOG-01151|Hazelnut Whole|Kg|
MOG-01152|Onion Patti Samosa Frozen|Kg|
MOG-01153|Veg Nuggets Frozen|Kg|
MOG-01154|Corn & Cheese Nuggets Frozen|Kg|
MOG-01155|Falafel Frozen|Kg|
MOG-01156|Potato Flakes RTU|Kg|
MOG-01157|Tomato Powder RTU|Kg|
MOG-01158|Potato Pops Frozen|Kg|
MOG-01159|Kimchi Sprinkle|Kg|
MOG-01160|Korean Chilli Sprinkle|Kg|
MOG-01161|Schezwan Sprinkle|Kg|
MOG-01162|Mix Veg Bao Frozen|Kg|
MOG-01163|Chicken Bao Frozen|Kg|
MOG-01164|Chilli Oil RTU|Kg|
MOG-01165|Fried Onion Flakes RTU|Kg|
MOG-01166|Snap Peas Fresh|Kg|
MOG-01167|Schezwan Sauce RTU|Kg|
MOG-01168|French Beans Frozen|Kg|
MOG-01169|Potato Smiley Frozen|Kg|
MOG-01170|Chicken Spring Roll Frozen|Kg|
MOG-01171|Sarson Saag Puree RTU|Kg|
MOG-01172|Broccoli Florets Frozen|Kg|
MOG-01173|Milk Creamer Sachet|Kg|
MOG-01174|Chicken Patty Frozen|Kg|
MOG-01175|Rainbow Vermicelli|Kg|
MOG-01176|Pizza Sauce RTU|Kg|
MOG-01178|Spinach Frozen|Kg|
MOG-01179|Spinach Leaves Chilled|Kg|
MOG-01180|Meat Masala RTU|Kg|
MOG-01181|Raspberries Filling RTU|Kg|
MOG-01182|Raspberries Jam|Kg|
MOG-01183|Agar Agar Powder|Kg|
MOG-01184|Fish Bhetki Chilled|Kg|
MOG-01185|Nori Sheet|Kg|
MOG-01186|Tea Bag - Blue Pea|Kg|
MOG-01187|Orange Filling RTU|Kg|
MOG-01188|BBQ Seasoning|Kg|
MOG-01189|Creamy Caesar Dressing|Kg|
MOG-01190|Chicken Popcorn Frozen|Kg|
MOG-01191|Ragi Fryums|Kg|
MOG-01192|Onion Powder RTU|Kg|
MOG-01193|Allspice Powder|Kg|
MOG-01194|Cashew Nut Paste RTU|Kg|
MOG-01195|Mandi Spice Mix RTU|Kg|
MOG-01196|Arabic 7 Spice Powder RTU|Kg|
MOG-01197|Molasses RTU|Kg|
MOG-01198|Doner Kebab Seasoning|Kg|
MOG-01199|Ras-Al Hanout Seasoning|Kg|
MOG-01200|Onion Chilled (OS)|Kg|
MOG-01201|Irradiated Carbonated Drinks|Kg|
MOG-01202|Sugar Free Irradiated Drinks|Kg|
MOG-01203|Packaged Drinking Water|Kg|
MOG-01204|Packaged Biscuits|Kg|
MOG-01205|Packaged Cookies|Kg|
MOG-01206|Onion Rings Frozen|Kg|
MOG-01207|Idiyappam RTU|Kg|
`;

export const INGREDIENT_MASTER: IngredientMaster[] = INGREDIENT_RAW
  .trim()
  .split('\n')
  .map((line) => {
    const [code, name, uom, alias] = line.split('|');
    return { code, name, uom, alias: alias ?? '' };
  });

// --- Fuzzy search utilities used by the Catalog screen ---

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export interface ScoredMatch<T> {
  item: T;
  score: number;
}

/**
 * Score query against text using a blend of:
 *  - exact substring (strong boost)
 *  - prefix match per token
 *  - subsequence match (handles typos / abbreviations)
 * Higher score = better match. Returns 0 if the query has no relation to the text.
 */
function scoreMatch(query: string, ...fields: string[]): number {
  const normalisedQuery = query.trim().toLowerCase();
  if (!normalisedQuery) {
    return 1;
  }
  const queryTokens = tokenize(normalisedQuery);
  if (queryTokens.length === 0) {
    return 1;
  }

  let score = 0;
  for (const rawField of fields) {
    if (!rawField) {
      continue;
    }
    const field = rawField.toLowerCase();
    const fieldTokens = tokenize(field);

    if (field.includes(normalisedQuery)) {
      score += 50;
      if (field.startsWith(normalisedQuery)) {
        score += 20;
      }
    }
    for (const qt of queryTokens) {
      for (const ft of fieldTokens) {
        if (ft === qt) {
          score += 12;
        } else if (ft.startsWith(qt)) {
          score += 6;
        } else if (ft.includes(qt)) {
          score += 3;
        }
      }
      let qi = 0;
      for (let fi = 0; fi < field.length && qi < qt.length; fi += 1) {
        if (field[fi] === qt[qi]) {
          qi += 1;
        }
      }
      if (qi === qt.length) {
        score += 1;
      }
    }
  }
  return score;
}

export function fuzzySearchAllergens(query: string, limit = 50): ScoredMatch<AllergenMaster>[] {
  if (!query.trim()) {
    return ALLERGEN_MASTER.map((item) => ({ item, score: 1 }));
  }
  return ALLERGEN_MASTER
    .map((item) => ({ item, score: scoreMatch(query, item.code, item.name) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function fuzzySearchNutrients(query: string, limit = 50): ScoredMatch<NutrientMaster>[] {
  if (!query.trim()) {
    return NUTRIENT_MASTER.map((item) => ({ item, score: 1 }));
  }
  return NUTRIENT_MASTER
    .map((item) => ({ item, score: scoreMatch(query, item.code, item.name, item.group, item.uom) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function fuzzySearchIngredients(query: string, limit = 100): ScoredMatch<IngredientMaster>[] {
  if (!query.trim()) {
    return INGREDIENT_MASTER.slice(0, limit).map((item) => ({ item, score: 1 }));
  }
  return INGREDIENT_MASTER
    .map((item) => ({ item, score: scoreMatch(query, item.code, item.name, item.alias) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
