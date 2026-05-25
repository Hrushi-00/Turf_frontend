"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getCurrentBusiness, isBusinessLoggedIn, logout } from "@/src/services/authService";
import {
  createBusinessTurf,
  deleteBusinessTurf,
  getBusinessTurfs,
  updateBusinessTurf,
} from "@/src/services/turfService";
import {
  getBusinessBookingStats,
  getBusinessBookings,
  updateBusinessBookingStatus,
} from "@/src/services/bookingService";

type BusinessTurf = {
  id: string;
  name: string;
  city: string;
  price: number;
  weekendPrice: number;
  approved: boolean;
  sport: string;
};

type BusinessBooking = {
  id: string;
  turfName: string;
  userName: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  price: number;
};

type BusinessStats = {
  totalBookings?: number;
  totalRevenue?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
};

const toBusinessTurfs = (items: unknown[]): BusinessTurf[] =>
  items.map((item) => {
    const turf = item as {
      _id?: string;
      id?: string;
      turfDetails?: { turfName?: string; sportsAvailable?: string[] };
      location?: { city?: string };
      pricing?: { weekdayRate?: number; weekendRate?: number };
      metaInfo?: { isApproved?: boolean };
      isApproved?: boolean;
    };

    return {
      id: turf._id || turf.id || "",
      name: turf.turfDetails?.turfName || "Unnamed Turf",
      city: turf.location?.city || "Unknown City",
      price: turf.pricing?.weekdayRate || 0,
      weekendPrice: turf.pricing?.weekendRate || 0,
      approved: turf.metaInfo?.isApproved ?? turf.isApproved ?? false,
      sport: turf.turfDetails?.sportsAvailable?.[0] || "Sports",
    };
  });

