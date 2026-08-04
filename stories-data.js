/**
 * Tariff Buddy — Curated Tariff Stories
 *
 * Plain-English explanations of tariff events and how they affect prices.
 * Each story connects policy → products → what you can do.
 *
 * Updated when major tariff changes happen. Not automated — these are
 * hand-written summaries of real trade policy events.
 */

const TARIFF_STORIES = [
  {
    id: "cn-section301-2025",
    headline: "US tariffs on Chinese electronics are increasing",
    date: "2025-08-01",
    severity: "high",
    tag: "Electronics",
    what: "Section 301 tariffs on Chinese imports increased in 2025. Products like phones, computers, and small appliances from China now face tariffs of 7.5–25% on top of normal duties.",
    affected: "Phone chargers, Bluetooth speakers, small kitchen appliances, computer accessories, LED lights",
    category: "electronics",
    origin: "CN",
    action: "If you're planning to replace an electronic device, compare prices now before the cost increase fully hits retail shelves. Look for products assembled in Vietnam, South Korea, or Mexico — they face lower tariffs.",
    sources: ["USTR Section 301 modifications", "Federal Register notices"],
  },
  {
    id: "softwood-lumber-ca-2025",
    headline: "US softwood lumber duties on Canada stay high",
    date: "2025-07-15",
    severity: "medium",
    tag: "Building & Home",
    what: "The US continues to impose countervailing and anti-dumping duties on Canadian softwood lumber. Current combined rates are around 14.5%, making Canadian wood significantly more expensive for US buyers.",
    affected: "Wooden furniture, flooring, fencing, decking, building materials, garden structures",
    category: "building",
    origin: "CA",
    action: "For home improvement projects, compare lumber prices at multiple suppliers. Consider engineered wood alternatives or domestic lumber sources to avoid the Canadian lumber premium.",
    sources: ["US Department of Commerce", "US Lumber Coalition"],
  },
  {
    id: "steel-aluminum-2025",
    headline: "Steel and aluminum tariffs keep metal goods pricey",
    date: "2025-07-01",
    severity: "high",
    tag: "Tools & Hardware",
    what: "Section 232 tariffs on steel (25%) and aluminum (10%) remain in place for most countries. These increase the cost of anything made with metal, from tools to cookware to car parts.",
    affected: "Hand tools, power tools, metal cookware, cutlery, hardware, fasteners, bike frames, car parts",
    category: "building",
    origin: "MULTI",
    action: "If you need metal tools or hardware, compare prices between brands. Tools assembled in the US from domestic steel avoid the tariff entirely. For cookware, cast iron and ceramic alternatives aren't affected.",
    sources: ["Section 232 proclamations", "USITC tariff data"],
  },
  {
    id: "eu-retaliatory-2025",
    headline: "EU tariffs on US goods affect what Americans can export",
    date: "2025-06-20",
    severity: "low",
    tag: "Trade",
    what: "The EU maintains retaliatory tariffs on certain US products like motorcycles, bourbon, and some food items. While this primarily affects exporters, it can change product availability and pricing in both directions.",
    affected: "Imported European specialty goods — cheese, wine, olive oil, chocolate, specialty cookware",
    category: "food",
    origin: "EU",
    action: "For imported European food items, compare prices across retailers. Some specialty products may carry a premium. Locally produced alternatives to European staples (cheese, wine) are often competitively priced.",
    sources: ["European Commission trade announcements", "WTO dispute records"],
  },
  {
    id: "vn-clothing-2025",
    headline: "Vietnam remains a major clothing source — tariff rates vary",
    date: "2025-06-01",
    severity: "medium",
    tag: "Clothing",
    what: "Vietnam is one of the world's largest apparel exporters. Clothing imported from Vietnam faces US tariff rates of 8–32% depending on the garment type, with some categories among the highest in the tariff schedule.",
    affected: "T-shirts, jeans, shoes, jackets, activewear, bags, most everyday clothing",
    category: "clothing",
    origin: "VN",
    action: "Clothing tariffs are baked into retail prices already, but sales and clearance events are the best way to beat the markup. Check the label — clothing made in USMCA countries (US, Canada, Mexico) often faces zero duty.",
    sources: ["USITC Harmonized Tariff Schedule Chapter 61-63"],
  },
  {
    id: "cn-furniture-2025",
    headline: "Chinese furniture faces steep tariffs",
    date: "2025-05-15",
    severity: "high",
    tag: "Furniture",
    what: "Furniture from China faces some of the highest combined tariff rates — up to 25% when Section 301 tariffs stack on top of standard duties. This affects a huge share of budget furniture sold in the US.",
    affected: "Sofas, tables, chairs, shelving, bed frames, dressers, office furniture, outdoor furniture",
    category: "furniture",
    origin: "CN",
    action: "For furniture purchases, compare pieces from Vietnam, Mexico, or domestically manufactured options. Flat-pack furniture assembled in the US from imported parts may have lower tariff exposure than fully imported pieces.",
    sources: ["Section 301 List 3 and 4A", "US furniture import data"],
  },
];
