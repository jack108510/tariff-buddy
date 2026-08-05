/**
 * Tariff Buddy — Supabase Client
 *
 * Connects the frontend to the Supabase backend.
 * Uses the publishable key for reads (no secret needed).
 * Authenticated users get their scan history synced.
 */

const SUPABASE_URL = "https://xacehhtgvubcqdoltazg.supabase.co";
const SUPABASE_KEY = "sb_publishable_1TNu5hqotJ7GGQXfjliivQ_ttK51EAA";

const SupabaseClient = {

  /**
   * Generic REST query
   */
  async query(table, params = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    const queryParts = [];
    for (const [key, value] of Object.entries(params)) {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
    url += queryParts.join("&");

    try {
      const res = await fetch(url, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`Supabase query failed for ${table}:`, e);
      return null;
    }
  },

  /**
   * Fetch all published tariff stories
   */
  async getStories() {
    return this.query("tb_stories", {
      "select": "id,headline,date,severity,tag,what,affected,action,category,origin,sources",
      "is_published": "eq.true",
      "order": "date.desc",
    });
  },

  /**
   * Fetch tariff rates for a country
   */
  async getTariffRates(countryCode) {
    return this.query("tb_tariff_rates", {
      "select": "category,rate_min,rate_max,notes",
      "country_code": `eq.${countryCode}`,
    });
  },

  /**
   * Fetch all countries
   */
  async getCountries() {
    return this.query("tb_countries", {
      "select": "code,name,flag,region",
      "order": "name.asc",
    });
  },

  /**
   * Fetch a story by ID
   */
  async getStory(id) {
    return this.query("tb_stories", {
      "select": "*",
      "id": `eq.${id}`,
    });
  },

  /**
   * Save a scan to the database (requires auth)
   */
  async saveScan(scanData, accessToken) {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tb_scans`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(scanData),
      });
      return res.ok;
    } catch (e) {
      console.warn("Failed to save scan:", e);
      return false;
    }
  },

  /**
   * Get scan history for authenticated user
   */
  async getScanHistory(accessToken) {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tb_scans?select=*&order=scanned_at.desc&limit=50`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  /**
   * Auth: sign up with email/password
   */
  async signUp(email, password) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  /**
   * Auth: sign in with email/password
   */
  async signIn(email, password) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  /**
   * Get user profile from tb_users
   */
  async getProfile(accessToken) {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tb_users?select=id,email,display_name,country_code,currency,locale&limit=1`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.length ? data[0] : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Update user profile (display_name, country_code)
   * Uses explicit id filter for safety (belt + RLS suspenders)
   */
  async updateProfile(updates, accessToken) {
    if (!accessToken) return null;
    try {
      // Decode user ID from JWT for explicit filter
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = payload.sub;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tb_users?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * Refresh an expired access token using the refresh token
   */
  async refreshToken(refreshToken) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  /**
   * Request password reset email
   */
  async resetPassword(email) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * Sign out (revoke current session token)
   */
  async signOut(accessToken) {
    if (!accessToken) return;
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
      });
    } catch (e) {}
  },

  /**
   * Delete account — removes the user's profile row.
   * The auth user is deleted via Supabase admin or cascade.
   */
  async deleteAccount(accessToken) {
    if (!accessToken) return false;
    try {
      // Delete profile row (RLS restricts to own row)
      await fetch(`${SUPABASE_URL}/rest/v1/tb_users?email=neq.impossible`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      // Sign out after deletion
      await this.signOut(accessToken);
      return true;
    } catch (e) {
      console.warn("Failed to delete account:", e);
      return false;
    }
  },
};
