-- ============================================
-- Tariff Buddy — Database Schema
-- Project: xacehhtgvubcqdoltazg (wildrose)
-- ============================================

-- 1. USER PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS tb_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  country_code TEXT DEFAULT 'US',
  currency TEXT DEFAULT 'USD',
  locale TEXT DEFAULT 'en-US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.tb_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tb_users (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tb_on_auth_user_created ON auth.users;
CREATE TRIGGER tb_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tb_handle_new_user();

-- 2. TARIFF RATES (dynamic, admin-editable)
CREATE TABLE IF NOT EXISTS tb_tariff_rates (
  id SERIAL PRIMARY KEY,
  country_code TEXT NOT NULL,
  category TEXT NOT NULL,
  rate_min INTEGER NOT NULL DEFAULT 0,
  rate_max INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'USITC HTS',
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, category)
);

-- 3. SCAN HISTORY (per user, synced across devices)
CREATE TABLE IF NOT EXISTS tb_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  country_code TEXT,
  country_name TEXT,
  category TEXT,
  tariff_rate TEXT,
  tariff_mid INTEGER,
  confidence TEXT,
  origin_note TEXT,
  has_product_data BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SAVED PRODUCTS / WATCHLIST
CREATE TABLE IF NOT EXISTS tb_saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT,
  product_name TEXT,
  brand TEXT,
  country_code TEXT,
  tariff_rate TEXT,
  category TEXT,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, barcode)
);

