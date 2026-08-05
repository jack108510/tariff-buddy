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

    // Step 3: Try Open Food Facts for product details
    const offResult = await this.fetchOpenFoodFacts(cleanBarcode);

    // Step 4: Determine category
    const category = this.guessCategory(offResult, countryCode);

    // Step 5: Get tariff rate for country + category (market-aware)
    const tariffTable = this.getTariffTable();
    const tariff = tariffTable.lookup(countryCode, category);

    // Step 6: Build the result
    return {
      barcode: cleanBarcode,
      productName: offResult?.product_name || null,
      brand: offResult?.brand || null,
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
      hasProductData: !!offResult,
      confidence: this.calculateConfidence(barcodeResult, offResult, tariff),
    };
  },

  /**
   * Fetch from Open Food Facts (free, no key)
   */
  async fetchOpenFoodFacts(barcode) {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,origins,manufacturing_places,countries,categories,quantity`;
      const res = await fetch(url);
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
   * Guess product category from OFF data or barcode context
   * Maps Open Food Facts categories to our category IDs
   */
  guessCategory(offResult, countryCode) {
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
