"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cancelBooking, getUserBookings } from "@/src/services/bookingService";

type Booking = {
  _id?: string;
  id?: string;
  bookingNumber?: string;
  date?: string;
  timeSlot?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  price?: number;
  currency?: string;
  createdAt?: string;
  turf?: {
    _id?: string;
    turfDetails?: { turfName?: string; sportsAvailable?: string[] };
    location?: { address?: string; landmark?: string; city?: string; state?: string; zipCode?: string };
    pricing?: { currency?: string };
  };
  facility?: { name?: string; sportSlugs?: string[]; venue?: { name?: string; address?: string; city?: string } };
};

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getUserBookings().then((result) => {
      if (!active) return;
      if (result.success) {
        const selected = result.data.find((entry: any) => String(entry.id) === String(bookingId));
        if (selected) setBooking(selected.raw || selected);
        else setError("This booking was not found in your account.");
      }
      else setError(result.message || "Could not load this booking.");
    }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Could not load this booking.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId]);

  const venueName = booking?.turf?.turfDetails?.turfName || booking?.facility?.name || booking?.facility?.venue?.name || "Sports venue";
  const sport = booking?.turf?.turfDetails?.sportsAvailable?.join(", ") || booking?.facility?.sportSlugs?.join(", ") || "Sports";
  const venueLocation = booking?.turf?.location;
  const address = [venueLocation?.address, venueLocation?.landmark, venueLocation?.city, venueLocation?.state, venueLocation?.zipCode]
    .filter(Boolean).join(", ") || [booking?.facility?.venue?.address, booking?.facility?.venue?.city].filter(Boolean).join(", ");
  const status = String(booking?.bookingStatus || "pending").toUpperCase();
  const paymentStatus = String(booking?.paymentStatus || "pending").toUpperCase();

  async function handleCancel() {
    if (!booking?._id && !booking?.id) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    const result = await cancelBooking(booking._id || booking.id);
    if (result.success) {
      setNotice("Booking cancellation requested.");
      const refreshed = await getUserBookings();
      const selected = refreshed.success ? refreshed.data.find((entry: any) => String(entry.id) === String(bookingId)) : null;
      if (selected) setBooking(selected.raw || selected);
    } else setError(result.message || "Could not cancel this booking.");
    setBusy(false);
  }

  return <main className="min-h-screen bg-[#090b0a] px-5 pb-20 pt-28 text-white md:px-10">
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="text-sm text-lime-300 hover:text-lime-200">&larr; Back to dashboard</Link>
      <header className="mb-8 mt-5"><p className="text-xs font-bold uppercase tracking-[.25em] text-lime-300">Booking details</p><h1 className="mt-2 text-4xl font-black md:text-5xl">{venueName}</h1><p className="mt-2 text-zinc-400">Booking reference: {booking?.bookingNumber || booking?._id || bookingId}</p></header>
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">{error}</div>}
      {notice && <div role="status" className="mb-5 rounded-xl border border-lime-900 bg-lime-950/40 p-4 text-lime-200">{notice}</div>}
      {loading ? <p className="py-20 text-center text-zinc-400">Loading this booking...</p>
        : !booking ? <p className="rounded-xl border border-white/10 p-6 text-zinc-300">Booking not found.</p>
          : <>
            <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-sm text-zinc-400">Venue</p><h2 className="mt-1 text-2xl font-bold">{venueName}</h2><p className="mt-1 text-sm capitalize text-zinc-400">{sport}</p></div>
                <div className="flex gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold capitalize text-zinc-200">{status.toLowerCase()}</span><span className="rounded-full bg-lime-300/10 px-3 py-1.5 text-xs font-bold capitalize text-lime-200">Payment: {paymentStatus.toLowerCase()}</span></div>
              </div>
              <dl className="mt-7 grid gap-x-8 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-2">
                <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Date</dt><dd className="mt-1 font-semibold">{booking.date ? new Date(booking.date).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "UTC" }) : "Not provided"}</dd></div>
                <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Time</dt><dd className="mt-1 font-semibold">{booking.timeSlot || "Not provided"}</dd></div>
                <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Amount</dt><dd className="mt-1 text-xl font-black">{booking.currency || booking.turf?.pricing?.currency || "INR"} {booking.price ?? "—"}</dd></div>
                <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Payment method</dt><dd className="mt-1 font-semibold capitalize">{booking.paymentMethod || "Not provided"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wider text-zinc-500">Venue address</dt><dd className="mt-1 font-semibold text-zinc-200">{address || "Address not provided"}</dd></div>
                {booking.createdAt && <div><dt className="text-xs uppercase tracking-wider text-zinc-500">Booked on</dt><dd className="mt-1 font-semibold">{new Date(booking.createdAt).toLocaleString("en-IN")}</dd></div>}
              </dl>
            </section>
            {booking.turf && <Link href={`/dashboard/booking/turfs/${encodeURIComponent(String(booking.turf._id || ""))}`} className="mt-5 inline-flex rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-lime-200 hover:border-lime-300">View turf photos & details</Link>}
            {["PENDING", "CONFIRMED"].includes(status) && <div className="mt-6 flex justify-end"><button onClick={() => void handleCancel()} disabled={busy} className="rounded-lg bg-red-500/15 px-5 py-3 text-sm font-bold text-red-300 hover:bg-red-500/25 disabled:opacity-50">{busy ? "Cancelling..." : "Cancel booking"}</button></div>}
          </>}
    </div>
  </main>;
}
