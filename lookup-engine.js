/**
 * Tariff Buddy — Product Lookup Engine
 *
 * The core pipeline:
 *   Barcode → Country (GS1 prefix) → Tariff rate → Price impact estimate
 *   Enriched with Open Food Facts data when available
 *
 * No backend required. All client-side. Free APIs only.
 */

const ProductLookup = {

  /**
   * Returns the active tariff table based on the user's selected market
   */
  getTariffTable() {
    const market = (typeof state !== "undefined" && state.market) || "US";
    if (market === "CA" && typeof CA_TARIFF_DATA !== "undefined") return CA_TARIFF_DATA;
    return TARIFF_DATA;
  },

  /**
   * Full product lookup pipeline.
   * @param {string} barcode - The scanned/entered barcode
   * @returns {Promise<object>} Complete result object
   */
  async lookup(barcode) {
    // Step 1: Clean the barcode
    const cleanBarcode = this.cleanBarcode(barcode);
    if (!cleanBarcode || cleanBarcode.length < 8) {
      return this.errorResult("Invalid barcode", "The barcode is too short or unreadable.");
    }

    // Step 2: Determine country from barcode prefix
    const barcodeResult = BARCODE_PREFIXES.lookup(cleanBarcode);
    const countryCode = barcodeResult.countryCode;

    // Step 3: Try Open Food Facts for product details (food/beverage)
    const offResult = await this.fetchOpenFoodFacts(cleanBarcode);

    // Step 3b: If OFF has no data, try UPCitemdb (covers electronics, home, clothing, etc.)
    let upcResult = null;
    if (!offResult) {
      upcResult = await this.fetchUPCitemdb(cleanBarcode);
    }

    // Merge: prefer OFF for food (has origin data), UPCitemdb for everything else
    const productData = offResult || upcResult;
    const dataSource = offResult ? "openfoodfacts" : upcResult ? "upcitemdb" : null;

    // Step 4: Determine category
    const category = this.guessCategory(productData, countryCode, upcResult);

    // Step 5: Get tariff rate for country + category (market-aware)
    const tariffTable = this.getTariffTable();
    const tariff = tariffTable.lookup(countryCode, category);

    // Step 6: Build the result
    return {
      barcode: cleanBarcode,
      productName: productData?.product_name || null,
      brand: productData?.brand || null,
      category,
      categoryLabel: this.categoryLabel(category),
      countryCode,
      countryName: barcodeResult.countryName,
      countryFlag: tariff.flag,
      originSource: "barcode_prefix",
      originNote: BARCODE_PREFIXES.confidenceNote(barcodeResult),
      offOrigin: offResult?.origin || null,
      offManufacturer: offResult?.manufacturer || null,
      isBook: barcodeResult.isBook,
      tariffRate: tariff.rate,
      tariffParsed: TARIFF_DATA.parseRate(tariff.rate),
      tariffConfidence: tariff.confidence,
      countryNotes: tariff.countryNotes,
      hasProductData: !!productData,
      productImage: upcResult?.image || null,
      productCategory: upcResult?.category || null,
      merchantOffers: upcResult?.offers || [],
      dataSource,
      confidence: this.calculateConfidence(barcodeResult, productData, tariff),
    };
  },

  /**
   * Fetch from Open Food Facts (free, no key)
   */
  async fetchOpenFoodFacts(barcode) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,origins,manufacturing_places,countries,categories,quantity`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 1 || !data.product) return null;

      const p = data.product;
      return {
        product_name: p.product_name || null,
        brand: p.brands || null,
        origin: p.origins || null,
        manufacturer: p.manufacturing_places || null,
        categories: p.categories || null,
        countries: p.countries || null,
      };
    } catch (e) {
      return null; // Network error or CORS — fail gracefully
    }
  },

  /**
   * Fetch from UPCitemdb (free trial, no key needed)
   * Covers electronics, home goods, clothing, toys, etc.
   * Rate limited: ~1 req/sec on trial tier
   */
  async fetchUPCitemdb(barcode) {
    // Rate limit: max 1 request per second on trial tier
    const now = Date.now();
    const lastCall = this._lastUPCCall || 0;
    if (now - lastCall < 1200) {
      await new Promise(r => setTimeout(r, 1200 - (now - lastCall)));
    }
    this._lastUPCCall = Date.now();

    // Cache: check localStorage for recent lookup
    const cacheKey = `tb_upc_${barcode}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && cached.cachedAt > now - 3600000) return cached.data; // 1hr cache
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== "OK" || !data.items || !data.items.length) return null;

      const item = data.items[0];
      let image = null;
      if (item.images && item.images.length) {
        image = item.images.find(u => u.includes("walmart") || u.includes("target") || u.includes("walgreens")) || item.images[0];
      }
      let offers = [];
      if (item.offers && item.offers.length) {
        offers = item.offers
          .filter(o => o.price && o.price > 0)
          .sort((a, b) => a.price - b.price)
          .slice(0, 3)
          .map(o => ({ merchant: o.merchant, price: o.price, link: o.link }));
      }

      const result = {
        product_name: item.title || null,
        brand: item.brand || null,
        category: item.category || null,
        image,
        offers,
      };

      // Cache the result
      try { localStorage.setItem(cacheKey, JSON.stringify({ data: result, cachedAt: now })); } catch (e) {}

      return result;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clean and validate a barcode
   */
  cleanBarcode(barcode) {
    if (!barcode) return null;
    // Remove non-digits
    let cleaned = String(barcode).replace(/\D/g, "");
    // Remove leading zeros (UPC-A → EAN compatibility)
    if (cleaned.length === 13 && cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    return cleaned || null;
  },

  /**
   * Guess product category from OFF data, UPCitemdb data, or barcode context
   * Maps product database categories to our category IDs
   */
  guessCategory(offResult, countryCode, upcResult) {
    // UPCitemdb has a Google-style taxonomy: "Category > Subcategory > Item"
    if (upcResult?.category) {
      const cat = upcResult.category.toLowerCase();
      if (cat.includes("electronic") || cat.includes("computer") || cat.includes("phone") || cat.includes("audio") || cat.includes("camera") || cat.includes("video game")) return "electronics";
      if (cat.includes("cloth") || cat.includes("apparel") || cat.includes("shoe") || cat.includes("wear")) return "clothing";
      if (cat.includes("toy") || cat.includes("game") || cat.includes("sport") || cat.includes("outdoor")) return "recreation";
      if (cat.includes("health") || cat.includes("beauty") || cat.includes("personal care") || cat.includes("cosmetic")) return "health";
      if (cat.includes("furniture") || cat.includes("bedding")) return "furniture";
      if (cat.includes("garden") || cat.includes("lawn") || cat.includes("plant")) return "garden";
      if (cat.includes("pet")) return "baby";
      if (cat.includes("baby")) return "baby";
      if (cat.includes("automotive") || cat.includes("vehicle") || cat.includes("auto")) return "mobility";
      if (cat.includes("hardware") || cat.includes("tool") || cat.includes("building") || cat.includes("construction")) return "building";
      if (cat.includes("home") || cat.includes("kitchen") || cat.includes("household")) return "home";
      if (cat.includes("food") || cat.includes("beverage") || cat.includes("grocery") || cat.includes("snack")) return "food";
    }

    if (!offResult || !offResult.categories) return "food"; // Default for food API

    const cats = offResult.categories.toLowerCase();

    // Check for non-food categories that sometimes appear
    if (cats.includes("beauty") || cats.includes("cosmetic") || cats.includes("personal care") || cats.includes("skin care")) return "health";
    if (cats.includes("pet") || cats.includes("dog") || cats.includes("cat")) return "baby";
    if (cats.includes("cleaning") || cats.includes("detergent")) return "home";

    // Food subcategories — all map to "food"
    return "food";
  },

  categoryLabel(catId) {
    const labels = {
      food: "Food & beverages", home: "Home & kitchen", electronics: "Electronics",
      clothing: "Clothing & footwear", mobility: "Vehicles & mobility", building: "Building & hardware",
      health: "Health & personal care", furniture: "Furniture", recreation: "Toys & recreation",
      materials: "Industrial materials", baby: "Baby & pet", garden: "Garden & outdoor",
    };
    return labels[catId] || "General";
  },

  /**
   * Calculate overall confidence in the result
   */
  calculateConfidence(barcodeResult, offResult, tariff) {
    let score = 0;

    // Country detection confidence
    if (barcodeResult.prefixType === "national") score += 40;
    else if (barcodeResult.prefixType === "generic") score += 10;

    // Product data confidence
    if (offResult?.product_name) score += 20;
    if (offResult?.origin) score += 20; // OFF origin field is strongest signal

    // Tariff table match
    if (tariff.confidence === "medium") score += 20;
    else if (tariff.confidence === "low") score += 5;

    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  },

  /**
   * Generate a human-readable summary for display
   */
  summarize(result) {
    if (!result || result.error) return "Unable to analyze this product.";

    if (result.isBook) {
      return "This is a book (ISBN barcode). Books aren't subject to typical import tariffs.";
    }

    if (result.countryCode === "US") {
      return `This product's barcode is registered in the United States — likely domestic. No import tariff expected.`;
    }

    const name = result.productName ? `"${result.productName}"` : "This product";
    const origin = result.offOrigin || result.countryName;
    const rate = result.tariffRate;

    return `${name} appears to originate from ${origin}. Estimated US import tariff range: ${rate}.`;
  },

  /**
   * Build error result
   */
  errorResult(title, message) {
    return {
      error: true,
      errorTitle: title,
      errorMessage: message,
      confidence: "none",
    };
  },
};
