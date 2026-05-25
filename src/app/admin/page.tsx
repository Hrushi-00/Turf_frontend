"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  approveTurf,
  getAllAdminTurfs,
  rejectTurf,
} from "@/src/services/turfService";
import {
  getAdminBookings,
  getAllBookings,
  getBookingStats,
  updateBookingStatus,
} from "@/src/services/bookingService";
import { getCurrentAdmin, isAdminLoggedIn, logout } from "@/src/services/authService";

type TurfRecord = {
  id: string;
  name: string;
  city: string;
  price: number;
  approved: boolean;
  featured: boolean;
  trending: boolean;
  sport: string;
};

type BookingRecord = {
  id: string;
  turfName: string;
  sport: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  price: number;
  userName: string;
};

type BookingStats = {
  totalBookings?: number;
  totalRevenue?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
  cancelledBookings?: number;
};

const toTurfRecords = (items: unknown[]): TurfRecord[] =>
  items.map((item) => {
    const turf = item as {
      _id?: string;
      id?: string;
      turfDetails?: { turfName?: string; sportsAvailable?: string[] };
      location?: { city?: string };
      pricing?: { weekdayRate?: number };
      isApproved?: boolean;
      isFeatured?: boolean;
      isTrending?: boolean;
      metaInfo?: { isApproved?: boolean; isFeatured?: boolean; isTrending?: boolean };
    };

    return {
      id: turf._id || turf.id || "",
      name: turf.turfDetails?.turfName || "Unnamed Turf",
      city: turf.location?.city || "Unknown City",
      price: turf.pricing?.weekdayRate || 0,
      approved: turf.metaInfo?.isApproved ?? turf.isApproved ?? false,
      featured: turf.metaInfo?.isFeatured ?? turf.isFeatured ?? false,
      trending: turf.metaInfo?.isTrending ?? turf.isTrending ?? false,
      sport: turf.turfDetails?.sportsAvailable?.[0] || "Sports",
    };
  });

