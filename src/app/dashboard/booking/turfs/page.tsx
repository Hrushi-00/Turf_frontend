"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { searchNearbyTurfs, searchTurfs, searchVenues } from "@/src/services/turfService";

type CatalogItem = {
  id: string;
  name: string;
  sport: string;
  sportsAvailable?: string[];
  location: string;
  address?: string | { street?: string; city?: string };
  price: number;
  image?: string;
  description?: string;
  available?: number;
  slots?: string;
  rating?: number;
  distanceKm?: number;
};

export default function BookingTurfsPage() {
  const [catalog, setCatalog] = useState<"turfs" | "venues">("turfs");
  const [sport, setSport] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [draft, setDraft] = useState({ q: "", city: "", minPrice: "", maxPrice: "" });
  const [filters, setFilters] = useState({ q: "", city: "", sport: "", minPrice: "", maxPrice: "" });
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [locating, setLocating] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sports = ["All", "Football", "Cricket", "Badminton", "Tennis", "Basketball"];

  useEffect(() => {
    const applySearchTerm = (q: string) => {
      setDraft((current) => ({ ...current, q }));
      setFilters((current) => ({ ...current, q }));
      setPage(1);
    };
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) applySearchTerm(initialQuery);
    const initialParams = new URLSearchParams(window.location.search);
    if (initialParams.get("nearby") === "1") findNearbyTurfs();
    const handleCatalogSearch = (event: Event) => {
      const q = (event as CustomEvent<{ q: string }>).detail?.q || "";
      applySearchTerm(q);
    };
    const handleNearbySearch = () => findNearbyTurfs();
    window.addEventListener("catalog-search", handleCatalogSearch);
    window.addEventListener("catalog-nearby", handleNearbySearch);
    return () => {
      window.removeEventListener("catalog-search", handleCatalogSearch);
      window.removeEventListener("catalog-nearby", handleNearbySearch);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (nearbyMode && (!coordinates || catalog !== "turfs")) return () => { active = false; };
    setLoading(true);
    setError("");
    const pageSize = nearbyMode ? 20 : 10;
    const query = { ...filters, page, limit: pageSize };
    const request = catalog === "turfs"
      ? nearbyMode
        ? searchNearbyTurfs({ ...coordinates, radiusKm, page, limit: 20 })
        : searchTurfs(query)
      : searchVenues({ city: filters.city, sport: filters.sport, page, limit: 10 });

    request.then((result) => {
      if (!active) return;
      if (result.success) {
        setItems(result.data);
        const pagination = "pagination" in result ? result.pagination : null;
        setHasNextPage(pagination?.hasNextPage ?? (pagination?.totalPages ? page < pagination.totalPages : result.data.length === pageSize));
      } else {
        setItems([]);
        setHasNextPage(false);
        setError(result.message || `Could not load ${catalog}.`);
      }
    }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : `Could not load ${catalog}.`);
    }).finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [catalog, filters, page, refreshKey, nearbyMode, coordinates, radiusKm]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNearbyMode(false);
    setPage(1);
    setFilters({ ...draft, sport: sport === "All" ? "" : sport.toLowerCase() });
  };

  const selectSport = (value: string) => {
    setNearbyMode(false);
    setSport(value);
    setPage(1);
    setFilters({ ...filters, sport: value === "All" ? "" : value.toLowerCase() });
  };

  function findNearbyTurfs() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location search is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setCatalog("turfs");
        setNearbyMode(true);
        setPage(1);
        setSortBy("popular");
        setLocating(false);
      },
      (locationError) => {
        const reason = locationError.code === locationError.PERMISSION_DENIED
          ? "Location permission was denied. Allow location access in your browser to find nearby turfs."
          : locationError.code === locationError.POSITION_UNAVAILABLE
            ? "Your location could not be determined. Check your device location settings and try again."
            : "Location lookup timed out. Please try again.";
        setError(reason);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  }

  const sortedItems = nearbyMode ? items : [...items].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
    return 0;
  });

  const inputClass = "mt-2 w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-lime-300";

  return (
    <main className="min-h-screen bg-black px-6 pb-20 pt-24 text-white lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-lime-300">Explore</p>
          <h1 className="mt-2 text-5xl font-black">Find a sports venue</h1>
          <p className="mt-2 text-gray-400">Search turfs by name, city, sport and budget, or find venues by city and sport.</p>
        </header>

        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[.04] p-5 md:p-7">
          <div className="mb-6 flex gap-2">
            {(["turfs", "venues"] as const).map((value) => (
              <button key={value} onClick={() => { setCatalog(value); setNearbyMode(false); setPage(1); }} className={`rounded-lg px-5 py-2.5 text-sm font-bold capitalize ${catalog === value ? "bg-white text-black" : "border border-gray-700 text-gray-300 hover:border-white/40"}`}>{value}</button>
            ))}
          </div>

          <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {catalog === "turfs" && <label className="text-sm font-semibold text-gray-300">Search<input value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Football, arena…" className={inputClass} /></label>}
            <label className="text-sm font-semibold text-gray-300">City<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Pune" className={inputClass} /></label>
            {catalog === "turfs" && <>
              <label className="text-sm font-semibold text-gray-300">Minimum price<input type="number" min="0" value={draft.minPrice} onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })} placeholder="500" className={inputClass} /></label>
              <label className="text-sm font-semibold text-gray-300">Maximum price<input type="number" min="0" value={draft.maxPrice} onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })} placeholder="1500" className={inputClass} /></label>
            </>}
            <div className="flex items-end"><button className="w-full rounded-lg bg-lime-300 px-5 py-3 font-black text-black hover:bg-lime-200">Search {catalog}</button></div>
          </form>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-bold text-gray-300">Sport</label>
              <div className="flex flex-wrap gap-2">{sports.map((value) => <button key={value} onClick={() => selectSport(value)} className={`rounded-lg px-4 py-2 text-sm font-bold ${sport === value ? "bg-white text-black" : "border border-gray-700 text-gray-400 hover:border-white/50"}`}>{value}</button>)}</div>
            </div>
            <label className="text-sm font-bold text-gray-300">Sort results
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputClass}>
                <option value="popular">Most Popular</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="rating">Highest Rated</option>
              </select>
            </label>
          </div>

          {catalog === "turfs" && <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-white/10 pt-5">
            <label className="text-sm font-semibold text-gray-300">Nearby radius (1–100 km)
              <input type="number" min="1" max="100" value={radiusKm} onChange={(event) => { const value = event.currentTarget.valueAsNumber; if (Number.isFinite(value)) setRadiusKm(Math.min(100, Math.max(1, value))); }} className={`${inputClass} w-36`} />
            </label>
            <button type="button" disabled={locating} onClick={findNearbyTurfs} className="rounded-lg border border-lime-300/60 px-5 py-3 font-bold text-lime-200 hover:bg-lime-300/10 disabled:opacity-50">{locating ? "Getting location…" : "Use my location"}</button>
            {nearbyMode && <button type="button" onClick={() => { setNearbyMode(false); setPage(1); }} className="px-3 py-3 text-sm text-gray-400 hover:text-white">Clear nearby search</button>}
          </div>}
        </section>

        <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold capitalize">{nearbyMode ? "Turfs near you" : catalog}</h2><span className="text-sm text-gray-500">Page {page} · {nearbyMode ? 20 : 10} per page{nearbyMode ? ` · within ${radiusKm} km` : ""}</span></div>
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? <p className="col-span-full py-16 text-center text-gray-400">Searching {catalog}…</p>
            : error ? <div className="col-span-full py-12 text-center"><p className="text-red-300">{error}</p><button onClick={() => setRefreshKey((current) => current + 1)} className="mt-4 rounded-lg border border-white/20 px-5 py-2">Retry</button></div>
              : sortedItems.length === 0 ? <p className="col-span-full py-16 text-center text-gray-400">{nearbyMode ? "No nearby turfs found. Some venues may not have map coordinates yet." : `No ${catalog} match those filters.`}</p>
                : sortedItems.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] transition hover:-translate-y-1 hover:border-white/25">
                  {catalog === "turfs" ? <Link href={`/dashboard/booking/turfs/${encodeURIComponent(item.id)}`} aria-label={`View details for ${item.name}`} className="block">
                    <div className="relative h-48 bg-gradient-to-br from-lime-950 to-zinc-900">{item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}<span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-black text-black">{item.available ? `${item.available} slots` : "SPORTS TURF"}</span></div>
                  </Link> : <div className="relative h-48 bg-gradient-to-br from-lime-950 to-zinc-900">{item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}<span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-black text-black">VENUE</span></div>}
                  <div className="p-6">{catalog === "turfs" ? <Link href={`/dashboard/booking/turfs/${encodeURIComponent(item.id)}`} className="text-xl font-bold hover:text-lime-200">{item.name}</Link> : <h3 className="text-xl font-bold">{item.name}</h3>}<p className="mt-1 text-sm text-gray-400">{item.location} · {item.sport}</p>{nearbyMode && typeof item.distanceKm === "number" && <p className="mt-2 text-sm font-bold text-lime-300">{item.distanceKm.toFixed(1)} km away</p>}{item.address && <p className="mt-2 line-clamp-2 text-xs text-gray-500">{typeof item.address === "string" ? item.address : [item.address.street, item.address.city].filter(Boolean).join(", ")}</p>}
                    {item.description && <p className="mt-3 line-clamp-2 text-sm text-gray-400">{item.description}</p>}
                    {catalog === "turfs" && <div className="my-5"><p className="text-2xl font-black">₹{item.price}<span className="ml-2 text-xs font-normal text-gray-500">per hour</span></p>{item.slots && <p className="mt-1 text-xs text-gray-500">{item.slots}</p>}</div>}
                    {catalog === "turfs" && <Link href={`/dashboard/booking/turfs/${encodeURIComponent(item.id)}`} className="mb-3 block rounded-lg border border-white/20 py-3 text-center text-sm font-bold text-white hover:border-lime-300">VIEW DETAILS</Link>}
                    {catalog === "turfs" && <Link href={`/dashboard/booking?turf=${encodeURIComponent(item.id)}`} className="block rounded-lg bg-white py-3 text-center font-black text-black">BOOK NOW</Link>}
                  </div>
                </article>)}
        </section>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-white/20 px-5 py-3 font-bold disabled:opacity-40">Previous</button>
          <button disabled={!hasNextPage || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-white/20 px-5 py-3 font-bold disabled:opacity-40">Next</button>
        </div>
      </div>
    </main>
  );
}
