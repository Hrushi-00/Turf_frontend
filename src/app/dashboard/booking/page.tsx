"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getTurfById } from "@/src/services/turfService";
import { createBooking, createBookingPaymentOrder, getTurfAvailability, verifyBookingPayment } from "@/src/services/bookingService";
import { platformApi } from "@/src/services/platformService";

type Turf = {
  _id?: string;
  id?: string;
  turfDetails?: { turfName?: string; sportsAvailable?: string[]; description?: string };
  location?: { city?: string };
  pricing?: { weekdayRate?: number; weekendRate?: number; minimumBookingHours?: number };
  availability?: { openingTime?: string; closingTime?: string; closedDays?: string[]; customUnavailableDates?: (string | Date)[] };
  timezone?: string;
  gallery?: { mainImage?: string; thumbnailImages?: string[] };
  rating?: number | { average?: number; value?: number };
  averageRating?: number;
  reviewCount?: number;
  name?: string;
  sport?: string;
  price?: number;
};

type Slot = string | { timeSlot?: string; startTime?: string; endTime?: string; time?: string; available?: boolean; isAvailable?: boolean };
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const unwrap = (value: any) => value?.data ?? value;

function BookingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const turfId = params.get("turf") || "";
  const [turf, setTurf] = useState<Turf | null>(null);
  const [reviews, setReviews] = useState<{ rating?: number }[]>([]);
  const [date, setDate] = useState(() => localDate(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingTurf, setLoadingTurf] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    if (!turfId) {
      setLoadingTurf(false);
      setError("Choose a venue first to see its real availability.");
      return;
    }
    getTurfById(turfId).then((result) => {
      if (!active) return;
      if (result.success) setTurf(unwrap(result.data));
      else setError(result.message || "Venue details could not be loaded.");
    }).finally(() => { if (active) setLoadingTurf(false); });
    return () => { active = false; };
  }, [turfId]);

  useEffect(() => {
    if (!turfId) return;
    let active = true;
    platformApi.publicReviews({ targetType: "FACILITY", targetId: turfId, page: 1, limit: 100 }).then((result) => {
      if (!active || !result.success) return;
      const payload = result.data as any;
      const list = Array.isArray(payload) ? payload : payload?.reviews || payload?.items || payload?.results || payload?.data || [];
      if (Array.isArray(list)) setReviews(list);
    }).catch(() => {});
    return () => { active = false; };
  }, [turfId]);

  const loadSlots = useCallback(async () => {
    if (!turfId || !date) return;
    setLoadingSlots(true);
    setError("");
    setSelectedSlot("");
    const result = await getTurfAvailability(turfId, date);
    if (result.success) {
      const payload = unwrap(result.data);
      const venue = payload?.turf || payload?.data?.turf || turf;
      const suppliedSlots = Array.isArray(payload) ? payload : [payload?.availableSlots, payload?.slots, payload?.availability?.availableSlots].find(Array.isArray);
      if (suppliedSlots) {
        setSlots(suppliedSlots.filter((slot: Slot) => typeof slot === "string" || slot.available !== false && slot.isAvailable !== false));
      } else {
        // GET /turfs/:id/availability returns the turf schedule and bookedSlots,
        // not a precomputed availableSlots array. Build bookable intervals from
        // operating hours and remove intervals that overlap active bookings.
        const schedule = venue?.availability;
        const opening = schedule?.openingTime;
        const closing = schedule?.closingTime;
        const closedDay = (schedule?.closedDays || []).some((day: string) => day.toLowerCase() === new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase());
        const blockedDate = (schedule?.customUnavailableDates || []).some((value: string | Date) => new Date(value).toISOString().slice(0, 10) === date);
        const bookedSlots = payload?.bookedSlots || payload?.data?.bookedSlots || [];
        const parseMinutes = (value: string) => {
          const [hour, minute] = value.split(":").map(Number);
          return hour * 60 + (minute || 0);
        };
        const durationMinutes = Math.max(1, Number(venue?.pricing?.minimumBookingHours) || 1) * 60;
        const generated: string[] = [];
        if (opening && closing && !closedDay && !blockedDate) {
          const startOfDay = parseMinutes(opening);
          const endOfDay = parseMinutes(closing);
          const todayAtVenue = new Intl.DateTimeFormat("en-CA", { timeZone: venue?.timezone || "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
          const nowParts = new Intl.DateTimeFormat("en-GB", { timeZone: venue?.timezone || "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
          const nowAtVenue = Number(nowParts.find((part) => part.type === "hour")?.value || 0) * 60 + Number(nowParts.find((part) => part.type === "minute")?.value || 0);
          const busyIntervals = bookedSlots.map((booking: { timeSlot?: string }) => {
            const [from, to] = (booking.timeSlot || "").split("-");
            return from && to ? [parseMinutes(from.trim()), parseMinutes(to.trim())] : null;
          }).filter((interval: number[] | null): interval is number[] => interval !== null);
          for (let start = startOfDay; start + durationMinutes <= endOfDay; start += 60) {
            if (date === todayAtVenue && start <= nowAtVenue) continue;
            const end = start + durationMinutes;
            if (busyIntervals.some(([busyFrom, busyTo]: number[]) => start < busyTo && busyFrom < end)) continue;
            const format = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
            generated.push(`${format(start)}-${format(end)}`);
          }
        }
        setSlots(generated);
      }
    } else {
      setSlots([]);
      setError(result.message || "Availability could not be loaded.");
    }
    setLoadingSlots(false);
  }, [date, turfId]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const turfName = turf?.turfDetails?.turfName || turf?.name || "Sports venue";
  const sport = turf?.turfDetails?.sportsAvailable?.[0] || turf?.sport || "Sports";
  const price = turf?.pricing?.weekdayRate ?? turf?.price ?? 0;
  const ratings = reviews.map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating) && rating > 0);
  const storedRating = typeof turf?.rating === "number" ? turf.rating : turf?.rating?.average ?? turf?.rating?.value ?? turf?.averageRating;
  const rating = storedRating || (ratings.length ? ratings.reduce((total, value) => total + value, 0) / ratings.length : null);
  const reviewCount = turf?.reviewCount ?? ratings.length;
  const slotLabel = (slot: Slot) => typeof slot === "string" ? slot : slot.timeSlot || slot.time || [slot.startTime, slot.endTime].filter(Boolean).join("-");

  async function handleBooking() {
    if (!localStorage.getItem("token")) { router.push(`/auth/login?next=${encodeURIComponent(`/dashboard/booking?turf=${turfId}`)}`); return; }
    if (!selectedSlot || !turfId) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    const bookingResult = await createBooking({ turfId, date, timeSlot: selectedSlot, paymentMethod: "online" });
    if (!bookingResult.success) {
      setError(bookingResult.message || "Booking could not be created.");
      setSubmitting(false);
      return;
    }
    const booking = unwrap(bookingResult.data);
    const bookingId = booking?._id || booking?.booking?._id || booking?.id;
    if (!bookingId) {
      setNotice("Booking request was accepted. Check your bookings for its payment status.");
      setSubmitting(false);
      return;
    }
    const orderResult = await createBookingPaymentOrder(bookingId);
    if (!orderResult.success) {
      setError(`${orderResult.message || "Payment could not be started."} Your booking is saved; you can check it in My bookings.`);
      setSubmitting(false);
      return;
    }
    const orderResponse = unwrap(orderResult.data);
    const order = orderResponse?.order || orderResponse?.data || orderResponse;
    const key = order?.key || order?.keyId || order?.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    // The backend returns an internal payment `id` plus Razorpay's
    // `providerOrderId`; Checkout must receive the provider order ID.
    const razorpayOrderId = order?.providerOrderId || order?.razorpayOrderId || order?.id;
    const amountPaise = Number(order?.amountPaise ?? order?.amount);
    if (!key || !razorpayOrderId || !Number.isFinite(amountPaise) || amountPaise <= 0) {
      setNotice("Your booking was created and the payment order is ready. Payment checkout credentials are not configured yet.");
      setSubmitting(false);
      return;
    }
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const checkout = new (window as any).Razorpay({
          key,
          order_id: razorpayOrderId,
          amount: amountPaise,
          currency: order.currency || "INR",
          name: "TurfBook",
          description: `${turfName} · ${date} · ${selectedSlot}`,
          handler: async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verify = await verifyBookingPayment({ orderId: payment.razorpay_order_id, paymentId: payment.razorpay_payment_id, signature: payment.razorpay_signature });
            if (verify.success) router.push("/dashboard?booking=confirmed");
            else { setError(verify.message || "Payment verification failed. Your payment status will update after the server confirms it."); setSubmitting(false); }
          },
          modal: { ondismiss: () => setSubmitting(false) },
        });
        checkout.on("payment.failed", (failure: { error?: { description?: string; reason?: string } }) => {
          setError(failure?.error?.description || failure?.error?.reason || "Razorpay could not complete the payment. Try another payment method.");
          setSubmitting(false);
        });
        checkout.open();
      };
      script.onerror = () => { setError("Payment checkout could not be loaded. Your booking is saved; check My bookings before retrying."); setSubmitting(false); };
      document.body.appendChild(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open payment checkout.");
      setSubmitting(false);
    }
  }

  const nextDays = useMemo(() => Array.from({ length: 10 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return localDate(d); }), []);

  return (
    <main className="min-h-screen bg-[#090b0a] px-5 pb-20 pt-28 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/booking/turfs" className="text-sm text-lime-300 hover:text-lime-200">← Browse venues</Link>
        <div className="mb-9 mt-5"><p className="text-xs font-bold uppercase tracking-[.25em] text-lime-300">Booking · Step 1 of 3</p><h1 className="mt-2 text-4xl font-black md:text-5xl">Choose your slot</h1><p className="mt-2 text-zinc-400">Availability and price come from the venue service.</p></div>
        {error && <div role="alert" className="mb-5 rounded-xl border border-red-900 bg-red-950/50 p-4 text-red-200">{error}</div>}
        {notice && <div role="status" className="mb-5 rounded-xl border border-lime-900 bg-lime-950/50 p-4 text-lime-200">{notice} <Link className="underline" href="/dashboard">Open dashboard</Link></div>}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.035]">
              <div className="grid md:grid-cols-[240px_1fr]">
                {turf?.gallery?.mainImage ? <img src={turf.gallery.mainImage} alt={turfName} className="h-48 w-full object-cover md:h-full md:min-h-48" /> : <div className="h-48 bg-gradient-to-br from-lime-950 to-zinc-900 md:h-full md:min-h-48" />}
                <div className="p-6 md:p-8">
                  <p className="text-sm text-zinc-400">Selected venue</p>
                  <h2 className="mt-1 text-2xl font-bold">{loadingTurf ? "Loading venue…" : turfName}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{sport}{turf?.location?.city ? ` · ${turf.location.city}` : ""}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm"><span className="text-amber-300" aria-label={rating ? `${rating.toFixed(1)} out of 5 stars` : "No rating yet"}>★★★★★</span><strong>{rating ? rating.toFixed(1) : "New"}</strong><span className="text-zinc-500">{reviewCount ? `(${reviewCount} reviews)` : "· No reviews yet"}</span></p>
                  {turf?.turfDetails?.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-300">{turf.turfDetails.description}</p>}
                  <Link href={`/dashboard/booking/turfs/${encodeURIComponent(turfId)}`} className="mt-4 inline-flex text-sm font-semibold text-lime-300 hover:text-lime-200">View photos & full turf details</Link>
                </div>
              </div>
              {turf?.gallery?.thumbnailImages?.length ? <div className="flex gap-3 overflow-x-auto border-t border-white/10 p-3">{turf.gallery.thumbnailImages.slice(0, 5).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${turfName} photo ${index + 2}`} className="h-16 w-24 shrink-0 rounded-lg object-cover" />)}</div> : null}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-6 md:p-8">
              <h2 className="mb-4 text-lg font-bold">1. Select a date</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">{nextDays.map((day) => <button key={day} onClick={() => setDate(day)} className={`min-w-20 rounded-xl border px-3 py-3 text-sm ${date === day ? "border-lime-300 bg-lime-300 text-black" : "border-white/10 bg-black/30 text-zinc-300"}`}><span className="block text-xs">{new Date(`${day}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" })}</span><span className="mt-1 block font-bold">{new Date(`${day}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></button>)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">2. Choose an available time</h2><button onClick={loadSlots} className="text-sm text-lime-300">Refresh</button></div>
              {loadingSlots ? <p className="text-zinc-400">Checking live availability…</p> : slots.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{slots.map((slot, index) => { const label = slotLabel(slot); return <button key={`${label}-${index}`} onClick={() => setSelectedSlot(label)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${selectedSlot === label ? "border-lime-300 bg-lime-300 text-black" : "border-white/10 text-zinc-200 hover:border-lime-300/60"}`}>{label}</button>; })}</div> : <p className="text-zinc-400">No bookable times for this date. The venue may be closed, outside its operating hours, fully booked, or missing its schedule. Try another date or refresh.</p>}
            </div>
          </section>
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.035] p-6 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-300">Booking summary</p><h2 className="mt-3 text-xl font-bold">{turfName}</h2>
            <div className="my-5 space-y-3 border-y border-white/10 py-5 text-sm"><div className="flex justify-between"><span className="text-zinc-400">Sport</span><span>{sport}</span></div><div className="flex justify-between"><span className="text-zinc-400">Date</span><span>{date}</span></div><div className="flex justify-between"><span className="text-zinc-400">Time</span><span>{selectedSlot || "Choose a slot"}</span></div></div>
            <p className="text-xs text-zinc-500">Indicative base rate from venue details. Final payable amount is calculated by the backend.</p><p className="mt-2 text-3xl font-black">₹{price}<span className="ml-2 text-sm font-normal text-zinc-400">/ hour</span></p>
            <button disabled={!selectedSlot || submitting || loadingTurf} onClick={handleBooking} className="mt-6 w-full rounded-xl bg-lime-300 px-4 py-4 font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Starting secure checkout…" : "Continue to payment"}</button>
            <p className="mt-3 text-center text-xs text-zinc-500">Slot confirmation is completed by the booking and payment APIs.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#090b0a] px-5 pt-28 text-white">Loading booking…</main>}>
      <BookingContent />
    </Suspense>
  );
}
