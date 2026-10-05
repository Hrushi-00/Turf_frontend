// Turf API Service
import { buildApiUrl } from "./apiConfig";
import { apiRequest } from "./apiClient";

const PUBLIC_TURF_BASE_URL = buildApiUrl("/turfs");
const ADMIN_TURF_BASE_URL = buildApiUrl("/admin/turfs");

const extractRecords = (payload, keys) => {
  const result = payload?.data ?? payload;
  if (Array.isArray(result)) return { rows: result, pagination: null };
  for (const key of keys) {
    if (Array.isArray(result?.[key])) return { rows: result[key], pagination: result.pagination || result.meta || null };
  }
  return { rows: [], pagination: result?.pagination || result?.meta || null };
};

const normalizeCatalogItem = (item, type) => {
  const isVenue = type === "venue";
  const sportNames = item.turfDetails?.sportsAvailable || item.sportsAvailable || item.sportSlugs || item.sports || [];
  const firstSport = sportNames[0];
  return {
    ...item,
    id: item._id || item.id,
    name: item.turfDetails?.turfName || item.name || item.venue?.name || "Sports venue",
    sport: typeof firstSport === "string" ? firstSport : firstSport?.name || "Sports",
    sportsAvailable: sportNames,
    location: item.location?.city || item.city || item.address?.city || "Location unavailable",
    address: item.location?.address || item.address || "",
    price: item.pricing?.weekdayRate ?? item.pricing?.minPrice ?? item.price ?? 0,
    image: item.gallery?.mainImage || item.media?.[0]?.url || item.media?.[0] || "",
    description: item.turfDetails?.description || item.description || "",
    available: item.availableSlots ?? item.available ?? 0,
    slots: item.availability ? `${item.availability.openingTime || ""}-${item.availability.closingTime || ""}` : "",
    kind: isVenue ? "venue" : "turf",
  };
};

export const getTurfById = async (id) => {
  try {
    const response = await fetch(`${PUBLIC_TURF_BASE_URL}/${id}`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getApprovedTurfs = async () => {
  try {
    const response = await fetch(`${PUBLIC_TURF_BASE_URL}/approved/list`);
    const data = await response.json();
    if (response.ok) {
      // Transform backend data to match frontend requirements
      const turfs = Array.isArray(data) ? data : data.data || [];
      const transformed = turfs.map((turf) => ({
        id: turf._id,
        name: turf.turfDetails.turfName,
        sport: turf.turfDetails.sportsAvailable?.[0] || "Sports",
        location: turf.location.city,
        price: turf.pricing.weekdayRate,
        rating: 4.5, // Will need to calculate from reviews
        slots: `${turf.availability.openingTime}-${turf.availability.closingTime}`,
        image: turf.gallery.mainImage,
        available: 5, // Will need to calculate from bookings
        description: turf.turfDetails.description,
        capacity: turf.turfDetails.capacity,
        sportsAvailable: turf.turfDetails.sportsAvailable,
        address: turf.location.address,
        weekdayRate: turf.pricing.weekdayRate,
        weekendRate: turf.pricing.weekendRate,
        amenities: turf.amenities,
        thumbnailImages: turf.gallery.thumbnailImages,
      }));
      return { success: true, data: transformed };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const searchTurfs = async (filters = {}) => {
  const result = await apiRequest("/turfs", { query: filters });
  if (!result.success) return result;
  const { rows, pagination } = extractRecords(result.data, ["turfs", "items", "results"]);
  return { ...result, data: rows.map((item) => normalizeCatalogItem(item, "turf")), pagination };
};

export const searchNearbyTurfs = async (filters = {}) => {
  const result = await apiRequest("/turfs/nearby", { query: filters });
  if (!result.success) return result;
  const { rows, pagination } = extractRecords(result.data, ["turfs", "items", "results"]);
  return { ...result, data: rows.map((item) => normalizeCatalogItem(item, "turf")), pagination };
};

export const searchVenues = async (filters = {}) => {
  const result = await apiRequest("/venues", { query: filters });
  if (!result.success) return result;
  const { rows, pagination } = extractRecords(result.data, ["venues", "items", "results"]);
  return { ...result, data: rows.map((item) => normalizeCatalogItem(item, "venue")), pagination };
};

export const addTurf = async (turfData) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(ADMIN_TURF_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(turfData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateTurf = async (id, turfData) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_TURF_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(turfData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteTurf = async (id) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_TURF_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const approveTurf = async (id) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_TURF_BASE_URL}/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const rejectTurf = async (id, reason) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_TURF_BASE_URL}/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAllAdminTurfs = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(ADMIN_TURF_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getBusinessTurfs = async () => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(buildApiUrl("/business/turfs"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data: Array.isArray(data) ? data : data.data || [] };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createBusinessTurf = async (turfData) => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(buildApiUrl("/business/turfs"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(turfData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateBusinessTurf = async (id, turfData) => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(buildApiUrl(`/business/turfs/${id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(turfData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteBusinessTurf = async (id) => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(buildApiUrl(`/business/turfs/${id}`), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getFeaturedTurfs = async () => {
  try {
    const response = await fetch(`${PUBLIC_TURF_BASE_URL}/featured`);
    const data = await response.json();
    if (response.ok) {
      const turfs = Array.isArray(data) ? data : data.data || [];
      return { success: true, data: turfs };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getTrendingTurfs = async () => {
  try {
    const response = await fetch(`${PUBLIC_TURF_BASE_URL}/trending`);
    const data = await response.json();
    if (response.ok) {
      const turfs = Array.isArray(data) ? data : data.data || [];
      return { success: true, data: turfs };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
