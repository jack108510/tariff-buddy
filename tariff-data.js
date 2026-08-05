/**
 * Tariff Buddy — Curated Tariff Rate Table
 *
 * Rates reflect US import tariff ranges by country of origin and product category.
 * Source: USITC Harmonized Tariff Schedule (HTS) — snapshot compiled Aug 2025.
 *
 * These are APPROXIMATE ranges for consumer-level products, not exact HTS line items.
 * Real rates vary by specific product classification (HTS 8-10 digit code).
 * Update quarterly or when major trade policy changes occur.
 *
 * Rate = ad valorem % (percentage of product value)
 */

const TARIFF_DATA = {
  version: "2025-08",
  source: "USITC Harmonized Tariff Schedule (curated ranges)",
  notes: "Approximate consumer-level ranges. Real rates depend on HTS classification.",

  countries: {
    CN: { name: "China", flag: "🇨🇳", notes: "Section 301 tariffs apply on many goods" },
    MX: { name: "Mexico", flag: "🇲🇽", notes: "USMCA duty-free for most qualifying goods" },
    CA: { name: "Canada", flag: "🇨🇦", notes: "USMCA duty-free for most qualifying goods" },
    EU: { name: "European Union", flag: "🇪🇺", notes: "" },
    DE: { name: "Germany", flag: "🇩🇪", notes: "EU member" },
    FR: { name: "France", flag: "🇫🇷", notes: "EU member" },
    IT: { name: "Italy", flag: "🇮🇹", notes: "EU member" },
    NL: { name: "Netherlands", flag: "🇳🇱", notes: "EU member" },
    ES: { name: "Spain", flag: "🇪🇸", notes: "EU member" },
    JP: { name: "Japan", flag: "🇯🇵", notes: "" },
    KR: { name: "South Korea", flag: "🇰🇷", notes: "KORUS FTA — many goods duty-free" },
    VN: { name: "Vietnam", flag: "🇻🇳", notes: "" },
    IN: { name: "India", flag: "🇮🇳", notes: "" },
    BR: { name: "Brazil", flag: "🇧🇷", notes: "" },
    TR: { name: "Türkiye", flag: "🇹🇷", notes: "" },
    BD: { name: "Bangladesh", flag: "🇧🇩", notes: "GSP eligible" },
    ID: { name: "Indonesia", flag: "🇮🇩", notes: "" },
    TH: { name: "Thailand", flag: "🇹🇭", notes: "" },
    MY: { name: "Malaysia", flag: "🇲🇾", notes: "" },
    PH: { name: "Philippines", flag: "🇵🇭", notes: "" },
    GB: { name: "United Kingdom", flag: "🇬🇧", notes: "" },
    AU: { name: "Australia", flag: "🇦🇺", notes: "AUSFTA — many goods duty-free" },
    NZ: { name: "New Zealand", flag: "🇳🇿", notes: "" },
    CH: { name: "Switzerland", flag: "🇨🇭", notes: "" },
    TW: { name: "Taiwan", flag: "🇹🇼", notes: "" },
    US: { name: "United States", flag: "🇺🇸", notes: "Domestic — no import tariff" },
    OTHER: { name: "Other / Unknown", flag: "🌍", notes: "Rate may vary — check product label" },
  },

  // Rate ranges by country → category
  rates: {
    CN: {
      food: "5–25%", home: "15–35%", electronics: "7.5–25%", clothing: "16–32%",
      mobility: "2.5–25%", building: "10–30%", health: "0–15%", furniture: "0–25%",
      recreation: "0–25%", materials: "7.5–25%", baby: "0–15%", garden: "0–20%",
    },
    MX: {
      food: "0–10%", home: "0–10%", electronics: "0–5%", clothing: "0–15%",
      mobility: "0–5%", building: "0–10%", health: "0–10%", furniture: "0–10%",
      recreation: "0–10%", materials: "0–10%", baby: "0–5%", garden: "0–10%",
    },
    CA: {
      food: "0–10%", home: "0–10%", electronics: "0–5%", clothing: "0–18%",
      mobility: "0–5%", building: "0–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–10%", materials: "0–10%", baby: "0–5%", garden: "0–10%",
    },
    EU: {
      food: "5–20%", home: "0–12%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "0–12%", health: "0–10%", furniture: "0–8%",
      recreation: "0–12%", materials: "0–12%", baby: "0–10%", garden: "0–12%",
    },
    JP: {
      food: "0–15%", home: "0–8%", electronics: "0–5%", clothing: "0–12%",
      mobility: "2.5–10%", building: "0–8%", health: "0–8%", furniture: "0–5%",
      recreation: "0–5%", materials: "0–8%", baby: "0–5%", garden: "0–5%",
    },
    KR: {
      food: "0–15%", home: "0–12%", electronics: "0–5%", clothing: "0–16%",
      mobility: "0–5%", building: "0–10%", health: "0–8%", furniture: "0–8%",
      recreation: "0–8%", materials: "0–10%", baby: "0–5%", garden: "0–5%",
    },
    VN: {
      food: "0–10%", home: "3–20%", electronics: "0–5%", clothing: "8–32%",
      mobility: "2.5–10%", building: "3–20%", health: "0–10%", furniture: "0–12%",
      recreation: "0–12%", materials: "0–15%", baby: "0–10%", garden: "0–12%",
    },
    IN: {
      food: "0–15%", home: "3–15%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "0–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–10%", materials: "0–15%", baby: "0–5%", garden: "0–10%",
    },
    BR: {
      food: "0–15%", home: "5–20%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "5–20%", health: "0–10%", furniture: "0–12%",
      recreation: "0–12%", materials: "0–15%", baby: "0–5%", garden: "0–10%",
    },
    TR: {
      food: "0–15%", home: "5–20%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "5–20%", health: "0–10%", furniture: "0–12%",
      recreation: "0–12%", materials: "0–15%", baby: "0–5%", garden: "0–10%",
    },
    BD: {
      food: "0–10%", home: "0–15%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "0–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–10%", materials: "0–10%", baby: "0–5%", garden: "0–10%",
    },
    ID: {
      food: "0–10%", home: "3–15%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "3–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–10%", materials: "0–15%", baby: "0–5%", garden: "0–10%",
    },
    TH: {
      food: "0–10%", home: "3–15%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "3–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–12%", materials: "0–15%", baby: "0–5%", garden: "0–10%",
    },
    MY: {
      food: "0–10%", home: "0–15%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "0–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–12%", materials: "0–15%", baby: "0–5%", garden: "0–10%",
    },
    GB: {
      food: "0–15%", home: "0–12%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "0–12%", health: "0–10%", furniture: "0–8%",
      recreation: "0–12%", materials: "0–12%", baby: "0–5%", garden: "0–10%",
    },
    AU: {
      food: "0–10%", home: "0–10%", electronics: "0–5%", clothing: "0–15%",
      mobility: "0–5%", building: "0–10%", health: "0–10%", furniture: "0–8%",
      recreation: "0–8%", materials: "0–10%", baby: "0–5%", garden: "0–8%",
    },
    NZ: {
      food: "0–10%", home: "0–12%", electronics: "0–5%", clothing: "0–15%",
      mobility: "0–5%", building: "0–12%", health: "0–10%", furniture: "0–8%",
      recreation: "0–8%", materials: "0–12%", baby: "0–5%", garden: "0–8%",
    },
    TW: {
      food: "0–10%", home: "3–15%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "3–15%", health: "0–10%", furniture: "0–10%",
      recreation: "0–10%", materials: "0–15%", baby: "0–5%", garden: "0–8%",
    },
    CH: {
      food: "0–15%", home: "0–12%", electronics: "0–5%", clothing: "0–16%",
      mobility: "2.5–10%", building: "0–12%", health: "0–10%", furniture: "0–8%",
      recreation: "0–12%", materials: "0–12%", baby: "0–12%", garden: "0–10%",
    },
  },

  defaultRate: {
    food: "0–15%", home: "0–15%", electronics: "0–10%", clothing: "0–16%",
    mobility: "0–10%", building: "0–15%", health: "0–10%", furniture: "0–12%",
    recreation: "0–12%", materials: "0–15%", baby: "0–10%", garden: "0–12%",
  },

  // EU member states that should use EU tariff rates
  euMembers: ["EU", "DE", "FR", "IT", "NL", "ES", "BE", "IE", "PT", "GR", "AT", "FI", "SK", "CZ", "HU", "RO", "BG", "HR", "SI", "LT", "LV", "EE", "LU", "MT", "CY", "DK", "SE"],

  /**
   * Lookup tariff rate for a country + category
   */
  lookup(countryCode, categoryId) {
    const country = this.countries[countryCode] || this.countries.OTHER;

    // EU member states use EU rates
    const rateKey = this.euMembers.includes(countryCode) ? "EU" : countryCode;
    const rateTable = this.rates[rateKey] || this.defaultRate;
    const rate = rateTable[categoryId] || "0–10%";

    return {
      rate,
      confidence: countryCode === "OTHER" ? "low" : (this.rates[rateKey] ? "medium" : "low"),
      countryName: country.name,
      countryNotes: country.notes || "",
      flag: country.flag || "🌍",
    };
  },

  /**
   * Parse a rate string like "5–25%" into min/max/mid numbers
   */
  parseRate(rateStr) {
    const match = rateStr.match(/(\d+)\s*[–-]\s*(\d+)%/);
    if (!match) return { min: 0, max: 0, mid: 0 };
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    return { min, max, mid: Math.round((min + max) / 2) };
  },
};
