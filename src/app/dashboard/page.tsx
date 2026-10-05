"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { getCurrentUser, updateUserProfile } from "@/src/services/authService";
import { cancelBooking, getUserBookings } from "@/src/services/bookingService";

const formatAddress = (address: unknown) => {
  if (typeof address === "string") return address;
  if (!address || typeof address !== "object" || Array.isArray(address)) return "N/A";

  const fields = address as Record<string, unknown>;
  return [fields.street, fields.city, fields.state, fields.zipCode, fields.country]
    .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
    .map(String)
    .filter(Boolean)
    .join(", ") || "N/A";
};

type DashboardUser = {
  name?: string;
  email?: string;
  contactNumber?: string;
  address?: unknown;
};

type DashboardBooking = {
  id: string;
  turf: string;
  sport: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  price: number;
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", contactNumber: "" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash === "#profile-edit") setEditOpen(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        window.location.href = "/auth/login";
        return;
      }
      setUser(currentUser);
      setProfileForm({ name: currentUser.name || "", contactNumber: currentUser.contactNumber || "" });

      const result = await getUserBookings();
      if (result.success) {
        setBookings(result.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    const result = await updateUserProfile(profileForm);
    if (result.success) {
      setUser(getCurrentUser());
      setProfileMessage("Profile updated successfully.");
      setEditOpen(false);
    } else {
      setProfileMessage(result.message || "Could not update profile.");
    }
    setSavingProfile(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(bookingId);
    const result = await cancelBooking(bookingId);
    if (result.success) {
      await fetchUserData();
      setActiveTab("cancelled");
    }
    else setError(result.message || "Could not cancel the booking.");
    setCancellingId(null);
  };

  const completedBookings = bookings.filter((booking) => booking.status === "completed");
  const cancelledBookings = bookings.filter((booking) => ["cancelled", "canceled"].includes(booking.status));
  const upcomingBookings = bookings.filter((booking) => ["pending", "confirmed"].includes(booking.status));
  const visibleBookings = activeTab === "upcoming" ? upcomingBookings : activeTab === "completed" ? completedBookings : cancelledBookings;

  return (
    <div className="min-h-screen overflow-x-clip bg-black px-4 pb-16 pt-24 text-white sm:px-6 sm:pb-20 lg:px-16">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');

        .glass{
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.08);
        }

        .cta-primary{
          background: #ffffff;
          color: #0B0B0B;
          transition:all .3s;
          box-shadow: 0 4px 12px rgba(255,255,255,.15);
        }
        .cta-primary:hover{
          background: #f0f0f0;
          box-shadow: 0 8px 20px rgba(255,255,255,.2);
          transform: translateY(-2px);
        }

        .tab-btn{
          transition: all .3s;
          border-b-2 border-transparent;
        }
        .tab-btn.active{
          border-b-color: #ffffff;
          color: #ffffff;
        }

        .booking-card{
          transition: all .3s;
        }
        .booking-card:hover{
          transform: translateY(-4px);
          border-color: rgba(255,255,255,.3);
        }
      `}</style>

      <div className="absolute inset-0 bg-linear-to-br from-slate-900/10 via-black to-black pointer-events-none"/>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 blur-3xl pointer-events-none"/>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="mb-2 text-4xl tracking-wide sm:text-5xl md:text-6xl">Your Dashboard</h1>
              {user && <p className="text-gray-400">Welcome back, <span className="text-white font-bold">{user.name || user.email}</span></p>}
            </div>
            <Link href="/dashboard/booking/turfs" className="cta-primary inline-flex min-h-12 w-full items-center justify-center rounded-lg px-6 py-3 font-black text-black sm:w-fit sm:px-8 sm:py-4">
              BOOK A TURF
            </Link>
          </div>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="glass mb-8 min-w-0 rounded-xl border border-gray-700 p-4 sm:mb-12 sm:p-6 md:p-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="mb-4 text-2xl font-black">Profile Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Full Name</p>
                    <p className="font-bold text-lg">{user.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="break-all text-base font-bold sm:text-lg">{user.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Contact Number</p>
                    <p className="font-bold text-lg">{user.contactNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="font-bold text-lg">{formatAddress(user.address)}</p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setEditOpen((open) => !open)} className="min-h-11 w-full shrink-0 rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-bold transition-all hover:border-white sm:w-auto sm:px-6 sm:py-3 sm:text-base">
                Edit Profile
              </button>
            </div>
            {editOpen && (
              <form id="profile-edit" onSubmit={saveProfile} className="mt-8 grid gap-4 border-t border-gray-700 pt-6 sm:grid-cols-2">
                <label className="text-sm text-gray-400">Full name
                  <input required value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-white" />
                </label>
                <label className="text-sm text-gray-400">Contact number
                  <input value={profileForm.contactNumber} onChange={(event) => setProfileForm({ ...profileForm, contactNumber: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-white" />
                </label>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <button disabled={savingProfile} className="rounded-lg bg-white px-5 py-3 font-bold text-black disabled:opacity-50">{savingProfile ? "Saving…" : "Save changes"}</button>
                  <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-gray-600 px-5 py-3 font-bold hover:border-white">Cancel</button>
                  {profileMessage && <span role="status" className="text-sm text-gray-300">{profileMessage}</span>}
                </div>
              </form>
            )}
            {!editOpen && profileMessage && <p role="status" className="mt-4 text-sm text-green-300">{profileMessage}</p>}
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:gap-4 md:grid-cols-4">
          {[
            { label: "Upcoming", value: upcomingBookings.length.toString() },
            { label: "Total Booked", value: bookings.length.toString() },
            { label: "Spent", value: `₹${bookings.reduce((sum, b) => sum + (b.price || 0), 0)}` },
            { label: "Rating", value: "4.8" },
          ].map(s => (
            <div key={s.label} className="glass min-w-0 rounded-lg p-4 sm:p-6">
              <p className="text-gray-400 text-sm mb-2">{s.label}</p>
              <div className="flex items-center gap-3">
                <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-3xl font-black">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bookings Section */}
        <div className="glass min-w-0 rounded-xl p-4 sm:p-6 md:p-8">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-3 gap-1 border-b border-gray-700 pb-3 sm:mb-8 sm:gap-6 sm:pb-4">
            {[
              { key: "upcoming", label: "Upcoming Bookings", shortLabel: "Upcoming" },
              { key: "completed", label: "Completed Bookings", shortLabel: "Completed" },
              { key: "cancelled", label: "Cancelled Bookings", shortLabel: "Cancelled" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn min-w-0 whitespace-nowrap px-1 pb-2 text-center text-[11px] font-bold transition-all border-b-2 sm:px-2 sm:text-base md:text-lg ${
                  activeTab === tab.key
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <><span className="sm:hidden">{tab.shortLabel}</span><span className="hidden sm:inline">{tab.label}</span></>
              </button>
            ))}
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading bookings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">{error}</p>
              </div>
            ) : visibleBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No {activeTab} bookings yet</p>
                {activeTab === "upcoming" && <Link href="/dashboard/booking/turfs" className="cta-primary mt-6 inline-block rounded-lg px-8 py-3 font-black text-black">BOOK NOW</Link>}
              </div>
            ) : (
              visibleBookings.map(booking => (
                <div key={booking.id} className="booking-card glass min-w-0 rounded-lg p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="mb-2 wrap-break-word text-xl font-black">{booking.turf}</h3>
                      <p className="mb-3 wrap-break-word text-sm text-gray-400">
                        <span className="text-white font-bold">{booking.sport}</span> · {booking.date} · {booking.time}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold capitalize ${
                          booking.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                          booking.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {booking.status}
                        </span>
                        <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold capitalize ${
                          booking.paymentStatus === "paid" ? "bg-green-500/20 text-green-400" :
                          booking.paymentStatus === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="w-full min-w-0 text-left sm:w-auto sm:text-right">
                      <p className="text-2xl font-black text-white mb-3">₹{booking.price}</p>
                      <div className="flex flex-col gap-2 min-[420px]:flex-row sm:justify-end">
                        <Link href={`/dashboard/bookings/${encodeURIComponent(booking.id)}`} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-gray-600 px-4 py-2 text-sm font-bold transition-all hover:border-white min-[420px]:w-auto">
                          View Details
                        </Link>
                        {["pending", "confirmed"].includes(booking.status) && (
                          <button disabled={cancellingId === booking.id} onClick={() => void handleCancelBooking(booking.id)} className="min-h-10 w-full rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50 min-[420px]:w-auto">
                            {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
