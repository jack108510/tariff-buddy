/**
 * Tariff Buddy — GS1 Barcode Prefix → Country Lookup
 *
 * The first 3 digits of a barcode (EAN/UPC/GTIN) indicate the GS1 country prefix.
 * This tells us the country where the barcode was ISSUED, which is usually
 * (but not always) the country of manufacture. It's a free, instant signal
 * that works on every barcode worldwide.
 *
 * Source: GS1 General Specifications — prefix assignments.
 *
 * IMPORTANT CAVEATS:
 * - Prefix = country where barcode was registered, NOT necessarily country of origin
 * - Multinational companies may register all barcodes in home country
 * - 'ISBN' prefixes (978/979) are books — country of publisher, not manufacture
 * - Some prefixes are reserved (coupons, internal use, etc.)
 */

const BARCODE_PREFIXES = {
  // Lookup function uses prefix ranges, not individual 3-digit lookups,
  // because some countries have wide ranges.
  // Array of [startPrefix, endPrefix, countryCode] for range matching.
  ranges: [
    ["000", "139", "US"],   // US & Canada (GS1 US)
    ["200", "299", "OTHER"], // Restricted distribution (internal/store)
    ["300", "379", "FR"],   // France
    ["380", "380", "BG"],   // Bulgaria
    ["383", "383", "SI"],   // Slovenia
    ["385", "385", "HR"],   // Croatia
    ["387", "387", "BA"],   // Bosnia
    ["389", "389", "ME"],   // Montenegro
    ["400", "440", "DE"],   // Germany
    ["450", "459", "JP"],   // Japan
    ["460", "469", "RU"],   // Russia
    ["470", "470", "KG"],   // Kyrgyzstan
    ["471", "471", "TW"],   // Taiwan
    ["474", "474", "EE"],   // Estonia
    ["475", "475", "LV"],   // Latvia
    ["476", "476", "AZ"],   // Azerbaijan
    ["477", "477", "LT"],   // Lithuania
    ["478", "478", "UZ"],   // Uzbekistan
    ["479", "479", "LK"],   // Sri Lanka
    ["480", "480", "PH"],   // Philippines
    ["481", "481", "BY"],   // Belarus
    ["482", "482", "UA"],   // Ukraine
    ["483", "483", "TM"],   // Turkmenistan
    ["484", "484", "MD"],   // Moldova
    ["485", "485", "AM"],   // Armenia
    ["486", "486", "GE"],   // Georgia
    ["487", "487", "KZ"],   // Kazakhstan
    ["488", "489", "OTHER"], // Reserved
    ["489", "489", "HK"],   // Hong Kong
    ["490", "499", "JP"],   // Japan
    ["500", "509", "GB"],   // United Kingdom
    ["520", "521", "GR"],   // Greece
    ["528", "528", "LB"],   // Lebanon
    ["529", "529", "CY"],   // Cyprus
    ["531", "531", "MK"],   // North Macedonia
    ["535", "535", "MT"],   // Malta
    ["539", "539", "IE"],   // Ireland
    ["540", "549", "BE"],   // Belgium & Luxembourg
    ["560", "560", "PT"],   // Portugal
    ["569", "569", "IS"],   // Iceland
    ["570", "579", "DK"],   // Denmark
    ["590", "590", "PL"],   // Poland
    ["594", "594", "LU"],   // Luxembourg
    ["599", "599", "HU"],   // Hungary
    ["600", "601", "ZA"],   // South Africa
    ["603", "603", "GH"],   // Ghana
    ["608", "608", "BH"],   // Bahrain
    ["609", "609", "MU"],   // Mauritius
    ["611", "611", "MA"],   // Morocco
    ["613", "613", "DZ"],   // Algeria
    ["616", "616", "KE"],   // Kenya
    ["618", "618", "CI"],   // Ivory Coast
    ["619", "619", "TN"],   // Tunisia
    ["621", "621", "SY"],   // Syria
    ["622", "622", "EG"],   // Egypt
    ["624", "624", "LY"],   // Libya
    ["625", "625", "JO"],   // Jordan
    ["626", "626", "IR"],   // Iran
    ["627", "627", "KW"],   // Kuwait
    ["628", "628", "SA"],   // Saudi Arabia
    ["629", "629", "AE"],   // UAE
    ["640", "649", "FI"],   // Finland
    ["690", "699", "CN"],   // China
    ["700", "709", "NO"],   // Norway
    ["729", "729", "IL"],   // Israel
    ["730", "739", "SE"],   // Sweden
    ["740", "740", "GT"],   // Guatemala
    ["741", "741", "SV"],   // El Salvador
    ["742", "742", "HN"],   // Honduras
    ["743", "743", "NI"],   // Nicaragua
    ["744", "744", "CR"],   // Costa Rica
    ["745", "745", "PA"],   // Panama
    ["746", "746", "DO"],   // Dominican Republic
    ["750", "750", "MX"],   // Mexico
    ["754", "755", "CA"],   // Canada
    ["759", "759", "VE"],   // Venezuela
    ["760", "769", "CH"],   // Switzerland
    ["770", "771", "CO"],   // Colombia
    ["773", "773", "UY"],   // Uruguay
    ["775", "775", "PE"],   // Peru
    ["777", "777", "BO"],   // Bolivia
    ["779", "779", "AR"],   // Argentina
    ["780", "780", "CL"],   // Chile
    ["784", "784", "PY"],   // Paraguay
    ["786", "786", "EC"],   // Ecuador
    ["789", "790", "BR"],   // Brazil
    ["800", "839", "IT"],   // Italy
    ["840", "849", "ES"],   // Spain
    ["850", "850", "CU"],   // Cuba
    ["858", "858", "SK"],   // Slovakia
    ["859", "859", "CZ"],   // Czech Republic
    ["860", "860", "RS"],   // Serbia
    ["865", "865", "MN"],   // Mongolia
    ["867", "867", "KP"],   // North Korea
    ["868", "869", "TR"],   // Türkiye
    ["870", "879", "NL"],   // Netherlands
    ["880", "880", "KR"],   // South Korea
    ["884", "884", "KH"],   // Cambodia
    ["885", "885", "TH"],   // Thailand
    ["888", "888", "SG"],   // Singapore
    ["890", "890", "IN"],   // India
    ["893", "893", "VN"],   // Vietnam
    ["894", "894", "OTHER"], // Reserved
    ["896", "896", "PK"],   // Pakistan
    ["899", "899", "ID"],   // Indonesia
    ["900", "919", "AT"],   // Austria
    ["930", "939", "AU"],   // Australia
    ["940", "949", "NZ"],   // New Zealand
    ["955", "955", "MY"],   // Malaysia
    ["958", "958", "OTHER"], // Macau
    ["960", "961", "OTHER"], // GS1 global office (could be any country)
    ["962", "965", "OTHER"], // Global
    ["966", "969", "OTHER"], // Global
    ["977", "977", "OTHER"], // Serial publications (ISSN)
    ["978", "979", "OTHER"], // ISBN (books — country of publisher)
    ["980", "980", "OTHER"], // Refund receipts
    ["981", "984", "OTHER"], // Common currency coupons
    ["985", "985", "OTHER"], // Coupons
    ["986", "989", "OTHER"], // GS1 global office
    ["990", "999", "OTHER"], // Coupons
  ],

  /**
   * Additional country names for non-tariff-table countries
   * (so we can still show the user something meaningful)
   */
  extraNames: {
    RU: "Russia", UA: "Ukraine", PL: "Poland", SE: "Sweden", NO: "Norway",
    FI: "Finland", DK: "Denmark", BE: "Belgium", PT: "Portugal", IE: "Ireland",
    GR: "Greece", CZ: "Czech Republic", SK: "Slovakia", HU: "Hungary", RO: "Romania",
    BG: "Bulgaria", HR: "Croatia", SI: "Slovenia", LT: "Lithuania", LV: "Latvia",
    EE: "Estonia", IS: "Iceland", LU: "Luxembourg", MT: "Malta", CY: "Cyprus",
    MK: "North Macedonia", ME: "Montenegro", RS: "Serbia", BA: "Bosnia", AL: "Albania",
    BY: "Belarus", MD: "Moldova", GE: "Georgia", AM: "Armenia", AZ: "Azerbaijan",
    KZ: "Kazakhstan", UZ: "Uzbekistan", KG: "Kyrgyzstan", TM: "Turkmenistan",
    IL: "Israel", LB: "Lebanon", JO: "Jordan", SY: "Syria", IQ: "Iraq",
    IR: "Iran", KW: "Kuwait", SA: "Saudi Arabia", AE: "UAE", BH: "Bahrain",
    QA: "Qatar", OM: "Oman", YE: "Yemen", EG: "Egypt", DZ: "Algeria",
    MA: "Morocco", TN: "Tunisia", LY: "Libya", SD: "Sudan", ET: "Ethiopia",
    KE: "Kenya", UG: "Uganda", TZ: "Tanzania", NG: "Nigeria", GH: "Ghana",
    CI: "Ivory Coast", ZA: "South Africa", MU: "Mauritius", MG: "Madagascar",
    GT: "Guatemala", SV: "El Salvador", HN: "Honduras", NI: "Nicaragua",
    CR: "Costa Rica", PA: "Panama", DO: "Dominican Republic", CU: "Cuba",
    JM: "Jamaica", TT: "Trinidad & Tobago", CO: "Colombia", VE: "Venezuela",
    EC: "Ecuador", PE: "Peru", BO: "Bolivia", CL: "Chile", AR: "Argentina",
    UY: "Uruguay", PY: "Paraguay", BR: "Brazil", MX: "Mexico",
    HK: "Hong Kong", SG: "Singapore", KH: "Cambodia", LA: "Laos",
    MM: "Myanmar", PK: "Pakistan", LK: "Sri Lanka", NP: "Nepal",
    MN: "Mongolia", KP: "North Korea",
  },

  /**
   * Look up the country for a barcode
   * @param {string} barcode - The full barcode number (string)
   * @returns {object} { countryCode, countryName, prefixType, isBook }
   */
  lookup(barcode) {
    if (!barcode || barcode.length < 3) {
      return { countryCode: "OTHER", countryName: "Unknown", prefixType: "invalid", isBook: false };
    }

    // Normalize: remove leading zeros from UPC-A to get GS1-comparable prefix
    // UPC-A barcodes start with 0, so "049000028904" → prefix "049" → treated as US
    const normalized = barcode.replace(/^0+/, "") || "0";
    // For UPC-A (starting with 0), the barcode IS a US/Canada product
    const prefix3 = barcode.substring(0, 3);

    // Check for books (ISBN)
    if (prefix3 === "978" || prefix3 === "979") {
      return { countryCode: "OTHER", countryName: "Book (ISBN)", prefixType: "book", isBook: true };
    }

    // Find matching range
    const found = this.ranges.find(([start, end, code]) => {
      return prefix3 >= start && prefix3 <= end;
    });

    if (!found) {
      return { countryCode: "OTHER", countryName: "Unknown", prefixType: "unknown", isBook: false };
    }

    const countryCode = found[2];
    const countryName = (TARIFF_DATA.countries[countryCode]?.name) ||
                        this.extraNames[countryCode] ||
                        "Unknown";

    return {
      countryCode,
      countryName,
      prefixType: countryCode === "OTHER" ? "generic" : "national",
      isBook: false,
    };
  },

  /**
   * Get a confidence note explaining the reliability of barcode-based origin
   */
  confidenceNote(result) {
    if (result.isBook) return "This is a book (ISBN barcode). Books aren't affected by typical import tariffs.";
    if (result.prefixType === "national") return "Based on barcode country prefix. Usually indicates country of manufacture, but not guaranteed — large brands may register all barcodes in their home country.";
    if (result.prefixType === "generic") return "This barcode uses a generic or reserved prefix. Country of origin cannot be determined from the barcode alone.";
    return "Country of origin is estimated from the barcode prefix.";
  },
};
