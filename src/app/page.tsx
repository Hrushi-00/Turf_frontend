"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getApprovedTurfs } from "@/src/services/turfService";

export default function Home() {
  const [allTurfs, setAllTurfs] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [booked, setBooked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const sports = ["All", "Football", "Cricket", "Badminton", "Tennis", "Basketball"];

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    setLoading(true);
    const result = await getApprovedTurfs();
    if (result.success) {
      setAllTurfs(result.data);
    }
    setLoading(false);
  };

  const filtered = filter === "All"
    ? allTurfs
    : allTurfs.filter(t => t.sportsAvailable && t.sportsAvailable.includes(filter));

  const features = [
    { icon: "flash", title: "Instant Booking", desc: "Confirm your slot in under 30 seconds. Lightning-fast booking" },
    { icon: "pin", title: "Nearby Locations", desc: "Find premium turfs near you with real-time availability" },
    { icon: "lock", title: "Secure Payments", desc: "100% encrypted transactions. Pay online or at venue." },
    { icon: "calendar", title: "Easy Scheduling", desc: "Flexible scheduling with instant confirmation and reminders" },
  ];

  const renderFeatureIcon = (type: string) => {
    const baseClass = "h-7 w-7 text-white";
    switch (type) {
      case "flash":
        return (
          <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
          </svg>
        );
      case "pin":
        return (
          <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
            <path d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="10" r="2.5" fill="currentColor" />
          </svg>
        );
      case "lock":
        return (
          <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case "calendar":
        return (
          <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M4 9h16" stroke="currentColor" strokeWidth="2" />
            <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 13h3M13 13h3M8 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden" style={{ fontFamily:"'Poppins','Bebas Neue',sans-serif", backgroundColor:"#0B0B0B" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:8px}
        ::-webkit-scrollbar-track{background:#0B0B0B}
        ::-webkit-scrollbar-thumb{background:#ffffff;border-radius:99px}

        body { font-family: 'Poppins', sans-serif; }
        h1, h2, h3, .heading { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; font-weight: 700; }

        .stat-num{
          color: #ffffff;
          font-weight: 900;
        }

        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .6s ease both}
        .d1{animation-delay:.1s}.d2{animation-delay:.25s}.d3{animation-delay:.4s}.d4{animation-delay:.55s}

        .turf-card{transition:all .3s ease}
        .turf-card:hover{transform:translateY(-8px)}
        .turf-card:hover .card-image{transform:scale(1.08)}

        .card-image{transition:transform .3s ease;overflow:hidden;border-radius:12px}

        .live-dot{animation:livepulse 2s ease-in-out infinite}
        @keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.2)}}

        .cta-primary{
          background: #ffffff;
          color: #0B0B0B;
          position:relative;overflow:hidden;transition:all .3s;
          box-shadow: 0 4px 12px rgba(255,255,255,.2);
        }
        .cta-primary:hover{
          background: #f0f0f0;
          box-shadow: 0 8px 20px rgba(255,255,255,.3);
          transform: translateY(-2px);
        }

        .cta-secondary{
          border: 2px solid #ffffff;
          color: #ffffff;
          transition: all .3s;
          position: relative;
        }
        .cta-secondary:hover{
          background: rgba(255,255,255,.08);
          box-shadow: 0 4px 12px rgba(255,255,255,.15);
        }

        .glass{
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.08);
        }

        .energy-pulse{animation:energypulse 2s ease-in-out infinite}
        @keyframes energypulse{0%,100%{opacity:.8}50%{opacity:1}}
      `}</style>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center px-6 lg:px-16 pt-24 pb-20 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-black/25 to-slate-900/60"/>
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/051/434/372/small/football-field-at-night-with-illuminated-goalposts-and-fresh-green-turf-under-stadium-lights-photo.jpeg"
            alt="Football field at night"
            className="w-full h-full object-cover"
            style={{
              objectPosition: "center 38%",
              filter: "brightness(0.68) saturate(0.92) contrast(1.05)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55"/>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"/>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-3xl pointer-events-none"/>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="au d1 inline-flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="live-dot w-2.5 h-2.5 rounded-full bg-white inline-block"/>
            <span className="text-white text-xs font-bold tracking-wide">LIVE BOOKINGS AVAILABLE</span>
          </div>

          <h1 className="au d2 heading text-6xl md:text-7xl xl:text-8xl leading-[0.95] tracking-tight mb-6 max-w-4xl">
            Book Your Game.<br/>
            <span className="stat-num">Play Like a Pro.</span>
          </h1>

          <p className="au d3 text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
            Find and book premium sports turfs near you instantly. Real-time availability, instant confirmation, and zero hassle.
          </p>

          <div className="au d4 flex flex-col sm:flex-row items-start gap-4 mb-12">
            <a href="/dashboard" className="cta-primary text-base font-black text-black px-8 py-4 rounded-lg hover:shadow-2xl transition-all flex items-center gap-2">
              <span>BOOK NOW</span>
              <span className="text-xl">→</span>
            </a>
            <a href="/dashboard/booking/turfs" className="cta-secondary text-base font-bold px-8 py-4 rounded-lg">
              EXPLORE TURFS
            </a>
          </div>

          <div className="au d4 flex flex-wrap gap-3">
            {["Football", "Cricket", "Badminton", "Tennis", "Basketball"].map(s => (
              <button
                key={s}
                className="px-5 py-2.5 rounded-full border-2 border-gray-700 text-white font-bold text-sm transition-all hover:border-white hover:bg-white/10 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* BROWSE BY SPORT SECTION */}
      <section className="px-6 lg:px-16 py-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs text-white font-black tracking-widest uppercase mb-6 heading justify-center">
              <span className="w-6 h-px bg-white inline-block"/> Browse Sports
            </span>
            <h2 className="heading text-5xl md:text-6xl tracking-tight mb-4">Choose Your Sport</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Find and book turfs for your favorite sport</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[
              { name: "Football", count: "45 turfs", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=85" },
              { name: "Cricket", count: "38 turfs", image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=85" },
              { name: "Badminton", count: "32 turfs", image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=85" },
              { name: "Tennis", count: "28 turfs", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=85" },
              { name: "Basketball", count: "35 turfs", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85" },
              { name: "Volleyball", count: "22 turfs", image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=85" },
              { name: "Hockey", count: "18 turfs", image: "https://images.unsplash.com/photo-1752401978234-d2aff41b65c9?auto=format&fit=crop&w=900&q=85" },
              { name: "Boxing", count: "24 turfs", image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=85" },
            ].map((sport, i) => (
              <a
                key={sport.name}
                href="/dashboard/booking/turfs"
                className="au group relative flex h-56 flex-col justify-end overflow-hidden rounded-xl border border-gray-700 bg-black text-left transition-all duration-300 hover:border-white/50"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <img src={sport.image} alt={`${sport.name} players`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
                <div className="relative z-10 p-5">
                  <h3 className="heading mb-1 text-xl font-black">{sport.name}</h3>
                  <p className="text-sm text-gray-300">{sport.count}</p>
                  <span className="mt-3 inline-block text-xs font-bold text-lime-200 opacity-0 transition-opacity group-hover:opacity-100">Browse Now</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE PROMO SECTION */}
      <section className="relative flex min-h-screen items-stretch px-0 py-0">
        <div className="relative grid min-h-screen w-full max-w-none overflow-hidden border-0 bg-[#10120f] lg:grid-cols-[.85fr_1.15fr]">
          <div className="relative flex flex-col items-start justify-center overflow-hidden p-8 sm:p-12 lg:p-20 xl:p-28">
            <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-lime-300/10 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-4 select-none text-[9rem] font-black leading-none text-white/[.025] sm:text-[13rem]">PLAY</div>
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.28em] text-lime-300">
                <span className="h-px w-8 bg-lime-300" /> TurfBook Sports Club
              </span>
              <h2 className="heading mt-6 max-w-xl text-5xl font-black uppercase leading-[.9] tracking-tight sm:text-6xl xl:text-7xl">Pick your game.<br /><span className="text-lime-300">Own your ground.</span></h2>
              <p className="mt-5 max-w-md text-base leading-7 text-gray-300">From kickoff to final point, find a place to play your way.</p>
              <Link href="/dashboard/booking/turfs" className="cta-primary mt-8 inline-flex items-center gap-3 rounded-lg px-7 py-4 text-sm font-black text-black">
                EXPLORE TURFS <span aria-hidden="true" className="text-lg">→</span>
              </Link>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-gray-500">Football <span className="mx-2 text-lime-300">/</span> Cricket <span className="mx-2 text-lime-300">/</span> Hoops <span className="mx-2 text-lime-300">/</span> More</p>
            </div>
          </div>
          <div className="relative min-h-[45vh] overflow-hidden border-t border-white/10 lg:min-h-screen lg:border-l lg:border-t-0">
            <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=90" alt="Football match on a lit sports field" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-black/30" />
            <div aria-hidden="true" className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(115deg, transparent 49.7%, rgba(255,255,255,.8) 50%, transparent 50.3%), linear-gradient(0deg, transparent 49.7%, rgba(255,255,255,.45) 50%, transparent 50.3%)" }} />
            <div className="absolute bottom-6 right-6 w-36 overflow-hidden rounded-xl border border-white/30 bg-black shadow-2xl sm:bottom-8 sm:right-8 sm:w-48">
              <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=85" alt="Basketball court" loading="lazy" className="h-24 w-full object-cover sm:h-32" />
              <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white sm:text-xs">Make it game day</p>
            </div>
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-white backdrop-blur sm:left-8 sm:top-8"><span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" /> Made for game day</div>
            <div className="absolute bottom-8 left-8 hidden text-7xl font-black uppercase italic leading-none text-white/80 drop-shadow-lg sm:block">Game<br />on.</div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-6 lg:mx-16"/>

      {/* FEATURED TURFS SECTION */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="inline-flex items-center gap-2 text-xs text-white font-black tracking-widest uppercase mb-4 heading">
                <span className="w-6 h-px bg-white inline-block"/> Hot Picks
              </span>
              <h2 className="heading text-5xl md:text-6xl tracking-tight">Premium Turfs</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sports.map(s=>(
                <button key={s} onClick={()=>setFilter(s)}
                  className={`text-xs px-5 py-2.5 rounded-lg border font-black transition-all ${filter===s?"bg-white border-white text-black":"bg-transparent border-gray-600 text-gray-400 hover:border-white/60 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-lg">Loading premium turfs...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-lg">No turfs available for this sport</p>
              </div>
            ) : (
              filtered.map((t, i) => (
                <article key={t.id} className={`au turf-card group bg-black/40 border border-gray-700 rounded-2xl overflow-hidden transition-all hover:border-white/40`} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                  <Link href={`/dashboard/booking/turfs/${encodeURIComponent(t.id)}`} aria-label={`View ${t.name} details`} className="card-image relative block h-48 overflow-hidden bg-gradient-to-br from-white/10 to-white/5">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                    {t.metaInfo?.isFeatured && (
                      <span className="absolute top-4 left-4 text-xs font-black px-4 py-1.5 rounded-full bg-white text-black">
                        Featured
                      </span>
                    )}
                    {t.metaInfo?.isTrending && (
                      <span className="absolute top-4 left-4 text-xs font-black px-4 py-1.5 rounded-full bg-white text-black">
                        Trending
                      </span>
                    )}
                  </Link>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link href={`/dashboard/booking/turfs/${encodeURIComponent(t.id)}`} className="heading text-lg font-black mb-1 hover:text-lime-200">{t.name}</Link>
                        <p className="text-gray-500 text-sm">{t.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">₹{t.price}</p>
                        <p className="text-gray-500 text-xs">per hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-700">
                      <span>Rating: <span className="text-white font-bold">{t.rating || "N/A"}</span></span>
                      <span>·</span>
                      <span className="text-white font-bold">{t.sportsAvailable?.[0] || t.sport}</span>
                      <span>·</span>
                      <span>{t.slots}</span>
                    </div>
                    <Link
                      href={`/dashboard/booking/turfs/${encodeURIComponent(t.id)}`}
                      className="w-full py-3 rounded-lg text-sm font-black transition-all duration-300 block text-center cta-primary text-black hover:shadow-xl"
                    >
                      VIEW DETAILS
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="text-center mt-16">
            <a href="/dashboard/booking/turfs" className="inline-flex items-center gap-2 text-sm font-black text-white border-2 border-white px-8 py-4 rounded-lg hover:bg-white/10 transition-all duration-200">
              LOAD MORE TURFS
            </a>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-6 lg:mx-16"/>

      {/* FEATURES SECTION */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-24 lg:px-16">
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-lime-300/[.06] blur-3xl"/>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/[.04] blur-3xl"/>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12 text-center sm:mb-16">
            <span className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[.06] px-4 py-2 text-[10px] font-black uppercase tracking-[.24em] text-lime-200 heading sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.9)]"/> Made for game day
            </span>
            <h2 className="heading mb-4 text-4xl tracking-tight sm:text-5xl md:text-6xl">Built for Players</h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-lg">Everything you need to find your next game, book a great venue, and get straight to play.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {features.map((f,i)=>(
              <div key={f.title} className="au group relative min-h-60 overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-200/40 hover:bg-[#151713] sm:p-7" style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-200/70 to-transparent opacity-60 transition-opacity group-hover:opacity-100"/>
                <span className="absolute -right-6 -top-10 select-none font-black italic leading-none text-white/[.025] heading text-[9rem]">{String(i + 1).padStart(2, "0")}</span>
                <div className="relative mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-lime-200/20 bg-lime-200/10 text-lime-100 transition-colors group-hover:bg-lime-200/15 sm:h-14 sm:w-14">
                    {renderFeatureIcon(f.icon)}
                  </div>
                  <span className="text-[10px] font-bold tracking-[.2em] text-gray-600">FEATURE {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="relative mb-3 heading text-xl font-black uppercase tracking-wide">{f.title}</h3>
                <p className="relative max-w-xs text-sm leading-6 text-gray-400">{f.desc}</p>
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-lime-200/30 via-white/10 to-transparent sm:left-7 sm:right-7"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden border-y border-white/10 bg-[#0b0c09] px-5 py-20 sm:px-8 sm:py-24 lg:px-16">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(190,242,100,.09), transparent 55%)" }}/>
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 text-center sm:mb-16">
            <span className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[.06] px-4 py-2 text-[10px] font-black uppercase tracking-[.24em] text-lime-200 heading sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.9)]"/> Your game starts here
            </span>
            <h2 className="heading mb-4 text-4xl tracking-tight sm:text-5xl md:text-6xl">Play in 3 Steps</h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">From finding your venue to kickoff, booking your next game is easy.</p>
          </div>
          <div className="relative grid gap-4 md:grid-cols-3 md:gap-5">
            <div className="absolute left-[16.66%] right-[16.66%] top-[2.15rem] hidden h-px bg-gradient-to-r from-lime-300/10 via-lime-300/40 to-lime-300/10 md:block"/>
            {[
              {icon:"01",t:"Search",        d:"Enter your city and preferred sport to discover available premium turfs."},
              {icon:"02",t:"Pick a Slot",   d:"Browse real-time availability and choose the perfect date and time."},
              {icon:"03",t:"Confirm & Play",d:"Secure payment and instant confirmation. Ready to dominate the game!"},
            ].map((s,i)=>(
              <div key={s.t} className="au group relative overflow-hidden rounded-2xl border border-white/10 bg-[#11120f] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-200/35 sm:p-7 md:min-h-72 md:text-center" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                <div className="absolute right-4 top-0 select-none font-black italic leading-none text-white/[.035] heading text-[8rem]">{s.icon}</div>
                <div className="relative mb-6 flex items-center gap-4 md:mb-8 md:flex-col md:gap-0">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-lime-200/30 bg-[#171b12] text-lg font-black text-lime-200 shadow-[0_0_24px_rgba(190,242,100,.08)] transition-all group-hover:border-lime-200/60 group-hover:bg-lime-200/10">
                    {s.icon}
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-lime-200 text-[10px] font-black text-black">{i+1}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[.2em] text-gray-500 md:mt-4">Step {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="relative mb-2 heading text-xl font-black uppercase tracking-wide sm:text-2xl">{s.t}</h3>
                <p className="relative mx-auto max-w-xs text-sm leading-6 text-gray-400">{s.d}</p>
                {i < 2 && <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-lime-200/25 via-white/10 to-transparent md:hidden"/>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(190,242,100,.10),transparent_58%)]"/>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-px max-w-5xl -translate-y-1/2 bg-gradient-to-r from-transparent via-lime-200/20 to-transparent"/>

        <div className="relative z-10 mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#10120e] px-5 py-12 text-center shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:px-10 sm:py-16 md:px-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(to bottom, black, transparent 85%)" }}/>
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-lime-200/10 sm:h-96 sm:w-96"/>
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-lime-200/[.07] sm:h-80 sm:w-80"/>

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/[.07] px-4 py-2.5 sm:mb-9 sm:px-5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-200"/>
              <span className="text-[10px] font-black tracking-[.16em] text-lime-100 sm:text-xs sm:tracking-[.2em]">50,000+ GAMES BOOKED THIS MONTH</span>
            </div>

          <h2 className="heading mb-5 text-4xl leading-[1.05] tracking-tight sm:mb-6 sm:text-5xl md:text-7xl">
            Ready to <span className="text-lime-200">Dominate the Game?</span>
            </h2>

          <p className="mx-auto mb-8 max-w-2xl text-sm leading-6 text-gray-400 sm:mb-10 sm:text-lg sm:leading-8">
            Join players booking their perfect turf every day. Find a venue, lock in your slot, and get ready to play.
            </p>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/dashboard/booking/turfs" className="cta-primary inline-flex min-h-12 items-center justify-center gap-3 rounded-xl px-7 py-3.5 text-sm font-black text-black transition-all hover:shadow-2xl sm:min-h-14 sm:px-9 sm:text-base">
              <span>EXPLORE TURFS</span>
              <span>→</span>
            </Link>
            <Link href="/business/register" className="cta-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3.5 text-sm font-black transition-all hover:border-lime-200 hover:text-lime-100 sm:min-h-14 sm:px-9 sm:text-base">
              LIST YOUR TURF
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 lg:px-16 py-16 border-t border-white/20 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-black font-black">T</div>
                <span className="heading text-xl">TURFBOOK</span>
              </div>
              <p className="text-gray-500 text-sm">India's #1 sports turf booking platform.</p>
            </div>
            <div>
              <h4 className="heading text-sm font-black mb-4 text-white">PRODUCT</h4>
              <div className="space-y-2">
                {["Explore Turfs","How it Works","Pricing"].map(l=>(
                  <a key={l} href="#" className="text-gray-500 text-sm hover:text-white transition-colors block">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="heading text-sm font-black mb-4 text-white">COMPANY</h4>
              <div className="space-y-2">
                {["About","Blog","Careers"].map(l=>(
                  <a key={l} href="#" className="text-gray-500 text-sm hover:text-white transition-colors block">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="heading text-sm font-black mb-4 text-white">LEGAL</h4>
              <div className="space-y-2">
                {["Privacy","Terms","Support"].map(l=>(
                  <a key={l} href="#" className="text-gray-500 text-sm hover:text-white transition-colors block">{l}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"/>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">© 2025 TURFBOOK. All rights reserved. | Crafted for champions.</p>
            <div className="flex gap-4">
              {["Twitter","Instagram","Facebook"].map(l=>(
                <a key={l} href="#" className="text-white hover:text-gray-400 transition-colors text-xs font-bold">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