-- 5. TARIFF STORIES (admin-editable, replaces hardcoded stories-data.js)
CREATE TABLE IF NOT EXISTS tb_stories (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  tag TEXT NOT NULL,
  what TEXT NOT NULL,
  affected TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  origin TEXT NOT NULL,
  sources TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COUNTRIES (reference table)
CREATE TABLE IF NOT EXISTS tb_countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT,
  region TEXT,
  notes TEXT
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- tb_users: users can only see/edit their own profile
ALTER TABLE tb_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON tb_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON tb_users FOR UPDATE USING (auth.uid() = id);

-- tb_scans: users can only CRUD their own scans
ALTER TABLE tb_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scans" ON tb_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON tb_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON tb_scans FOR DELETE USING (auth.uid() = user_id);

-- tb_saved_products: users can only CRUD their own saved products
ALTER TABLE tb_saved_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved products" ON tb_saved_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved products" ON tb_saved_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved products" ON tb_saved_products FOR DELETE USING (auth.uid() = user_id);

-- tb_tariff_rates: readable by everyone, writable by admin only (via service role)
ALTER TABLE tb_tariff_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tariff rates" ON tb_tariff_rates FOR SELECT USING (true);

-- tb_stories: published stories readable by everyone
ALTER TABLE tb_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published stories" ON tb_stories FOR SELECT USING (is_published = true);

-- tb_countries: readable by everyone
ALTER TABLE tb_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read countries" ON tb_countries FOR SELECT USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tb_scans_user ON tb_scans(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_tb_saved_user ON tb_saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_tb_stories_date ON tb_stories(date DESC);
CREATE INDEX IF NOT EXISTS idx_tb_rates_lookup ON tb_tariff_rates(country_code, category);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tb_users_updated_at BEFORE UPDATE ON tb_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tb_tariff_rates_updated_at BEFORE UPDATE ON tb_tariff_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tb_stories_updated_at BEFORE UPDATE ON tb_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Countries
INSERT INTO tb_countries (code, name, flag, region) VALUES
  ('CN', 'China', '🇨🇳', 'Asia'),
  ('MX', 'Mexico', '🇲🇽', 'North America'),
  ('CA', 'Canada', '🇨🇦', 'North America'),
  ('US', 'United States', '🇺🇸', 'North America'),
  ('EU', 'European Union', '🇪🇺', 'Europe'),
  ('DE', 'Germany', '🇩🇪', 'Europe'),
  ('FR', 'France', '🇫🇷', 'Europe'),
  ('IT', 'Italy', '🇮🇹', 'Europe'),
  ('JP', 'Japan', '🇯🇵', 'Asia'),
  ('KR', 'South Korea', '🇰🇷', 'Asia'),
  ('VN', 'Vietnam', '🇻🇳', 'Asia'),
  ('IN', 'India', '🇮🇳', 'Asia'),
  ('BR', 'Brazil', '🇧🇷', 'South America'),
  ('TR', 'Türkiye', '🇹🇷', 'Asia'),
  ('BD', 'Bangladesh', '🇧🇩', 'Asia'),
  ('ID', 'Indonesia', '🇮🇩', 'Asia'),
  ('TH', 'Thailand', '🇹🇭', 'Asia'),
  ('MY', 'Malaysia', '🇲🇾', 'Asia'),
  ('GB', 'United Kingdom', '🇬🇧', 'Europe'),
  ('AU', 'Australia', '🇦🇺', 'Oceania'),
  ('NZ', 'New Zealand', '🇳🇿', 'Oceania'),
  ('CH', 'Switzerland', '🇨🇭', 'Europe'),
  ('TW', 'Taiwan', '🇹🇼', 'Asia')
ON CONFLICT (code) DO NOTHING;

-- Tariff rates (key countries, seeded from our static data)
INSERT INTO tb_tariff_rates (country_code, category, rate_min, rate_max, notes) VALUES
  ('CN', 'electronics', 8, 25, 'Section 301 tariffs'),
  ('CN', 'food', 5, 25, 'Section 301 tariffs on food'),
  ('CN', 'home', 15, 35, 'Section 301 List 3'),
  ('CN', 'clothing', 16, 32, 'High textile tariffs + Sec 301'),
  ('CN', 'furniture', 0, 25, 'Section 301 List 3'),
  ('CN', 'building', 10, 30, 'Tools and hardware'),
  ('MX', 'food', 0, 10, 'USMCA duty-free for most'),
  ('MX', 'electronics', 0, 5, 'USMCA'),
  ('MX', 'clothing', 0, 15, 'Some apparel tariffs remain'),
  ('CA', 'food', 0, 10, 'USMCA'),
  ('CA', 'clothing', 0, 18, 'Some apparel categories'),
  ('EU', 'food', 5, 20, 'EU agricultural tariffs'),
  ('EU', 'electronics', 0, 5, ''),
  ('JP', 'food', 0, 15, ''),
  ('JP', 'electronics', 0, 5, ''),
  ('KR', 'electronics', 0, 5, 'KORUS FTA'),
  ('VN', 'clothing', 8, 32, 'Major apparel exporter'),
  ('VN', 'furniture', 0, 12, 'Major furniture source'),
  ('VN', 'electronics', 0, 5, ''),
  ('GB', 'food', 0, 15, ''),
  ('GB', 'electronics', 0, 5, '')
ON CONFLICT (country_code, category) DO NOTHING;

-- Stories (seeded from stories-data.js)
INSERT INTO tb_stories (id, headline, date, severity, tag, what, affected, action, category, origin, sources) VALUES
  ('cn-section301-2025', 'US tariffs on Chinese electronics are increasing', '2025-08-01', 'high', 'Electronics', 'Section 301 tariffs on Chinese imports increased in 2025. Products like phones, computers, and small appliances from China now face tariffs of 7.5-25% on top of normal duties.', 'Phone chargers, Bluetooth speakers, small kitchen appliances, computer accessories, LED lights', 'If you''re planning to replace an electronic device, compare prices now before the cost increase fully hits retail shelves. Look for products assembled in Vietnam, South Korea, or Mexico — they face lower tariffs.', 'electronics', 'CN', ARRAY['USTR Section 301 modifications', 'Federal Register notices']),
  ('softwood-lumber-ca-2025', 'US softwood lumber duties on Canada stay high', '2025-07-15', 'medium', 'Building & Home', 'The US continues to impose countervailing and anti-dumping duties on Canadian softwood lumber. Current combined rates are around 14.5%, making Canadian wood significantly more expensive for US buyers.', 'Wooden furniture, flooring, fencing, decking, building materials, garden structures', 'For home improvement projects, compare lumber prices at multiple suppliers. Consider engineered wood alternatives or domestic lumber sources to avoid the Canadian lumber premium.', 'building', 'CA', ARRAY['US Department of Commerce', 'US Lumber Coalition']),
  ('steel-aluminum-2025', 'Steel and aluminum tariffs keep metal goods pricey', '2025-07-01', 'high', 'Tools & Hardware', 'Section 232 tariffs on steel (25%) and aluminum (10%) remain in place for most countries. These increase the cost of anything made with metal, from tools to cookware to car parts.', 'Hand tools, power tools, metal cookware, cutlery, hardware, fasteners, bike frames, car parts', 'If you need metal tools or hardware, compare prices between brands. Tools assembled in the US from domestic steel avoid the tariff entirely. For cookware, cast iron and ceramic alternatives arent affected.', 'building', 'MULTI', ARRAY['Section 232 proclamations', 'USITC tariff data']),
  ('eu-retaliatory-2025', 'EU tariffs on US goods affect what Americans can export', '2025-06-20', 'low', 'Trade', 'The EU maintains retaliatory tariffs on certain US products like motorcycles, bourbon, and some food items. While this primarily affects exporters, it can change product availability and pricing in both directions.', 'Imported European specialty goods — cheese, wine, olive oil, chocolate, specialty cookware', 'For imported European food items, compare prices across retailers. Some specialty products may carry a premium. Locally produced alternatives to European staples (cheese, wine) are often competitively priced.', 'food', 'EU', ARRAY['European Commission trade announcements', 'WTO dispute records']),
  ('vn-clothing-2025', 'Vietnam remains a major clothing source — tariff rates vary', '2025-06-01', 'medium', 'Clothing', 'Vietnam is one of the world''s largest apparel exporters. Clothing imported from Vietnam faces US tariff rates of 8-32% depending on the garment type, with some categories among the highest in the tariff schedule.', 'T-shirts, jeans, shoes, jackets, activewear, bags, most everyday clothing', 'Clothing tariffs are baked into retail prices already, but sales and clearance events are the best way to beat the markup. Check the label — clothing made in USMCA countries (US, Canada, Mexico) often faces zero duty.', 'clothing', 'VN', ARRAY['USITC Harmonized Tariff Schedule Chapter 61-63']),
  ('cn-furniture-2025', 'Chinese furniture faces steep tariffs', '2025-05-15', 'high', 'Furniture', 'Furniture from China faces some of the highest combined tariff rates — up to 25% when Section 301 tariffs stack on top of standard duties. This affects a huge share of budget furniture sold in the US.', 'Sofas, tables, chairs, shelving, bed frames, dressers, office furniture, outdoor furniture', 'For furniture purchases, compare pieces from Vietnam, Mexico, or domestically manufactured options. Flat-pack furniture assembled in the US from imported parts may have lower tariff exposure than fully imported pieces.', 'furniture', 'CN', ARRAY['Section 301 List 3 and 4A', 'US furniture import data'])
ON CONFLICT (id) DO NOTHING;