const toBusinessBookings = (items: unknown[]): BusinessBooking[] =>
  items.map((item) => {
    const booking = item as {
      _id?: string;
      id?: string;
      date?: string;
      timeSlot?: string;
      bookingStatus?: string;
      paymentStatus?: string;
      price?: number;
      user?: { name?: string };
      turf?: { turfDetails?: { turfName?: string } };
    };

    return {
      id: booking._id || booking.id || "",
      turfName: booking.turf?.turfDetails?.turfName || "Unknown Turf",
      userName: booking.user?.name || "Unknown User",
      date: booking.date ? new Date(booking.date).toLocaleDateString() : "N/A",
      time: booking.timeSlot || "N/A",
      status: booking.bookingStatus || "pending",
      paymentStatus: booking.paymentStatus || "pending",
      price: booking.price || 0,
    };
  });

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [business] = useState<{ username?: string; email?: string; contactNumber?: string } | null>(() =>
    typeof window === "undefined" ? null : getCurrentBusiness(),
  );
  const [turfs, setTurfs] = useState<BusinessTurf[]>([]);
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [stats, setStats] = useState<BusinessStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    turfName: "",
    description: "",
    sportsAvailable: "football",
    city: "",
    address: "",
    landmark: "",
    state: "",
    zipCode: "",
    contactNumber: "",
    weekdayRate: "",
    weekendRate: "",
    openingTime: "06:00",
    closingTime: "23:00",
    mainImage: "",
    thumbnailImages: "",
    amenities: "parking, lights",
  });

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const [turfsResult, bookingsResult, statsResult] = await Promise.all([
      getBusinessTurfs(),
      getBusinessBookings(),
      getBusinessBookingStats(),
    ]);

    if (turfsResult.success) {
      setTurfs(toBusinessTurfs(turfsResult.data as unknown[]));
    }

    if (bookingsResult.success) {
      const rawBookings = Array.isArray(bookingsResult.data)
        ? bookingsResult.data
        : (bookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).data ||
          (bookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).bookings ||
          [];
      setBookings(toBusinessBookings(rawBookings));
    }

    if (statsResult.success && statsResult.data && typeof statsResult.data === "object") {
      setStats(statsResult.data as BusinessStats);
    }

    if (!turfsResult.success || !bookingsResult.success || !statsResult.success) {
      setError(turfsResult.message || bookingsResult.message || statsResult.message || "Failed to load business data");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!isBusinessLoggedIn()) {
      router.push("/business/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [router]);

  const handleCreateTurf = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingId("create");
    const payload = {
      ownerDetails: {
        name: business?.username || "Business Owner",
        contactNumber: form.contactNumber || business?.contactNumber || "",
        email: business?.email || "",
      },
      turfDetails: {
        turfName: form.turfName,
        description: form.description,
        sportsAvailable: form.sportsAvailable
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        surfaceType: "synthetic",
        dimensions: {
          length: 90,
          width: 50,
          unit: "meters",
        },
        capacity: 20,
      },
      location: {
        address: form.address,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        googleMapLink: "",
      },
      pricing: {
        weekdayRate: Number(form.weekdayRate),
        weekendRate: Number(form.weekendRate),
        currency: "INR",
        minimumBookingHours: 1,
      },
      availability: {
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        closedDays: [],
        customUnavailableDates: [],
      },
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      gallery: {
        mainImage: form.mainImage,
        thumbnailImages: form.thumbnailImages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
    };

    const result = await createBusinessTurf(payload);
    if (result.success) {
      setForm({
        turfName: "",
        description: "",
        sportsAvailable: "football",
        city: "",
        address: "",
        landmark: "",
        state: "",
        zipCode: "",
        contactNumber: "",
        weekdayRate: "",
        weekendRate: "",
        openingTime: "06:00",
        closingTime: "23:00",
        mainImage: "",
        thumbnailImages: "",
        amenities: "parking, lights",
      });
      await loadDashboard();
    } else {
      setError(result.message || "Unable to create turf");
    }
    setSavingId(null);
  };

  const handleEditTurf = async (turf: BusinessTurf) => {
    const nextName = window.prompt("New turf name", turf.name);
    if (!nextName) {
      return;
    }
    const nextRate = window.prompt("New weekday rate", String(turf.price));
    if (!nextRate) {
      return;
    }

    setSavingId(turf.id);
    const result = await updateBusinessTurf(turf.id, {
      turfDetails: {
        turfName: nextName,
      },
      pricing: {
        weekdayRate: Number(nextRate),
      },
    });

    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to update turf");
    }
    setSavingId(null);
  };

  const handleDeleteTurf = async (turfId: string) => {
    const confirmed = window.confirm("Delete this turf?");
    if (!confirmed) {
      return;
    }

    setSavingId(turfId);
    const result = await deleteBusinessTurf(turfId);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to delete turf");
    }
    setSavingId(null);
  };

  const handleBookingUpdate = async (bookingId: string) => {
    const nextStatus = statusDrafts[bookingId];
    if (!nextStatus) {
      return;
    }

    setSavingId(bookingId);
    const result = await updateBusinessBookingStatus(bookingId, {
      bookingStatus: nextStatus,
      paymentStatus: nextStatus === "confirmed" ? "paid" : undefined,
    });

    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to update booking");
    }
    setSavingId(null);
  };

  const totalRevenue = stats.totalRevenue ?? bookings.reduce((sum, booking) => sum + booking.price, 0);

  return (
    <div className="min-h-screen bg-black text-white pt-28 px-6 pb-20 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_25%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Business Dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Manage your venues and bookings</h1>
            <p className="mt-2 text-sm text-white/60">
              {business?.username || business?.email || "Business owner"} is signed in.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white">
              Home
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/business/login");
              }}
              className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "My turfs", value: turfs.length },
            { label: "Unapproved", value: turfs.filter((turf) => !turf.approved).length },
            { label: "Bookings", value: bookings.length },
            { label: "Revenue", value: `Rs ${totalRevenue.toLocaleString()}` },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="mt-2 text-3xl font-black">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Create turf</p>
            <h2 className="mt-2 text-2xl font-black">Add a new business turf</h2>
          </div>
          <form onSubmit={handleCreateTurf} className="grid gap-4 lg:grid-cols-2">
            {[
              { label: "Turf name", key: "turfName" },
              { label: "City", key: "city" },
              { label: "Address", key: "address" },
              { label: "Landmark", key: "landmark" },
              { label: "State", key: "state" },
              { label: "Zip code", key: "zipCode" },
              { label: "Contact number", key: "contactNumber" },
              { label: "Sports available", key: "sportsAvailable" },
              { label: "Weekday rate", key: "weekdayRate" },
              { label: "Weekend rate", key: "weekendRate" },
              { label: "Opening time", key: "openingTime" },
              { label: "Closing time", key: "closingTime" },
              { label: "Main image URL", key: "mainImage" },
              { label: "Thumbnail URLs", key: "thumbnailImages" },
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-sm font-semibold text-white/80">{field.label}</span>
                <input
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  placeholder={field.label}
                />
              </label>
            ))}
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-white/80">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-32 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="Describe your turf"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-white/80">Amenities</span>
              <input
                value={form.amenities}
                onChange={(e) => setForm((prev) => ({ ...prev, amenities: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="parking, lights, washroom"
              />
            </label>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={savingId === "create"}
                className="rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {savingId === "create" ? "Creating..." : "CREATE TURF"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">My turfs</p>
            <h2 className="mt-2 text-2xl font-black">Your venue inventory</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {loading ? (
              <p className="text-white/60">Loading turfs...</p>
            ) : turfs.length === 0 ? (
              <p className="text-white/60">No turfs added yet.</p>
            ) : (
              turfs.map((turf) => (
                <div key={turf.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{turf.name}</h3>
                      <p className="mt-1 text-sm text-white/60">
                        {turf.city} - {turf.sport}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${turf.approved ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>
                      {turf.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
                    <div>Weekday: Rs {turf.price}</div>
                    <div>Weekend: Rs {turf.weekendPrice}</div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleEditTurf(turf)}
                      disabled={savingId === turf.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90 disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTurf(turf.id)}
                      disabled={savingId === turf.id}
                      className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Bookings</p>
            <h2 className="mt-2 text-2xl font-black">Manage owner bookings</h2>
          </div>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.9fr_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black">{booking.turfName}</h3>
                    <p className="mt-1 text-sm text-white/60">{booking.userName}</p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>{booking.date}</p>
                    <p>{booking.time}</p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>Status: {booking.status}</p>
                    <p>Payment: {booking.paymentStatus}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={statusDrafts[booking.id] || booking.status}
                      onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button
                      onClick={() => handleBookingUpdate(booking.id)}
                      disabled={savingId === booking.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && bookings.length === 0 && (
              <p className="text-white/60">No bookings found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
