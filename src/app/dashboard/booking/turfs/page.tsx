"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getApprovedTurfs } from "@/src/services/turfService";

export default function BookingTurfsPage() {
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [turfs, setTurfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sports = ["All", "Football", "Cricket", "Badminton", "Tennis", "Basketball"];

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    setLoading(true);
    setError("");
    const result = await getApprovedTurfs();
    if (result.success) {
      setTurfs(result.data);
    } else {
      setError(result.message || "Failed to load turfs");
    }
    setLoading(false);
  };

  const filteredTurfs = turfs.filter(t =>
    filter === "All" || (t.sportsAvailable && t.sportsAvailable.includes(filter))
  );

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

        .turf-card{
          transition: all .3s ease;
        }
        .turf-card:hover{
          transform: translateY(-8px);
        }
        .turf-card:hover .card-image{
          transform: scale(1.08);
        }

        .card-image{
          transition: transform .3s ease;
          overflow: hidden;
          border-radius: 12px;
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-black to-black pointer-events-none"/>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 blur-3xl pointer-events-none"/>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-5xl tracking-wide mb-2">Browse Turfs</h1>
          <p className="text-gray-400">Choose your perfect sports venue</p>
        </div>

        {/* Filters */}
        <div className="glass p-6 rounded-xl mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">Sport</label>
              <div className="flex flex-wrap gap-2">
                {sports.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setFilter(sport)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      filter === sport
                        ? "bg-white text-black"
                        : "border border-gray-700 text-gray-400 hover:border-white/50"
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-white"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Turfs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">Loading turfs...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchTurfs}
                className="mt-4 px-6 py-2 bg-white text-black rounded-lg font-bold hover:bg-gray-200"
              >
                Retry
              </button>
            </div>
          ) : filteredTurfs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No turfs found</p>
            </div>
          ) : (
            filteredTurfs.map(turf => (
              <div key={turf.id} className="turf-card group glass rounded-xl overflow-hidden">
                <div className="card-image relative h-48 overflow-hidden">
                  <img src={turf.image} alt={turf.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30"/>
                  <span className="absolute top-4 left-4 bg-white text-black px-4 py-1.5 rounded-full text-xs font-black">
                    {turf.available || 0} slots
                  </span>
                </div>

                <div className="p-6">
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-xl font-black mb-2">{turf.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{turf.location} · {turf.sport || turf.sportsAvailable?.[0]}</p>

                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-2xl font-black text-white">₹{turf.price}</p>
                      <p className="text-xs text-gray-500">per hour</p>
                    </div>
                    <p className="text-sm font-bold">{turf.rating || "N/A"}</p>
                  </div>

                  <p className="text-xs text-gray-400 mb-6">{turf.slots}</p>

                  <Link
                    href={`/dashboard/booking?turf=${turf.id}`}
                    className="cta-primary block text-center py-3 rounded-lg font-black text-black transition-all"
                  >
                    BOOK NOW
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-16">
          <button className="px-8 py-4 border-2 border-white text-white font-black rounded-lg hover:bg-white/10 transition-all">
            LOAD MORE TURFS
          </button>
        </div>
      </div>
    </div>
  );
}
