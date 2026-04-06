// Turf API Service
const API_BASE_URL = "http://localhost:8000/api/turfs";

export const getTurfById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
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
    const response = await fetch(`${API_BASE_URL}/approved/list`);
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
  try {
    const queryParams = new URLSearchParams();

    if (filters.city) queryParams.append("city", filters.city);
    if (filters.sport) queryParams.append("sport", filters.sport);
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);

    const url = `${API_BASE_URL}/approved/list?${queryParams.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      const turfs = Array.isArray(data) ? data : data.data || [];
      const transformed = turfs.map((turf) => ({
        id: turf._id,
        name: turf.turfDetails.turfName,
        sport: turf.turfDetails.sportsAvailable?.[0] || "Sports",
        location: turf.location.city,
        price: turf.pricing.weekdayRate,
        rating: 4.5,
        slots: `${turf.availability.openingTime}-${turf.availability.closingTime}`,
        image: turf.gallery.mainImage,
        available: 5,
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

export const addTurf = async (turfData) => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(API_BASE_URL, {
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
    const response = await fetch(`${API_BASE_URL}/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/${id}/approve`, {
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
    const response = await fetch(`${API_BASE_URL}/${id}/reject`, {
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
