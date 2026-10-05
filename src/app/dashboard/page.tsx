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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
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
    } catch (err: any) {
      setError(err.message);
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
    <div className="min-h-screen bg-black text-white pt-24 px-6 lg:px-16 pb-20 overflow-hidden">
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

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-black to-black pointer-events-none"/>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 blur-3xl pointer-events-none"/>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-5xl md:text-6xl tracking-wide mb-2">Your Dashboard</h1>
              {user && <p className="text-gray-400">Welcome back, <span className="text-white font-bold">{user.name || user.email}</span></p>}
            </div>
            <Link href="/dashboard/booking/turfs" className="cta-primary px-8 py-4 rounded-lg font-black text-black w-fit">
              BOOK A TURF
            </Link>
          </div>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="glass p-8 rounded-xl mb-12 border border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl font-black mb-4">Profile Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Full Name</p>
                    <p className="font-bold text-lg">{user.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="font-bold text-lg">{user.email || "N/A"}</p>
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
              <button type="button" onClick={() => setEditOpen((open) => !open)} className="px-6 py-3 border border-gray-600 rounded-lg font-bold hover:border-white transition-all">
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
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Upcoming", value: upcomingBookings.length.toString() },
            { label: "Total Booked", value: bookings.length.toString() },
            { label: "Spent", value: `₹${bookings.reduce((sum, b) => sum + (b.price || 0), 0)}` },
            { label: "Rating", value: "4.8" },
          ].map(s => (
            <div key={s.label} className="glass p-6 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">{s.label}</p>
              <div className="flex items-center gap-3">
                <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-3xl font-black">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bookings Section */}
        <div className="glass p-8 rounded-xl">
          {/* Tabs */}
          <div className="flex gap-8 mb-8 border-b border-gray-700 pb-4">
            {[
              { key: "upcoming", label: "Upcoming Bookings" },
              { key: "completed", label: "Completed Bookings" },
              { key: "cancelled", label: "Cancelled Bookings" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn font-bold text-lg transition-all pb-2 border-b-2 ${
                  activeTab === tab.key
                    ? "border-white text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
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
                <div key={booking.id} className="booking-card glass p-6 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-xl font-black mb-2">{booking.turf}</h3>
                      <p className="text-gray-400 text-sm mb-3">
                        <span className="text-white font-bold">{booking.sport}</span> · {booking.date} · {booking.time}
                      </p>
                      <div className="flex gap-2">
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
                    <div className="text-right">
                      <p className="text-2xl font-black text-white mb-3">₹{booking.price}</p>
                      <div className="space-x-2">
                        <Link href={`/dashboard/bookings/${encodeURIComponent(booking.id)}`} className="inline-block px-4 py-2 border border-gray-600 rounded-lg hover:border-white transition-all text-sm font-bold">
                          View Details
                        </Link>
                        {["pending", "confirmed"].includes(booking.status) && (
                          <button disabled={cancellingId === booking.id} onClick={() => void handleCancelBooking(booking.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-bold disabled:opacity-50">
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
