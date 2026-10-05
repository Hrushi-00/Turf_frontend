"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getTurfById } from "@/src/services/turfService";
import { platformApi } from "@/src/services/platformService";

type Turf = {
  _id?: string;
  id?: string;
  turfDetails?: {
    turfName?: string;
    description?: string;
    sportsAvailable?: string[];
    surfaceType?: string;
    dimensions?: { length?: number; width?: number; unit?: string };
    capacity?: number;
  };
  location?: { address?: string; landmark?: string; city?: string; state?: string; zipCode?: string };
  pricing?: { weekdayRate?: number; weekendRate?: number; seasonalRate?: Record<string, number>; currency?: string; minimumBookingHours?: number; cancellationPolicy?: string };
  availability?: { openingTime?: string; closingTime?: string; closedDays?: string[] };
  amenities?: string[];
  gallery?: { mainImage?: string; thumbnailImages?: string[] };
  rating?: number | { average?: number; value?: number };
  averageRating?: number;
  reviewCount?: number;
};

type TurfReview = { rating?: number };

const unwrapTurf = (value: any): Turf | null => value?.data?.data || value?.data?.turf || value?.data || value?.turf || null;

export default function TurfDetailsPage() {
  const params = useParams<{ id: string }>();
  const turfId = params.id;
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<TurfReview[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTurfById(turfId).then((result) => {
      if (!active) return;
      if (result.success) {
        const found = unwrapTurf(result.data);
        if (found) setTurf(found);
        else setError("The turf details were not found.");
      } else setError(result.message || "Could not load this turf.");
    }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Could not load this turf.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [turfId]);

  useEffect(() => {
    let active = true;
    platformApi.publicReviews({ targetType: "FACILITY", targetId: turfId, page: 1, limit: 100 }).then((result) => {
      if (!active || !result.success) return;
      const payload = result.data as any;
      const list = Array.isArray(payload) ? payload : payload?.reviews || payload?.items || payload?.results || payload?.data || [];
      if (Array.isArray(list)) setReviews(list);
    }).catch(() => {});
    return () => { active = false; };
  }, [turfId]);

  const details = turf?.turfDetails;
  const location = turf?.location;
  const pricing = turf?.pricing;
  const schedule = turf?.availability;
  const pictures = [turf?.gallery?.mainImage, ...(turf?.gallery?.thumbnailImages || [])].filter((url): url is string => Boolean(url));
  const currency = pricing?.currency === "INR" || !pricing?.currency ? "₹" : `${pricing.currency} `;
  const reviewRatings = reviews.map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating) && rating > 0);
  const storedRating = typeof turf?.rating === "number" ? turf.rating : turf?.rating?.average ?? turf?.rating?.value ?? turf?.averageRating;
  const rating = storedRating || (reviewRatings.length ? reviewRatings.reduce((sum, value) => sum + value, 0) / reviewRatings.length : null);
  const reviewCount = turf?.reviewCount ?? reviewRatings.length;

  return (
    <main className="min-h-screen bg-[#090b0a] px-5 pb-20 pt-28 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/booking/turfs" className="text-sm text-lime-300 hover:text-lime-200">← Back to turfs</Link>
        {loading ? <p className="py-24 text-center text-zinc-400">Loading turf details…</p>
          : error || !turf ? <div role="alert" className="mt-8 rounded-xl border border-red-900 bg-red-950/40 p-5 text-red-200">{error || "Turf not found."}</div>
            : <>
              <header className="mb-8 mt-5 flex flex-wrap items-end justify-between gap-5">
                <div><p className="text-xs font-bold uppercase tracking-[.24em] text-lime-300">Turf details</p><h1 className="mt-2 text-4xl font-black md:text-5xl">{details?.turfName || "Sports turf"}</h1><p className="mt-2 text-zinc-400">{[location?.city, location?.state].filter(Boolean).join(", ")}</p><p className="mt-3 flex items-center gap-2 text-sm"><span className="text-amber-300" aria-label={rating ? `${rating.toFixed(1)} out of 5 stars` : "No rating yet"}>★★★★★</span><strong>{rating ? rating.toFixed(1) : "New"}</strong><span className="text-zinc-500">{reviewCount ? `(${reviewCount} reviews)` : "· No reviews yet"}</span></p></div>
                <Link href={`/dashboard/booking?turf=${encodeURIComponent(turfId)}`} className="rounded-xl bg-lime-300 px-7 py-4 font-black text-black hover:bg-lime-200">Check slots & book</Link>
              </header>

              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <section className="space-y-5">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04]">
                    {pictures[0] ? <img src={pictures[0]} alt={details?.turfName || "Turf"} className="h-[280px] w-full object-cover md:h-[420px]" /> : <div className="h-[280px] bg-gradient-to-br from-lime-950 to-zinc-900 md:h-[420px]" />}
                    {pictures.length > 1 && <div className="grid grid-cols-3 gap-2 p-3">{pictures.slice(1, 4).map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${details?.turfName || "Turf"} photo ${index + 2}`} className="h-24 w-full rounded-lg object-cover" />)}</div>}
                  </div>
                  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><h2 className="text-xl font-bold">About this turf</h2><p className="mt-3 whitespace-pre-line leading-7 text-zinc-300">{details?.description || "No description provided."}</p></section>
                  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><h2 className="text-xl font-bold">Amenities</h2>{turf.amenities?.length ? <div className="mt-4 flex flex-wrap gap-2">{turf.amenities.map((amenity) => <span key={amenity} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300">{amenity}</span>)}</div> : <p className="mt-3 text-zinc-400">No amenities listed.</p>}</section>
                </section>

                <aside className="space-y-5">
                  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
                    <h2 className="text-xl font-bold">Sports & facility</h2>
                    <dl className="mt-4 space-y-3 text-sm">{[
                      ["Sports", details?.sportsAvailable?.join(", ")],
                      ["Surface", details?.surfaceType],
                      ["Capacity", details?.capacity],
                      ["Dimensions", details?.dimensions ? `${details.dimensions.length ?? "—"} × ${details.dimensions.width ?? "—"} ${details.dimensions.unit || ""}` : ""],
                    ].map(([label, value]) => value != null && value !== "" && <div key={label} className="flex justify-between gap-5 border-b border-white/5 pb-3"><dt className="text-zinc-500">{label}</dt><dd className="text-right text-zinc-200">{value}</dd></div>)}</dl>
                  </section>
                  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
                    <h2 className="text-xl font-bold">Pricing</h2>
                    <dl className="mt-4 space-y-3 text-sm">{[
                      ["Weekday", pricing?.weekdayRate], ["Weekend", pricing?.weekendRate],
                      ...Object.entries(pricing?.seasonalRate || {}).map(([season, rate]) => [season, rate] as [string, number]),
                      ["Minimum booking", pricing?.minimumBookingHours ? `${pricing.minimumBookingHours} hour(s)` : ""],
                    ].map(([label, value]) => value != null && value !== "" && <div key={label} className="flex justify-between gap-5 border-b border-white/5 pb-3"><dt className="capitalize text-zinc-500">{label}</dt><dd className="font-semibold text-zinc-200">{typeof value === "number" ? `${currency}${value}` : value}</dd></div>)}</dl>
                  </section>
                  <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
                    <h2 className="text-xl font-bold">Location & hours</h2>
                    <p className="mt-4 text-sm leading-6 text-zinc-300">{[location?.address, location?.landmark, location?.city, location?.state, location?.zipCode].filter(Boolean).join(", ") || "Address not provided."}</p>
                    <p className="mt-4 text-sm text-zinc-300">{schedule?.openingTime && schedule?.closingTime ? `${schedule.openingTime} – ${schedule.closingTime}` : "Hours not provided."}</p>
                    {schedule?.closedDays?.length ? <p className="mt-2 text-sm text-zinc-500">Closed: {schedule.closedDays.join(", ")}</p> : null}
                    {pricing?.cancellationPolicy && <p className="mt-4 border-t border-white/10 pt-4 text-sm text-zinc-400">Cancellation: {pricing.cancellationPolicy}</p>}
                  </section>
                </aside>
              </div>
              <div className="mt-8"><Link href={`/dashboard/booking?turf=${encodeURIComponent(turfId)}`} className="inline-flex rounded-xl bg-lime-300 px-7 py-4 font-black text-black hover:bg-lime-200">Book this turf</Link></div>
            </>}
      </div>
    </main>
  );
}