const toBookingRecords = (items: unknown[]): BookingRecord[] =>
  items.map((item) => {
    const booking = item as {
      _id?: string;
      id?: string;
      date?: string;
      timeSlot?: string;
      bookingStatus?: string;
      paymentStatus?: string;
      price?: number;
      user?: { name?: string; email?: string };
      turf?: { turfDetails?: { turfName?: string; sportsAvailable?: string[] } };
    };

    return {
      id: booking._id || booking.id || "",
      turfName: booking.turf?.turfDetails?.turfName || "Unknown Turf",
      sport: booking.turf?.turfDetails?.sportsAvailable?.[0] || "Sports",
      date: booking.date ? new Date(booking.date).toLocaleDateString() : "N/A",
      time: booking.timeSlot || "N/A",
      status: booking.bookingStatus || "pending",
      paymentStatus: booking.paymentStatus || "pending",
      price: booking.price || 0,
      userName: booking.user?.name || "Unknown User",
    };
  });

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin] = useState<{ username?: string; email?: string } | null>(() =>
    typeof window === "undefined" ? null : getCurrentAdmin(),
  );
  const [turfs, setTurfs] = useState<TurfRecord[]>([]);
  const [adminBookings, setAdminBookings] = useState<BookingRecord[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const [turfsResult, bookingsResult, allBookingsResult, statsResult] = await Promise.all([
      getAllAdminTurfs(),
      getAdminBookings(),
      getAllBookings(),
      getBookingStats(),
    ]);

    if (turfsResult.success) {
      setTurfs(toTurfRecords(turfsResult.data as unknown[]));
    }

    if (bookingsResult.success) {
      const rawBookings = Array.isArray(bookingsResult.data)
        ? bookingsResult.data
        : (bookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).data ||
          (bookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).bookings ||
          [];
      setAdminBookings(toBookingRecords(rawBookings));
    }

    if (allBookingsResult.success) {
      const rawBookings = Array.isArray(allBookingsResult.data)
        ? allBookingsResult.data
        : (allBookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).data ||
          (allBookingsResult.data as { data?: unknown[]; bookings?: unknown[] }).bookings ||
          [];
      setAllBookings(toBookingRecords(rawBookings));
    }

    if (statsResult.success && statsResult.data && typeof statsResult.data === "object") {
      setBookingStats(statsResult.data as BookingStats);
    }

    if (!turfsResult.success || !bookingsResult.success || !allBookingsResult.success || !statsResult.success) {
      setError(
        turfsResult.message ||
          bookingsResult.message ||
          allBookingsResult.message ||
          statsResult.message ||
          "Failed to load admin data",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.push("/admin/login");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [router]);

  const handleApprove = async (turfId: string) => {
    setActionId(turfId);
    const result = await approveTurf(turfId);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to approve turf");
    }
    setActionId(null);
  };

  const handleReject = async (turfId: string) => {
    const reason = window.prompt("Reason for rejection");
    if (!reason) {
      return;
    }

    setActionId(turfId);
    const result = await rejectTurf(turfId, reason);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to reject turf");
    }
    setActionId(null);
  };

  const handleBookingUpdate = async (bookingId: string) => {
    const nextStatus = statusDrafts[bookingId];
    if (!nextStatus) {
      return;
    }

    setActionId(bookingId);
    const result = await updateBookingStatus(bookingId, nextStatus);
    if (result.success) {
      await loadDashboard();
    } else {
      setError(result.message || "Unable to update booking");
    }
    setActionId(null);
  };

  const totalRevenue = bookingStats.totalRevenue ?? allBookings.reduce((sum, booking) => sum + booking.price, 0);
  const pendingTurfs = turfs.filter((turf) => !turf.approved);
  const pendingBookings = allBookings.filter((booking) => booking.status === "pending").length;

  return (
    <div className="min-h-screen bg-black text-white pt-28 px-6 pb-20 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_25%)]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Admin Dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Manage turfs and bookings</h1>
            <p className="mt-2 text-sm text-white/60">
              {admin?.username || admin?.email || "Admin"} is signed in.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white">
              Home
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
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
            { label: "Turfs", value: turfs.length },
            { label: "Pending approvals", value: pendingTurfs.length },
            { label: "Pending bookings", value: pendingBookings },
            { label: "Revenue", value: `Rs ${totalRevenue.toLocaleString()}` },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="mt-2 text-3xl font-black">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Approval queue</p>
              <h2 className="mt-2 text-2xl font-black">Turfs waiting for review</h2>
            </div>
          </div>
          {loading ? (
            <p className="text-white/60">Loading turfs...</p>
          ) : pendingTurfs.length === 0 ? (
            <p className="text-white/60">No turfs waiting for approval.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pendingTurfs.map((turf) => (
                <div key={turf.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{turf.name}</h3>
                      <p className="mt-1 text-sm text-white/60">
                        {turf.city} - {turf.sport}
                      </p>
                    </div>
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Pending
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                    <span>Price: Rs {turf.price}</span>
                    <span>{turf.featured ? "Featured" : "Not featured"}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprove(turf.id)}
                      disabled={actionId === turf.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(turf.id)}
                      disabled={actionId === turf.id}
                      className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Admin bookings</p>
              <h2 className="mt-2 text-2xl font-black">Bookings assigned to admin</h2>
            </div>
            <p className="text-sm text-white/60">{adminBookings.length} records</p>
          </div>
          <div className="space-y-4">
            {adminBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black">{booking.turfName}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {booking.userName} - {booking.sport}
                    </p>
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
                      disabled={actionId === booking.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && adminBookings.length === 0 && (
              <p className="text-white/60">No admin bookings found.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">All bookings</p>
              <h2 className="mt-2 text-2xl font-black">Super-admin booking list</h2>
            </div>
            <p className="text-sm text-white/60">{allBookings.length} records</p>
          </div>
          <div className="space-y-4">
            {allBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto] lg:items-center">
                  <div>
                    <h3 className="text-lg font-black">{booking.turfName}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      {booking.userName} - {booking.sport}
                    </p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>{booking.date}</p>
                    <p>{booking.time}</p>
                  </div>
                  <div className="text-sm text-white/70">
                    <p>Status: {booking.status}</p>
                    <p>Price: Rs {booking.price}</p>
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
                      disabled={actionId === booking.id}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && allBookings.length === 0 && (
              <p className="text-white/60">No bookings found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
