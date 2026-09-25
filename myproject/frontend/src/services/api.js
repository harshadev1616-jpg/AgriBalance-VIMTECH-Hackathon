const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("agribalance_access_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export const api = {
  health: () => request("/health/"),
  currentWeather: (lat, lon) => request(`/weather/current/?lat=${lat}&lon=${lon}`),
  forecast: (lat, lon) => request(`/weather/forecast/?lat=${lat}&lon=${lon}`),
  nasaImagery: (lat, lon) => request(`/earth/imagery/?lat=${lat}&lon=${lon}`),
  soilProfile: (lat, lon) => request(`/soil/profile/?lat=${lat}&lon=${lon}`),
  marketPrices: (district, commodity) => {
    const query = new URLSearchParams({ state: "Karnataka", limit: "25" });
    if (district) query.set("district", district);
    if (commodity) query.set("commodity", commodity);
    return request(`/market/prices/?${query.toString()}`);
  },
  marketPriceIntelligence: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/market/price-intelligence/?${query.toString()}`);
  },
  predictYield: (payload) =>
    request("/ai/yield-prediction/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cropBalancing: (payload) =>
    request("/ai/crop-balancing/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  districtHeatmap: () => request("/districts/heatmap/"),
  compareDistricts: (districts) =>
    request("/districts/compare/", {
      method: "POST",
      body: JSON.stringify({ districts }),
    }),
  marketIntelligence: (district, crop) => {
    const query = new URLSearchParams({ district, crop });
    return request(`/market/intelligence/?${query.toString()}`);
  },
  askFarmerAssistant: (payload) =>
    request("/ai/farmer-assistant/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  smartNotifications: (district) => request(`/notifications/smart/?district=${encodeURIComponent(district)}`),
  profitCalculator: (payload) =>
    request("/profit/calculator/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  satelliteAnalytics: (district) => request(`/earth/satellite-analytics/?district=${encodeURIComponent(district)}`),
  adminAnalytics: () => request("/analytics/admin/"),
  governmentDashboard: () => request("/dashboard/government/"),
  schemes: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/schemes/?${query.toString()}`);
  },
  dailyDecision: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/decision/today/?${query.toString()}`);
  },
  farmerProfile: () => request("/auth/farmer-profile/"),
  updateFarmerProfile: (payload) =>
    request("/auth/farmer-profile/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
