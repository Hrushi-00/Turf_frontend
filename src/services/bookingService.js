// Booking API Service
const API_BASE_URL = "http://localhost:8000/api/bookings";

// User booking endpoints
export const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/bookturf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
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

export const getUserBookings = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/userbookings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      // Transform backend data to match frontend
      const bookings = Array.isArray(data) ? data : data.data || data.bookings || [];
      const transformed = bookings.map((booking) => ({
        id: booking._id,
        turf: booking.turf?.turfDetails?.turfName || "Unknown Turf",
        sport: booking.turf?.turfDetails?.sportsAvailable?.[0] || "Sports",
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.timeSlot,
        status: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        price: booking.price || 0,
        paymentMethod: booking.paymentMethod,
      }));
      return { success: true, data: transformed };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Admin booking endpoints
export const getAdminBookings = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/admin/turfbookings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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

export const getBookingStats = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/bookings/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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

// Super admin booking endpoints
export const getAllBookings = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingStatus: status }),
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

export const cancelBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingStatus: "cancelled" }),
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
