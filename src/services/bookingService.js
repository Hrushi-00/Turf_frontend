// Booking API Service
import { buildApiUrl } from "./apiConfig";

const USER_BOOKING_BASE_URL = buildApiUrl("/user/bookings");
const ADMIN_BOOKING_BASE_URL = buildApiUrl("/admin/bookings");
const BUSINESS_BOOKING_BASE_URL = buildApiUrl("/business/bookings");
const API_BASE_URL = buildApiUrl("/").replace(/\/$/, "");

const readResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  return response.ok
    ? { success: true, data: data.data ?? data }
    : { success: false, message: data.message || "The request could not be completed." };
};

export const getTurfAvailability = async (turfId, date) => {
  try {
    const query = new URLSearchParams({ date });
    const response = await fetch(`${API_BASE_URL}/turfs/${encodeURIComponent(turfId)}/availability?${query}`);
    return readResponse(response);
  } catch (error) {
    return { success: false, message: error.message || "Unable to load availability." };
  }
};

export const createBookingPaymentOrder = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ bookingId }),
    });
    return readResponse(response);
  } catch (error) {
    return { success: false, message: error.message || "Unable to start payment." };
  }
};

export const verifyBookingPayment = async ({ orderId, paymentId, signature }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
    return readResponse(response);
  } catch (error) {
    return { success: false, message: error.message || "Payment verification failed." };
  }
}

// User booking endpoints
export const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(USER_BOOKING_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Idempotency-Key": crypto.randomUUID(),
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
    const response = await fetch(`${USER_BOOKING_BASE_URL}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      // Transform backend data to match frontend
      const payload = data.data ?? data;
      const bookings = Array.isArray(payload) ? payload : payload.bookings || [];
      const transformed = bookings.map((booking) => ({
        id: booking._id || booking.id,
        raw: booking,
        turf: booking.turf?.turfDetails?.turfName || "Unknown Turf",
        sport: booking.turf?.turfDetails?.sportsAvailable?.[0] || "Sports",
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.timeSlot,
        status: (booking.bookingStatus || booking.status || "pending").toLowerCase(),
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
    const response = await fetch(ADMIN_BOOKING_BASE_URL, {
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
    const response = await fetch(`${ADMIN_BOOKING_BASE_URL}/stats`, {
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

export const getBusinessBookings = async () => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(BUSINESS_BOOKING_BASE_URL, {
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

export const getBusinessBookingStats = async () => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(`${BUSINESS_BOOKING_BASE_URL}/stats`, {
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

// Super admin booking endpoints
export const getAllBookings = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_BOOKING_BASE_URL}/all`, {
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
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${ADMIN_BOOKING_BASE_URL}/${bookingId}`, {
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
    const response = await fetch(`${USER_BOOKING_BASE_URL}/${bookingId}/cancel`, {
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

export const updateBusinessBookingStatus = async (bookingId, bookingData) => {
  try {
    const token = localStorage.getItem("businessToken");
    const response = await fetch(`${BUSINESS_BOOKING_BASE_URL}/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
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
