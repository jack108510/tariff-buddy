/**
 * Tariff Buddy — Canadian Tariff Rate Table
 *
 * Rates reflect Canadian import tariff ranges by country of origin and product category.
 * Source: CBSA Customs Tariff Schedule — snapshot compiled Aug 2025.
 *
 * Canada's tariff structure:
 * - Many goods enter duty-free under CUSMA (USMCA), CETA, CPTPP, etc.
 * - Most-Favoured-Nation (MFN) rates apply to countries without trade agreements
 * - China does NOT have a free trade agreement with Canada → MFN rates apply
 *
 * Rates are approximate consumer-level ranges, not exact HS line items.
 */

const CA_TARIFF_DATA = {
  version: "2025-08",
  source: "CBSA Customs Tariff Schedule (curated ranges)",

  countries: {
    CN: { name: "China", flag: "🇨🇳", notes: "MFN rates — no free trade agreement" },
    US: { name: "United States", flag: "🇺🇸", notes: "CUSMA duty-free for most goods" },
    MX: { name: "Mexico", flag: "🇲🇽", notes: "CUSMA duty-free for most goods" },
    EU: { name: "European Union", flag: "🇪🇺", notes: "CETA provisional — many goods duty-free" },
    GB: { name: "United Kingdom", flag: "🇬🇧", notes: "Canada-UK TCA — many goods duty-free" },
    JP: { name: "Japan", flag: "🇯🇵", notes: "CPTPP — many goods duty-free" },
    KR: { name: "South Korea", flag: "🇰🇷", notes: "CKFTA — many goods duty-free" },
    VN: { name: "Vietnam", flag: "🇻🇳", notes: "CPTPP — reduced rates" },
    IN: { name: "India", flag: "🇮🇳", notes: "MFN rates" },
    BR: { name: "Brazil", flag: "🇧🇷", notes: "MFN rates" },
    TR: { name: "Türkiye", flag: "🇹🇷", notes: "MFN rates" },
    BD: { name: "Bangladesh", flag: "🇧🇩", notes: "GPT/LDCT eligible" },
    ID: { name: "Indonesia", flag: "🇮🇩", notes: "MFN rates" },
    TH: { name: "Thailand", flag: "🇹🇭", notes: "MFN rates" },
    MY: { name: "Malaysia", flag: "🇲🇾", notes: "CPTPP — reduced rates" },
    AU: { name: "Australia", flag: "🇦🇺", notes: "CPTPP — reduced rates" },
    NZ: { name: "New Zealand", flag: "🇳🇿", notes: "CPTPP — reduced rates" },
    CH: { name: "Switzerland", flag: "🇨🇭", notes: "EFTA — many goods duty-free" },
    TW: { name: "Taiwan", flag: "🇹🇼", notes: "MFN rates" },
    CA: { name: "Canada", flag: "🇨🇦", notes: "Domestic — no import tariff" },
    OTHER: { name: "Other / Unknown", flag: "🌍", notes: "Rate may vary — check product label" },
  },

  euMembers: ["EU", "DE", "FR", "IT", "NL", "ES", "BE", "IE", "PT", "GR", "AT", "FI", "SK", "CZ", "HU", "RO", "BG", "HR", "SI", "LT", "LV", "EE", "LU", "MT", "CY", "DK", "SE"],
  cptaMembers: ["US", "MX", "JP", "VN", "MY", "AU", "NZ", "SG", "BN", "CL", "PE"], // CPTPP members
  cusmaMembers: ["US", "MX"],

  rates: {
    CN: {
      food: "0–15%",      // Dairy protected but most food MFN low
      home: "0–15%",      // Kitchenware MFN
      electronics: "0–5%", // Electronics generally low MFN
      clothing: "12–18%",  // Apparel MFN rates significant
      mobility: "0–6%",    // Auto parts
      building: "0–12%",   // Hardware
      health: "0–8%",      // Personal care
      furniture: "0–12%",  // Furniture MFN
      recreation: "0–8%",  // Toys generally duty-free
      materials: "0–12%",  // Industrial
      baby: "0–8%",        // Baby items low
      garden: "0–8%",      // Garden items
    },
    US: {
      food: "0–5%", home: "0%", electronics: "0%", clothing: "0–5%",
      mobility: "0%", building: "0%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0%", baby: "0%", garden: "0%",
    },
    MX: {
      food: "0–5%", home: "0%", electronics: "0%", clothing: "0–5%",
      mobility: "0%", building: "0%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0%", baby: "0%", garden: "0%",
    },
    EU: {
      food: "0–12%", home: "0%", electronics: "0%", clothing: "0–8%",
      mobility: "0–6%", building: "0%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0%", baby: "0%", garden: "0%",
    },
    GB: {
      food: "0–10%", home: "0%", electronics: "0%", clothing: "0–8%",
      mobility: "0–6%", building: "0%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0%", baby: "0%", garden: "0%",
    },
    JP: {
      food: "0–10%", home: "0%", electronics: "0%", clothing: "0–8%",
      mobility: "0–6%", building: "0%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0%", baby: "0%", garden: "0%",
    },
    KR: {
      food: "0–10%", home: "0–5%", electronics: "0%", clothing: "0–8%",
      mobility: "0–5%", building: "0–5%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0–5%", baby: "0%", garden: "0%",
    },
    VN: {
      food: "0–8%", home: "0–8%", electronics: "0%", clothing: "8–18%",
      mobility: "0–5%", building: "0–8%", health: "0%", furniture: "0–8%",
      recreation: "0%", materials: "0–8%", baby: "0%", garden: "0%",
    },
    IN: {
      food: "0–12%", home: "0–15%", electronics: "0–5%", clothing: "12–18%",
      mobility: "0–6%", building: "0–12%", health: "0–8%", furniture: "0–12%",
      recreation: "0–8%", materials: "0–12%", baby: "0–8%", garden: "0–8%",
    },
    BR: {
      food: "0–12%", home: "0–15%", electronics: "0–5%", clothing: "12–18%",
      mobility: "0–6%", building: "0–12%", health: "0–8%", furniture: "0–12%",
      recreation: "0–8%", materials: "0–12%", baby: "0–8%", garden: "0–8%",
    },
    TR: {
      food: "0–12%", home: "0–15%", electronics: "0–5%", clothing: "12–18%",
      mobility: "0–6%", building: "0–12%", health: "0–8%", furniture: "0–12%",
      recreation: "0–8%", materials: "0–12%", baby: "0–8%", garden: "0–8%",
    },
    BD: {
      food: "0–5%", home: "0–5%", electronics: "0%", clothing: "0–12%",
      mobility: "0%", building: "0–5%", health: "0%", furniture: "0–5%",
      recreation: "0%", materials: "0–5%", baby: "0%", garden: "0%",
    },
    ID: {
      food: "0–10%", home: "0–12%", electronics: "0–5%", clothing: "12–18%",
      mobility: "0–5%", building: "0–12%", health: "0–8%", furniture: "0–12%",
      recreation: "0–8%", materials: "0–12%", baby: "0–8%", garden: "0–8%",
    },
    TH: {
      food: "0–10%", home: "0–12%", electronics: "0–5%", clothing: "12–18%",
      mobility: "0–5%", building: "0–12%", health: "0–8%", furniture: "0–12%",
      recreation: "0–8%", materials: "0–12%", baby: "0–8%", garden: "0–8%",
    },
    MY: {
      food: "0–8%", home: "0–8%", electronics: "0%", clothing: "8–18%",
      mobility: "0–5%", building: "0–8%", health: "0%", furniture: "0–8%",
      recreation: "0%", materials: "0–8%", baby: "0%", garden: "0%",
    },
    AU: {
      food: "0–8%", home: "0–5%", electronics: "0%", clothing: "0–8%",
      mobility: "0–5%", building: "0–5%", health: "0%", furniture: "0",
      recreation: "0%", materials: "0–5%", baby: "0%", garden: "0%",
    },
    NZ: {
      food: "0–8%", home: "0–5%", electronics: "0%", clothing: "0–8%",
      mobility: "0–5%", building: "0–5%", health: "0%", furniture: "0",
      recreation: "0%", materials: "0–5%", baby: "0%", garden: "0%",
    },
    CH: {
      food: "0–10%", home: "0%", electronics: "0%", clothing: "0–8%",
      mobility: "0–6%", building: "0%", health: "0%", furniture: "0%",
      recreation: "0%", materials: "0%", baby: "0%", garden: "0%",
    },
    TW: {
      food: "0–10%", home: "0–12%", electronics: "0–5%", clothing: "12–18%",
      mobility: "0–5%", building: "0–12%", health: "0–8%", furniture: "0–12%",
      recreation: "0–8%", materials: "0–12%", baby: "0–8%", garden: "0–8%",
    },
  },

  defaultRate: {
    food: "0–10%", home: "0–10%", electronics: "0–5%", clothing: "0–12%",
    mobility: "0–5%", building: "0–10%", health: "0–5%", furniture: "0–10%",
    recreation: "0–5%", materials: "0–10%", baby: "0–5%", garden: "0–8%",
  },

  lookup(countryCode, categoryId) {
    const country = this.countries[countryCode] || this.countries.OTHER;
    const rateKey = this.euMembers.includes(countryCode) ? "EU" : countryCode;
    const rateTable = this.rates[rateKey] || this.defaultRate;
    const rate = rateTable[categoryId] || "0–8%";
    return {
      rate,
      confidence: countryCode === "OTHER" ? "low" : (this.rates[rateKey] ? "medium" : "low"),
      countryName: country.name,
      countryNotes: country.notes || "",
      flag: country.flag || "🌍",
    };
  },

  parseRate(rateStr) {
    const match = rateStr.match(/(\d+)\s*[–-]\s*(\d+)%/);
    if (!match) return { min: 0, max: 0, mid: 0 };
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    return { min, max, mid: Math.round((min + max) / 2) };
  },
};
