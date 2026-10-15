// Turf API Service
import { buildApiUrl } from "./apiConfig";
import { apiRequest } from "./apiClient";

const PUBLIC_TURF_BASE_URL = buildApiUrl("/turfs");
const ADMIN_TURF_BASE_URL = buildApiUrl("/admin/turfs");

const extractRecords = (payload, keys) => {
  const result = payload?.data ?? payload;
  if (Array.isArray(result)) return { rows: result, pagination: null };
  for (const key of [...keys, "data"]) {
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
    const approvedUrl = new URL(`${PUBLIC_TURF_BASE_URL}/approved/list`);
    approvedUrl.searchParams.set("page", "1");
    approvedUrl.searchParams.set("limit", "100");
    const response = await fetch(approvedUrl.toString());
    const data = await response.json();
    if (response.ok) {
      // The API may return a raw array or a paginated/wrapped list.
      const payload = data?.data ?? data;
      const turfs = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.turfs)
          ? payload.turfs
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.results)
              ? payload.results
              : Array.isArray(payload?.data)
                ? payload.data
                : [];
      const transformed = turfs.map((turf) => ({
        ...turf,
        id: turf._id || turf.id,
        name: turf.turfDetails?.turfName || turf.name || "Sports turf",
        sport: turf.turfDetails?.sportsAvailable?.[0] || turf.sportsAvailable?.[0] || "Sports",
        location: turf.location?.city || turf.city || "Location unavailable",
        price: turf.pricing?.weekdayRate ?? turf.price ?? 0,
        rating: 4.5, // Will need to calculate from reviews
        slots: turf.availability ? `${turf.availability.openingTime || ""}-${turf.availability.closingTime || ""}` : "",
        image: turf.gallery?.mainImage || turf.media?.[0]?.url || "",
        available: 5, // Will need to calculate from bookings
        description: turf.turfDetails?.description || turf.description || "",
        capacity: turf.turfDetails?.capacity,
        sportsAvailable: turf.turfDetails?.sportsAvailable || turf.sportsAvailable || [],
        address: turf.location?.address || turf.address || "",
        weekdayRate: turf.pricing?.weekdayRate ?? turf.price ?? 0,
        weekendRate: turf.pricing?.weekendRate ?? 0,
        amenities: turf.amenities || [],
        thumbnailImages: turf.gallery?.thumbnailImages || [],
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
  const result = await apiRequest("/turfs/approved/list", { query: filters });
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

export const addTurf = async (turfData) => {
  try {
    const token = localStorage.getItem("adminToken");
    const isFormData = typeof FormData !== "undefined" && turfData instanceof FormData;
    const response = await fetch(ADMIN_TURF_BASE_URL, {
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
      },
      body: isFormData ? turfData : JSON.stringify(turfData),
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
    const isFormData = typeof FormData !== "undefined" && turfData instanceof FormData;
    const response = await fetch(`${ADMIN_TURF_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "Authorization": `Bearer ${token}`,
      },
      body: isFormData ? turfData : JSON.stringify(turfData),
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
      method: "POST",
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

export const rejectTurf = async (id) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_TURF_BASE_URL}/${id}/reject`, {
      method: "POST",
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

export const createBusinessTurf = async (turfData, images = {}) => {
  try {
    const token = localStorage.getItem("businessToken");
    const thumbnailImages = images.thumbnailImages || [];
    let gallery = turfData.gallery || {};

    if (images.mainImage || thumbnailImages.length) {
      if (!images.mainImage) {
        return { success: false, message: "A main turf image is required." };
      }
      if (thumbnailImages.length + 1 > 10) {
        return { success: false, message: "Upload no more than 10 images in total." };
      }

      const imageForm = new FormData();
      imageForm.append("mainImage", images.mainImage);
      thumbnailImages.forEach((image) => imageForm.append("thumbnailImages", image));

      const uploadResponse = await fetch(buildApiUrl("/business/turfs/upload"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: imageForm,
      });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok) {
        return {
          success: false,
          message: uploadData.message || uploadData.error || "Unable to upload turf images.",
          data: uploadData,
        };
      }

      gallery = uploadData.data?.gallery || uploadData.gallery;
      if (!gallery?.mainImage) {
        return { success: false, message: "Image upload succeeded but the server did not return a main image URL.", data: uploadData };
      }
    }

    const response = await fetch(buildApiUrl("/business/turfs"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...turfData, gallery }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message || data.error || "Unable to create turf." , data };
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
